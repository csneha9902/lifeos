from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import pdfplumber
import re
import io as io_module
from io import StringIO
import httpx
import os

app = FastAPI(title="LifeOS Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── KEYWORD CATEGORIZER ──────────────────────────────────
KEYWORD_CATEGORIES: Dict[str, List[str]] = {
    "food_delivery": [
        "SWIGGY", "ZOMATO", "EATSURE", "BOX8", "DOMINOS", "KFC",
        "MCDONALD", "PIZZA HUT", "BURGER KING", "SUBWAY", "DUNKIN",
        "TASTINGO", "FAASOS", "REBEL FOODS", "EATCLUB", "EAT CLUB",
    ],
    "groceries": [
        "BIGBASKET", "BIG BASKET", "BB DAILY", "BLINKIT", "DUNZO",
        "DMART", "JIO MART", "SPENCER", "ZEPTO", "ZEPTO MARKETPLACE",
        "ADISHWAR", "VILLAGE HYPER", "RELIANCE FRESH", "MORE SUPERMARKET",
        "NATURE BASKET", "SPAR", "LULU", "VILLAGE MARKET", "MINI MART", 
        "TAYI FOODS", "JUSTVEND", "LOCAL MART", "KIRANA"
    ],
    "shopping": [
        "AMAZON", "FLIPKART", "AJIO", "MYNTRA", "NYKAA", "TATA CLIQ",
        "MEESHO", "SNAPDEAL", "SHOPSY", "BEWAKOOF", "MAMAEARTH",
        "PURPLLE", "BOAT", "NOISE", "DECATHLON",
    ],
    "entertainment": [
        "NETFLIX", "SPOTIFY", "PRIME VIDEO", "HOTSTAR", "SONY LIV",
        "BOOKMYSHOW", "YOUTUBE PREMIUM", "DISNEY", "ZEE5", "MXPLAYER",
        "APPLE MUSIC", "GAANA", "WYNK", "JIO CINEMA", "LIONSGATE",
    ],
    "education": [
        "UDEMY", "COURSERA", "UNACADEMY", "BYJUS", "SKILLSHARE",
        "LEETCODE", "BOOKS", "COURSE", "INSTITUTE", "COLLEGE",
        "UNIVERSITY", "SCHOOL", "TUITION", "COACHING", "BMS INSTITUTE",
        "SOPL", "EXAM", "CERTIFICATE",
    ],
    "bills_utilities": [
        "ELECTRICITY", "BESCOM", "TANGEDCO", "WATER BILL", "AIRTEL",
        "JIO PREPAID", "JIO POSTPAID", "JIO RECHARGE", "VI ", "RECHARGE",
        "BROADBAND", "WIFI", "GAS", "POSTPAID", "BBPS", "MSEB",
        "TATA POWER", "ADANI ELECTRICITY", "PHONE BILL", "MOBILE BILL",
        "KA01", "TOLL", "FASTAG",
    ],
    "upi_p2p": [
        "UPI", "PAYTM", "PHONEPE", "GOOGLEPAY", "GOOGLE PAY", "GPAY",
        "BHIM", "NEFT", "IMPS", "SUPER.MONEY",
    ],
    "travel": [
        "UBER", "OLA", "RAPIDO", "IRCTC", "INDIGO", "REDBUS",
        "METRO", "PETROL", "BMTC", "BANGALORE METRO", "DELHI METRO",
        "MUMBAI METRO", "KSRTC", "FUEL", "HP PETROL", "INDIAN OIL",
        "MAKE MY TRIP", "GOIBIBO", "YATRA", "AIR INDIA", "SPICEJET",
        "BMTC BUS",
    ],
    "health": [
        "APOLLO", "MEDPLUS", "PHARMACY", "GYM", "CULT", "HOSPITAL",
        "CLINIC", "PRACTO", "PHARMEASY", "NETMEDS", "1MG", "TATA 1MG",
        "HEALTHKART", "DOCTOR", "DIAGNOSTIC", "LAB",
    ],
    "savings": [
        "MUTUAL FUND", "SIP", "ZERODHA", "GROWW", "PPF", "FD ",
        "RD ", "SAVINGS", "INVESTMENT", "KUVERA", "PAYTM MONEY",
        "ET MONEY", "SCRIPBOX", "SMALLCASE", "UPSTOX", "ANGEL",
        "HDFC SECURITIES", "ICICI DIRECT",
    ],
    "other": [],
}


def categorize_description(description: str) -> str:
    # Strip common UPI prefixes before matching
    text = description.upper()
    text = re.sub(r"^PAID TO\s+", "", text)
    text = re.sub(r"^RECEIVED FROM\s+", "", text)
    text = re.sub(r"^UPI[-/]\s*", "", text)
    text = text.strip()

    if "BANK INTEREST" in text:
        return "other"
    if "INTEREST CREDIT" in text:
        return "other"
    if "SUPER.MONEY" in text:
        return "other"
    if "CASHBACK" in text:
        return "other"

    for category, keywords in KEYWORD_CATEGORIES.items():
        if category == "other":
            continue
        for kw in keywords:
            if kw in text:
                return category

    # Secondary heuristic: person-to-person UPI transfer
    # If description looks like a person's name with no merchant match
    # and the original had "UPI" context, treat as upi_p2p
    original_upper = description.upper()
    if any(x in original_upper for x in ["UPI", "NEFT", "IMPS", "TRANSFER", "SENT TO", "PAID TO"]):
        return "upi_p2p"

    return "other"


# ── PYDANTIC MODELS ──────────────────────────────────────
class Evidence(BaseModel):
    merchant: str
    amount: float
    date: str
    category: str
    why: str


class Stats(BaseModel):
    health: int
    focus: int
    discipline: int
    resilience: int
    charisma: int
    wealth: int


class AnalysisResponse(BaseModel):
    archetype: str
    description: str
    evidence: List[Evidence]
    stats: Stats
    rpg: dict
    quests: List[dict]
    boss_quest: dict
    debuffs: List[dict]
    achievements: List[dict]
    experience_log: List[dict]
    weekly_spend: dict
    insights: List[str]
    confidence: int
    top_merchants: List[dict]
    trend: str
    total_transactions: int
    categories_breakdown: Dict[str, int]


# ── STAT ENGINE ──────────────────────────────────────────
def calculate_stats(df: pd.DataFrame) -> dict:
    stats = {
        "health": 50, "focus": 50, "discipline": 50,
        "resilience": 50, "charisma": 50, "wealth": 50
    }

    counts = df["category"].value_counts().to_dict()
    amounts = df.groupby("category")["amount_norm"].apply(
        lambda x: x.abs().sum()
    ).to_dict()

    total_spend = df["amount_norm"].abs().sum()
    avg_spend = df["amount_norm"].abs().mean() if len(df) > 0 else 1

    fd_count    = counts.get("food_delivery", 0)
    groc_count  = counts.get("groceries", 0)
    edu_count   = counts.get("education", 0)
    ent_count   = counts.get("entertainment", 0)
    bill_count  = counts.get("bills_utilities", 0)
    sav_count   = counts.get("savings", 0)
    shop_count  = counts.get("shopping", 0)
    upi_count   = counts.get("upi_p2p", 0)
    health_count = counts.get("health", 0)

    fd_spend   = amounts.get("food_delivery", 0)
    shop_spend = amounts.get("shopping", 0)

    # HEALTH
    stats["health"] += groc_count * 3
    stats["health"] -= fd_count * 2
    if health_count > 0:
        stats["health"] += 5

    # FOCUS
    if edu_count > 0:
        stats["focus"] += 10
    excess_ent = max(0, ent_count - 2)
    stats["focus"] -= excess_ent * 3

    # DISCIPLINE
    if bill_count > 0:
        stats["discipline"] += 10
    if sav_count == 0:
        stats["discipline"] -= 10
    high_spend_txns = len(df[df["amount_norm"].abs() > avg_spend * 2])
    stats["discipline"] -= high_spend_txns * 2

    # RESILIENCE
    if sav_count > 0:
        stats["resilience"] += 15
    else:
        stats["resilience"] -= 15
    if total_spend > 0 and fd_spend / total_spend > 0.30:
        stats["resilience"] -= 15

    # CHARISMA
    if upi_count > 0:
        stats["charisma"] += 5
    if upi_count >= 5:
        stats["charisma"] += 5
    if 2 <= fd_count <= 4:
        stats["charisma"] += 5
    if upi_count == 0 and fd_count == 0:
        stats["charisma"] -= 5

    # WEALTH
    if sav_count > 0:
        stats["wealth"] += 15
    else:
        stats["wealth"] -= 10
    stats["wealth"] -= (shop_count // 3) * 5

    for key in stats:
        stats[key] = max(0, min(100, stats[key]))

    return stats


# ── ARCHETYPE DESCRIPTIONS ───────────────────────────────
ARCHETYPE_DESCRIPTIONS = {
    "Impulsive Temporal Discounter": (
        "You live for the present. Every purchase is an emotional response "
        "— your wallet reflects avoidance rather than intention."
    ),
    "High Achiever Burnout Risk": (
        "High discipline, zero rest. You invest in everything except yourself. "
        "The system is dangerously close to overload."
    ),
    "Distracted Wanderer": (
        "You leak money through subscriptions you forgot exist. No dominant "
        "pattern — money goes everywhere and nowhere."
    ),
    "Guarded Stoic": (
        "You trust no one with your money. Bills are paid, transfers are minimal. "
        "Protection has become a prison."
    ),
    "Creative Sprinter": (
        "You live in extremes. In creative highs you spend freely. "
        "In lows you go silent. Feast or famine, nothing in between."
    ),
    "Fragile Perfectionist": (
        "You research everything obsessively but act on nothing. "
        "The fear of a bad decision has become the worst decision of all."
    ),
    "UPI Native": (
        "Your entire financial life runs through UPI. You trust the network "
        "but have no savings safety net. Fast money, fragile foundation."
    ),
}

ARCHETYPE_QUESTS = {
    "Impulsive Temporal Discounter": {
        "title": "The 24hr Pause",
        "description": "Wait 24 hours before any purchase over Rs 500",
        "xp": 25,
    },
    "High Achiever Burnout Risk": {
        "title": "The Rest Quest",
        "description": "Spend on one thing just for fun today. No ROI allowed.",
        "xp": 40,
    },
    "Distracted Wanderer": {
        "title": "Subscription Audit",
        "description": "Find and cancel one subscription you forgot about",
        "xp": 50,
    },
    "Guarded Stoic": {
        "title": "One Small Risk",
        "description": "Transfer Rs 500 to a savings or investment account this week",
        "xp": 60,
    },
    "Creative Sprinter": {
        "title": "Build The Floor",
        "description": "Set aside a fixed Rs 1000 this week regardless of how you feel.",
        "xp": 45,
    },
    "Fragile Perfectionist": {
        "title": "The Imperfect Action",
        "description": "Take one financial action today without researching for more than 10 minutes.",
        "xp": 55,
    },
    "UPI Native": {
        "title": "Build Your First Shield",
        "description": "Move Rs 500 to a savings account this week. Just Rs 500.",
        "xp": 30,
    },
}


def detect_archetype(df: pd.DataFrame) -> str:
    counts = df["category"].value_counts().to_dict()
    amounts = df.groupby("category")["amount_norm"].apply(
        lambda x: x.abs().sum()
    ).to_dict()

    total_txns  = len(df)
    total_spend = df["amount_norm"].abs().sum()

    fd_count     = counts.get("food_delivery", 0)
    sav_count    = counts.get("savings", 0)
    edu_count    = counts.get("education", 0)
    ent_count    = counts.get("entertainment", 0)
    bill_count   = counts.get("bills_utilities", 0)
    upi_count    = counts.get("upi_p2p", 0)
    shop_count   = counts.get("shopping", 0)
    travel_count = counts.get("travel", 0)
    other_count  = counts.get("other", 0)

    fd_spend    = amounts.get("food_delivery", 0)
    shop_spend  = amounts.get("shopping", 0)
    ent_spend   = amounts.get("entertainment", 0)
    edu_spend   = amounts.get("education", 0)
    bill_spend  = amounts.get("bills_utilities", 0)
    sav_spend   = amounts.get("savings", 0)
    travel_spend= amounts.get("travel", 0)

    def pct(spend):
        return spend / total_spend if total_spend > 0 else 0

    top_category = max(counts, key=counts.get) if counts else "other"

    amounts_by_date = df.groupby("date_norm")["amount_norm"].sum().abs()
    spending_variance = (
        amounts_by_date.std() / amounts_by_date.mean()
        if len(amounts_by_date) > 1 and amounts_by_date.mean() > 0
        else 0
    )

    # ─────────────────────────────────────────────────────
    # 1. FRAGILE PERFECTIONIST
    # KEY SIGNAL: savings dominate spending
    # Bills exist but savings are the main activity
    # NO entertainment, NO food delivery
    # This person hoards money but never acts on it
    # ─────────────────────────────────────────────────────
    if sav_count >= 3 and pct(sav_spend) > 0.30:
        return "Fragile Perfectionist"

    if (sav_count >= 3 and bill_count >= 2
            and ent_count == 0 and fd_count == 0
            and edu_count == 0):
        return "Fragile Perfectionist"

    # ─────────────────────────────────────────────────────
    # 2. HIGH ACHIEVER BURNOUT RISK  
    # KEY SIGNAL: education dominates spending
    # Bills exist (responsible) but ZERO fun
    # Spends on learning, pays bills, ignores rest
    # ─────────────────────────────────────────────────────
    if edu_count >= 3 and pct(edu_spend) > 0.30:
        return "High Achiever Burnout Risk"

    if (edu_count >= 3 and ent_count <= 1
            and fd_count <= 2 and sav_count == 0):
        return "High Achiever Burnout Risk"

    if (edu_count >= 5 and bill_count >= 2
            and ent_count == 0 and sav_count == 0):
        return "High Achiever Burnout Risk"

    # ─────────────────────────────────────────────────────
    # 3. GUARDED STOIC
    # KEY SIGNAL: ONLY bills — nothing else
    # No savings (that would be Fragile Perfectionist)
    # No education (that would be High Achiever)
    # No entertainment, no food delivery, no shopping
    # Pure utility spending, zero personality
    # ─────────────────────────────────────────────────────
    if (top_category == "bills_utilities"
            and sav_count == 0
            and edu_count == 0
            and ent_count == 0
            and fd_count == 0
            and shop_count == 0):
        return "Guarded Stoic"

    if (pct(bill_spend) > 0.60
            and sav_count == 0
            and edu_count == 0
            and ent_count == 0):
        return "Guarded Stoic"

    # ─────────────────────────────────────────────────────
    # 4. DISTRACTED WANDERER
    # KEY SIGNAL: entertainment subscriptions dominate
    # Scattered across many categories
    # No savings, no education, no focus
    # ─────────────────────────────────────────────────────
    if ent_count >= 5 and sav_count == 0 and edu_count == 0:
        return "Distracted Wanderer"

    if (ent_count >= 3 and shop_count >= 2
            and travel_count >= 2 and sav_count == 0):
        return "Distracted Wanderer"

    if pct(ent_spend) > 0.20 and sav_count == 0 and edu_count == 0:
        return "Distracted Wanderer"

    # ─────────────────────────────────────────────────────
    # 5. CREATIVE SPRINTER
    # KEY SIGNAL: heavy shopping + travel, no savings
    # High variance spending, bursts of activity
    # Not entertainment-led — action-led
    # ─────────────────────────────────────────────────────
    if (shop_count >= 5 and travel_count >= 5
            and sav_count == 0 and ent_count <= 2):
        return "Creative Sprinter"

    if (pct(shop_spend) > 0.35 and travel_count >= 3
            and sav_count == 0):
        return "Creative Sprinter"

    if (spending_variance > 0.8 and shop_count >= 3
            and travel_count >= 2 and sav_count == 0):
        return "Creative Sprinter"

    # ─────────────────────────────────────────────────────
    # 6. UPI NATIVE
    # KEY SIGNAL: mostly person-to-person transfers
    # ─────────────────────────────────────────────────────
    upi_other = upi_count + other_count
    if (upi_other / total_txns > 0.55
            and sav_count == 0
            and fd_count <= 3
            and ent_count <= 1):
        return "UPI Native"

    # ─────────────────────────────────────────────────────
    # 7. IMPULSIVE TEMPORAL DISCOUNTER
    # KEY SIGNAL: food delivery is a big chunk of spend
    # ─────────────────────────────────────────────────────
    if fd_count >= 5 and pct(fd_spend) > 0.20 and sav_count == 0:
        return "Impulsive Temporal Discounter"

    if fd_count >= 8 and sav_count == 0:
        return "Impulsive Temporal Discounter"

    # ─────────────────────────────────────────────────────
    # SMART DEFAULT
    # ─────────────────────────────────────────────────────
    if top_category == "savings":      return "Fragile Perfectionist"
    if top_category == "education":    return "High Achiever Burnout Risk"
    if top_category == "bills_utilities": return "Guarded Stoic"
    if top_category == "entertainment":return "Distracted Wanderer"
    if top_category == "shopping":     return "Creative Sprinter"
    if top_category == "upi_p2p":      return "UPI Native"
    if top_category == "food_delivery":return "Impulsive Temporal Discounter"

    if sav_count > 0: return "Fragile Perfectionist"
    return "Impulsive Temporal Discounter"

# ── EVIDENCE BUILDER ─────────────────────────────────────
WHY_MAP = {
    "food_delivery": "Frequent food delivery signals impulse spending",
    "shopping": "Large shopping spend indicates impulse buying",
    "entertainment": "Multiple entertainment subscriptions detected",
    "savings": "Positive savings behavior detected",
    "education": "Investment in self-growth detected",
    "bills_utilities": "Consistent bill payment detected",
    "upi_p2p": "Peer transfer activity detected",
    "travel": "Travel and commute spending detected",
    "health": "Health investment detected",
    "groceries": "Responsible grocery spending detected",
    "other": "Notable transaction flagged",
}


def build_evidence(df: pd.DataFrame) -> List[Evidence]:
    top3 = df.reindex(df["amount_norm"].abs().nlargest(3).index)
    evidence = []
    for _, row in top3.iterrows():
        cat = row.get("category", "other")
        evidence.append(
            Evidence(
                merchant=str(row.get("description_norm", ""))[:35],
                amount=round(float(row.get("amount_norm", 0)), 2),
                date=str(row.get("date_norm", "N/A")),
                category=cat,
                why=WHY_MAP.get(cat, "Notable transaction flagged"),
            )
        )
    return evidence


# ── CSV PARSING ──────────────────────────────────────────
def read_csv_flexibly(file_bytes: bytes) -> pd.DataFrame:
    try:
        text = file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to decode CSV file.")

    try:
        df = pd.read_csv(StringIO(text))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unable to parse CSV: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    df.columns = [str(c).strip().lower() for c in df.columns]
    return df


def choose_column(possible_names: List[str], columns: List[str]) -> Optional[str]:
    for name in possible_names:
        if name in columns:
            return name
    return None


def prepare_transactions(df: pd.DataFrame) -> pd.DataFrame:
    cols = list(df.columns)

    desc_col = choose_column([
        "description", "narration", "details", "particulars",
        "transaction details", "txn description", "remarks", "name",
    ], cols)

    if not desc_col:
        desc_col = cols[0]

    date_col = choose_column([
        "date", "txn date", "transaction date", "value date", "date & time",
    ], cols)

    amount_col = choose_column([
        "amount", "transaction amount (inr)", "txn amount", "amt", "amount (rs)",
    ], cols)

    debit_col = choose_column([
        "debit", "withdrawal amt.", "withdrawal amount",
    ], cols)

    credit_col = choose_column([
        "credit", "deposit amt.", "deposit amount",
    ], cols)

    df_work = df.copy()

    if amount_col:
        # Handle ₹ symbol and commas
        raw = df_work[amount_col].astype(str).str.replace("₹", "", regex=False)
        raw = raw.str.replace(",", "", regex=False).str.strip()
        df_work["amount_norm"] = pd.to_numeric(raw, errors="coerce")
    elif debit_col or credit_col:
        debit  = pd.to_numeric(df_work[debit_col],  errors="coerce") if debit_col  else 0
        credit = pd.to_numeric(df_work[credit_col], errors="coerce") if credit_col else 0
        df_work["amount_norm"] = credit.fillna(0) - debit.fillna(0)
    else:
        df_work["amount_norm"] = 0.0

    df_work["description_norm"] = df_work[desc_col].astype(str)

    if date_col:
        df_work["date_norm"] = df_work[date_col].astype(str)
    else:
        df_work["date_norm"] = ""

    return df_work


# ── PDF PARSING ──────────────────────────────────────────
def parse_pdf(content: bytes) -> pd.DataFrame:
    records: List[Dict[str, Any]] = []

    def clean_amount(s: str) -> float:
        s = str(s or "").upper()
        s = s.replace("INR", "").replace("RS.", "").replace("RS", "")
        s = s.replace("₹", "").replace(",", "").strip()
        negative = s.startswith("-")
        s = re.sub(r"[^\d.]", "", s)
        try:
            val = float(s)
            return -val if negative else val
        except Exception:
            return 0.0

    def is_skip_row(text: str) -> bool:
        skip = [
            "opening balance", "closing balance", "total", "brought forward",
            "statement date", "account no", "ifsc", "branch", "micr", "page",
            "transaction details", "date & time", "narration", "particulars",
        ]
        return any(s in text.lower() for s in skip)

    with pdfplumber.open(io_module.BytesIO(content)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()

            for table in tables:
                if not table or len(table) < 2:
                    continue

                # Find header row
                header_idx = None
                header = []
                for i, row in enumerate(table):
                    if not row:
                        continue
                    joined = " ".join(str(c or "").lower() for c in row)
                    if any(k in joined for k in [
                        "date", "description", "narration", "particulars",
                        "debit", "credit", "amount", "transaction", "name", "status"
                    ]):
                        header_idx = i
                        header = [str(c or "").strip().lower() for c in row]
                        break

                if header_idx is None:
                    continue

                joined_header = " ".join(header)

                # ── HANDLER 1: UPI Statement (Name|Bank|Amount|Date|Status)
                if "name" in header and "status" in header:
                    name_idx = next((i for i, h in enumerate(header) if h == "name"), -1)
                    amt_idx  = next((i for i, h in enumerate(header) if h == "amount"), -1)
                    date_idx = next((i for i, h in enumerate(header) if h == "date"), -1)

                    for row in table[header_idx + 1:]:
                        if not row:
                            continue
                        cleaned = [str(c or "").replace("\n", " ").strip() for c in row]
                        if is_skip_row(" ".join(cleaned)):
                            continue

                        desc = cleaned[name_idx] if 0 <= name_idx < len(cleaned) else ""
                        amt_raw = cleaned[amt_idx] if 0 <= amt_idx < len(cleaned) else ""
                        date_val = cleaned[date_idx] if 0 <= date_idx < len(cleaned) else ""

                        if not desc or len(desc) < 2:
                            continue

                        negative = "-" in amt_raw
                        amt_clean = re.sub(r"[^\d.]", "", amt_raw)
                        if not amt_clean:
                            continue
                        try:
                            amount = float(amt_clean)
                            if negative:
                                amount = -amount
                        except ValueError:
                            continue

                        if amount == 0:
                            continue

                        records.append({
                            "date_norm": date_val,
                            "description_norm": desc[:80],
                            "amount_norm": amount,
                        })
                    continue

                # ── HANDLER 2: Standard columns (debit/credit or amount)
                def find_col(keywords):
                    for i, h in enumerate(header):
                        if any(k in h for k in keywords):
                            return i
                    return None

                date_col  = find_col(["date"])
                desc_col  = find_col(["description", "transaction details", "narration", "particulars", "details"])
                debit_col = find_col(["debit", "withdrawal", "dr"])
                credit_col = find_col(["credit", "deposit", "cr"])
                amt_col   = find_col(["amount", "txn amount"])

                for row in table[header_idx + 1:]:
                    if not row:
                        continue
                    cleaned = [str(c or "").replace("\n", " ").strip() for c in row]

                    def get(col):
                        return cleaned[col] if col is not None and col < len(cleaned) else ""

                    joined = " ".join(cleaned).lower()
                    if is_skip_row(joined):
                        continue

                    desc     = get(desc_col) or get(0)
                    date_val = get(date_col)

                    if not desc or len(desc.strip()) < 3:
                        continue

                    debit_amt  = clean_amount(get(debit_col))
                    credit_amt = clean_amount(get(credit_col))
                    amount_amt = clean_amount(get(amt_col))

                    if debit_amt > 0:
                        amount = -debit_amt
                    elif credit_amt > 0:
                        amount = credit_amt
                    elif amount_amt != 0:
                        amount = amount_amt
                    else:
                        continue

                    records.append({
                        "date_norm": date_val.strip(),
                        "description_norm": desc.strip()[:80],
                        "amount_norm": amount,
                    })

        # ── TEXT FALLBACK: Google Pay and other text-based PDFs ──
        if not records:
            full_text = ""
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    full_text += t + "\n"

            # Google Pay pattern:
            # "Paid to SWIGGY" or "Received from X"
            # followed by UPI Transaction ID
            # followed by amount like ₹188 or 188
            gpay_paid = re.findall(
                r"(Paid to .+?|Received from .+?)\nUPI Transaction ID.*?\n.*?\n(₹[\d,]+)",
                full_text,
                re.DOTALL
            )

            if gpay_paid:
                # Extract date too using a broader pattern
                gpay_full = re.findall(
                    r"(\d{2} \w+, \d{4}\n\d{2}:\d{2} [AP]M)\n(Paid to .+?|Received from .+?)\nUPI Transaction ID.*?\n.*?\n(₹[\d,]+)",
                    full_text,
                    re.DOTALL
                )
                if gpay_full:
                    for date_str, desc, amount_str in gpay_full:
                        is_paid = desc.startswith("Paid to")
                        amt_clean = amount_str.replace("₹", "").replace(",", "").strip()
                        try:
                            amount = float(amt_clean)
                            if is_paid:
                                amount = -amount
                        except ValueError:
                            continue
                        date_val = date_str.split("\n")[0].strip()
                        records.append({
                            "date_norm": date_val,
                            "description_norm": desc.strip()[:80],
                            "amount_norm": amount,
                        })
                else:
                    # Fallback without dates
                    for desc, amount_str in gpay_paid:
                        is_paid = desc.startswith("Paid to")
                        amt_clean = amount_str.replace("₹", "").replace(",", "").strip()
                        try:
                            amount = float(amt_clean)
                            if is_paid:
                                amount = -amount
                        except ValueError:
                            continue
                        records.append({
                            "date_norm": "",
                            "description_norm": desc.strip()[:80],
                            "amount_norm": amount,
                        })

            # Generic line-by-line fallback
            if not records:
                for line in full_text.split("\n"):
                    line = line.strip()
                    if not line or len(line) < 5:
                        continue
                    if is_skip_row(line):
                        continue

                    amt_matches = re.findall(r"₹?([\d,]+(?:\.\d{2})?)", line)
                    if not amt_matches:
                        continue

                    amounts_found = []
                    for m in amt_matches:
                        try:
                            amounts_found.append(float(m.replace(",", "")))
                        except Exception:
                            continue

                    valid = [a for a in amounts_found if a > 5]
                    if not valid:
                        continue

                    amount = max(valid)
                    is_withdrawal = any(w in line.upper() for w in [
                        "PAID TO", "ATM", "PURCHASE", "DEBIT", "DR"
                    ])
                    if is_withdrawal:
                        amount = -amount

                    desc = re.sub(r"₹?[\d,]+(?:\.\d{2})?", "", line).strip()
                    desc = re.sub(r"\s+", " ", desc).strip()
                    if len(desc) < 3:
                        continue

                    date_match = re.search(r"\b(\d{1,2}[\s\-/]\w{3}[\s\-/]\d{2,4}|\d{2}[\-/]\d{2}[\-/]\d{2,4})\b", line)
                    date_val = date_match.group(1) if date_match else ""

                    records.append({
                        "date_norm": date_val,
                        "description_norm": desc[:80],
                        "amount_norm": amount,
                    })

    if not records:
        raise HTTPException(
            status_code=400,
            detail="Could not extract transactions from PDF. Try downloading as CSV from your bank.",
        )

    df = pd.DataFrame(records)
    df = df[df["amount_norm"] != 0].copy()
    df["category"] = df["description_norm"].apply(categorize_description)

    return df


# ── RPG SYSTEM ───────────────────────────────────────────
ARCHETYPE_TITLES = {
    0: "Broke Wanderer",    1: "Coin Collector",
    2: "Silver Seeker",     3: "Gold Chaser",
    4: "Wealth Knight",     5: "Money Mage",
    6: "Fortune Sage",      7: "Legendary Economist",
    8: "Mythic CFO",        9: "Ascended Master",
    10: "The Integrated Self",
}


def calculate_rpg(stats: dict, df: pd.DataFrame, archetype: str) -> dict:
    counts = df["category"].value_counts().to_dict()
    base_xp = int(sum(stats.values()) * 0.8)
    bonus_xp = 0
    if counts.get("savings", 0) > 0:       bonus_xp += 100
    if counts.get("education", 0) > 0:     bonus_xp += 50
    if counts.get("groceries", 0) > 0:     bonus_xp += 30
    if counts.get("bills_utilities", 0) > 0: bonus_xp += 40
    if counts.get("health", 0) > 0:        bonus_xp += 25
    penalty_xp = 0
    fd = counts.get("food_delivery", 0)
    if fd > 5:
        penalty_xp += (fd - 5) * 10
    if counts.get("savings", 0) == 0:
        penalty_xp += 50
    total_xp = max(0, base_xp + bonus_xp - penalty_xp)
    level = min(10, max(1, total_xp // 200))
    xp_in_level = total_xp % 200
    return {
        "level": level,
        "xp": total_xp,
        "xp_to_next_level": 200 - xp_in_level,
        "title": ARCHETYPE_TITLES.get(level, "Adventurer"),
        "progress_percent": int((xp_in_level / 200) * 100),
    }


def detect_debuffs(df: pd.DataFrame) -> List[dict]:
    debuffs = []
    counts  = df["category"].value_counts().to_dict()
    amounts = df.groupby("category")["amount_norm"].apply(
        lambda x: x.abs().sum()
    ).to_dict()
    total = df["amount_norm"].abs().sum()

    if counts.get("entertainment", 0) >= 3:
        debuffs.append({
            "name": "📺 Subscription Trap",
            "description": "3+ entertainment subs detected. You may be paying for things you don't use.",
            "stat_affected": "wealth", "penalty": 15
        })
    if counts.get("food_delivery", 0) >= 5:
        debuffs.append({
            "name": "🛵 Delivery Dependency",
            "description": f"{counts.get('food_delivery', 0)} food deliveries detected. This is draining health and wealth.",
            "stat_affected": "health", "penalty": 20
        })
    if counts.get("savings", 0) == 0:
        debuffs.append({
            "name": "🏜️ Savings Drought",
            "description": "Zero savings detected. One emergency away from crisis.",
            "stat_affected": "resilience", "penalty": 25
        })
    if total > 0 and amounts.get("shopping", 0) / total > 0.35:
        debuffs.append({
            "name": "🌀 Shopping Spiral",
            "description": "Shopping exceeds 35% of total spend.",
            "stat_affected": "wealth", "penalty": 20
        })
    if counts.get("upi_p2p", 0) >= 10 and counts.get("savings", 0) == 0:
        debuffs.append({
            "name": "💸 Transfer Loop",
            "description": "Heavy UPI transfers with no savings safety net.",
            "stat_affected": "resilience", "penalty": 15
        })
    return debuffs[:3]


def detect_achievements(df: pd.DataFrame, stats: dict, archetype: str) -> List[dict]:
    achievements = []
    counts = df["category"].value_counts().to_dict()
    total  = len(df)

    achievements.append({
        "id": "first_upload", "title": "Mirror Unlocked",
        "description": "You uploaded your first bank statement. The journey begins.",
        "emoji": "🪞", "xp_reward": 50
    })
    if total >= 20:
        achievements.append({
            "id": "active_spender", "title": "Active Adventurer",
            "description": f"{total} transactions analyzed.",
            "emoji": "⚡", "xp_reward": 25
        })
    if counts.get("savings", 0) > 0:
        achievements.append({
            "id": "saver", "title": "The Vault Keeper",
            "description": "You have active savings. The foundation is there.",
            "emoji": "🏦", "xp_reward": 100
        })
    if counts.get("education", 0) > 0:
        achievements.append({
            "id": "learner", "title": "Knowledge Seeker",
            "description": "You invest in learning. The rarest kind of spending.",
            "emoji": "📚", "xp_reward": 75
        })
    if stats.get("discipline", 0) >= 60:
        achievements.append({
            "id": "disciplined", "title": "Iron Will",
            "description": "Discipline stat above 60.",
            "emoji": "🛡️", "xp_reward": 50
        })
    if stats.get("wealth", 0) >= 60:
        achievements.append({
            "id": "wealth_builder", "title": "Wealth Architect",
            "description": "Wealth stat above 60.",
            "emoji": "💰", "xp_reward": 75
        })
    if len(counts) >= 5:
        achievements.append({
            "id": "diversified", "title": "Balanced Warrior",
            "description": "Spending across 5+ categories.",
            "emoji": "⚖️", "xp_reward": 30
        })
    if counts.get("upi_p2p", 0) >= 5:
        achievements.append({
            "id": "upi_native", "title": "UPI Champion",
            "description": "5+ UPI transfers. You live on the network.",
            "emoji": "📱", "xp_reward": 20
        })
    return achievements


ALL_QUESTS = {
    "Impulsive Temporal Discounter": [
        {"id": "itd_easy",   "title": "The 24hr Pause",       "description": "Wait 24 hours before any purchase over Rs 500.",         "difficulty": "EASY",   "xp": 25,  "category": "Discipline"},
        {"id": "itd_medium", "title": "No Delivery Week",     "description": "No food delivery apps for 7 days.",                      "difficulty": "MEDIUM", "xp": 75,  "category": "Health"},
        {"id": "itd_hard",   "title": "The Emergency Vault",  "description": "Save Rs 1000 and do not touch it for 30 days.",           "difficulty": "HARD",   "xp": 150, "category": "Resilience"},
    ],
    "High Achiever Burnout Risk": [
        {"id": "hab_easy",   "title": "The Guilt-Free Buy",   "description": "Spend Rs 200 on something purely for fun.",              "difficulty": "EASY",   "xp": 25,  "category": "Charisma"},
        {"id": "hab_medium", "title": "Social Recharge",      "description": "Spend on a meal or outing with a friend.",               "difficulty": "MEDIUM", "xp": 75,  "category": "Charisma"},
        {"id": "hab_hard",   "title": "Rest Is Productive",   "description": "Book a weekend activity with zero work value.",           "difficulty": "HARD",   "xp": 150, "category": "Resilience"},
    ],
    "Distracted Wanderer": [
        {"id": "dw_easy",   "title": "Subscription Audit",    "description": "Cancel one subscription you haven't used.",              "difficulty": "EASY",   "xp": 25,  "category": "Wealth"},
        {"id": "dw_medium", "title": "The Focus Budget",      "description": "Pick ONE category to spend on this week.",               "difficulty": "MEDIUM", "xp": 75,  "category": "Focus"},
        {"id": "dw_hard",   "title": "30 Day Clarity",        "description": "Set a monthly entertainment budget and stick to it.",     "difficulty": "HARD",   "xp": 150, "category": "Discipline"},
    ],
    "Guarded Stoic": [
        {"id": "gs_easy",   "title": "One Small Risk",        "description": "Transfer Rs 500 to Groww or Zerodha.",                   "difficulty": "EASY",   "xp": 25,  "category": "Wealth"},
        {"id": "gs_medium", "title": "Social Spend",          "description": "Spend money on someone else this week.",                 "difficulty": "MEDIUM", "xp": 75,  "category": "Charisma"},
        {"id": "gs_hard",   "title": "First Investment",      "description": "Start a SIP of any amount this month.",                  "difficulty": "HARD",   "xp": 150, "category": "Wealth"},
    ],
    "Creative Sprinter": [
        {"id": "cs_easy",   "title": "Spending Journal",      "description": "Write down every purchase for 3 days.",                  "difficulty": "EASY",   "xp": 25,  "category": "Focus"},
        {"id": "cs_medium", "title": "Build The Floor",       "description": "Set aside Rs 1000 regardless of how you feel.",          "difficulty": "MEDIUM", "xp": 75,  "category": "Resilience"},
        {"id": "cs_hard",   "title": "The Consistency Sprint","description": "Same spending on essentials for 4 weeks.",               "difficulty": "HARD",   "xp": 150, "category": "Discipline"},
    ],
    "Fragile Perfectionist": [
        {"id": "fp_easy",   "title": "The Imperfect Action",  "description": "One financial decision with under 10 min research.",     "difficulty": "EASY",   "xp": 25,  "category": "Resilience"},
        {"id": "fp_medium", "title": "Micro Investment",      "description": "Invest Rs 500 in any fund this week.",                   "difficulty": "MEDIUM", "xp": 75,  "category": "Wealth"},
        {"id": "fp_hard",   "title": "The 30 Day Commit",     "description": "Set up an auto-SIP for any amount.",                     "difficulty": "HARD",   "xp": 150, "category": "Wealth"},
    ],
    "UPI Native": [
        {"id": "upi_easy",   "title": "Build Your First Shield", "description": "Move Rs 500 to a savings account this week.",         "difficulty": "EASY",   "xp": 25,  "category": "Resilience"},
        {"id": "upi_medium", "title": "The First Investment",    "description": "Open a Groww account and invest Rs 100 in any fund.", "difficulty": "MEDIUM", "xp": 75,  "category": "Wealth"},
        {"id": "upi_hard",   "title": "30 Day Savings Lock",     "description": "Save Rs 2000 and do not transfer it for 30 days.",    "difficulty": "HARD",   "xp": 150, "category": "Resilience"},
    ],
}

BOSS_QUESTS = {
    "Impulsive Temporal Discounter": {"id": "boss_itd", "title": "BOSS: 30 Day No-Impulse Challenge",  "description": "Go 30 days without any unplanned purchase over Rs 300.",    "difficulty": "BOSS", "xp": 500, "category": "Discipline"},
    "High Achiever Burnout Risk":    {"id": "boss_hab", "title": "BOSS: The Rest Protocol",             "description": "Spend on rest and recovery every week for 30 days.",        "difficulty": "BOSS", "xp": 500, "category": "Resilience"},
    "Distracted Wanderer":           {"id": "boss_dw",  "title": "BOSS: Zero Leak Month",               "description": "Cancel all unused subscriptions. None for 30 days.",        "difficulty": "BOSS", "xp": 500, "category": "Focus"},
    "Guarded Stoic":                 {"id": "boss_gs",  "title": "BOSS: The Portfolio Unlock",          "description": "Make 4 separate investments in 30 days.",                    "difficulty": "BOSS", "xp": 500, "category": "Wealth"},
    "Creative Sprinter":             {"id": "boss_cs",  "title": "BOSS: The Stability Arc",             "description": "Same monthly spending pattern for 60 days.",                "difficulty": "BOSS", "xp": 500, "category": "Resilience"},
    "Fragile Perfectionist":         {"id": "boss_fp",  "title": "BOSS: The 10x Action Protocol",       "description": "10 financial actions in 30 days, under 5 min each.",        "difficulty": "BOSS", "xp": 500, "category": "Resilience"},
    "UPI Native":                    {"id": "boss_upi", "title": "BOSS: The Safety Net Challenge",      "description": "Build a Rs 10,000 emergency fund in 60 days. Don't touch it.", "difficulty": "BOSS", "xp": 500, "category": "Resilience"},
}
def build_weekly_spend(df: pd.DataFrame) -> dict:
    try:
        df["date_parsed"] = pd.to_datetime(
            df["date_norm"], dayfirst=True, errors="coerce"
        )
        df = df.dropna(subset=["date_parsed"])
        if df.empty:
            return {"week1": 0, "week2": 0, "week3": 0, "week4": 0}
        
        df["amount_abs"] = df["amount_norm"].abs()
        min_date = df["date_parsed"].min()
        
        def get_week(d):
            diff = (d - min_date).days
            if diff < 7:   return "week1"
            elif diff < 14: return "week2"
            elif diff < 21: return "week3"
            else:           return "week4"
        
        df["week"] = df["date_parsed"].apply(get_week)
        weekly = df.groupby("week")["amount_abs"].sum().to_dict()
        
        return {
            "week1": round(weekly.get("week1", 0), 2),
            "week2": round(weekly.get("week2", 0), 2),
            "week3": round(weekly.get("week3", 0), 2),
            "week4": round(weekly.get("week4", 0), 2),
        }
    except Exception:
        return {"week1": 0, "week2": 0, "week3": 0, "week4": 0}

async def generate_ai_insights(
    df: pd.DataFrame,
    archetype: str,
    stats: dict
) -> List[str]:
    counts = df["category"].value_counts().to_dict()
    amounts = df.groupby("category")["amount_norm"].apply(
        lambda x: x.abs().sum()
    ).to_dict()
    total = round(df["amount_norm"].abs().sum(), 0)
    insights = []

    fd = counts.get("food_delivery", 0)
    fd_spend = round(amounts.get("food_delivery", 0), 0)
    if fd >= 3:
        yearly = round(fd_spend * 12, 0)
        insights.append(
            f"You ordered food {fd} times this month "
            f"spending Rs {fd_spend}. "
            f"That is Rs {yearly} a year — a solo trip to Thailand."
        )

    ent = counts.get("entertainment", 0)
    ent_spend = round(amounts.get("entertainment", 0), 0)
    if ent >= 3:
        insights.append(
            f"You have {ent} active subscriptions "
            f"costing Rs {ent_spend} this month. "
            f"Audit them — you likely forgot half exist."
        )

    shop_spend = round(amounts.get("shopping", 0), 0)
    shop = counts.get("shopping", 0)
    if shop >= 3:
        insights.append(
            f"Rs {shop_spend} on shopping across {shop} orders. "
            f"Your cart is your emotional outlet."
        )

    sav = counts.get("savings", 0)
    if sav == 0:
        insights.append(
            f"Zero savings detected out of Rs {total} spent. "
            f"One unexpected bill away from a financial crisis."
        )

    edu_spend = round(amounts.get("education", 0), 0)
    if edu_spend > 0:
        insights.append(
            f"Rs {edu_spend} invested in education. "
            f"The one spend that actually compounds."
        )

    bill_spend = round(amounts.get("bills_utilities", 0), 0)
    if bill_spend > 0 and sav == 0:
        insights.append(
            f"Bills paid, savings zero. "
            f"You are disciplined for others, not for yourself."
        )

    if not insights:
        insights.append(
            f"Rs {total} analyzed across {len(df)} transactions. "
            f"Your pattern says {archetype}."
        )

    return insights[:3]
def calculate_confidence(df: pd.DataFrame, archetype: str) -> int:
    counts = df["category"].value_counts().to_dict()
    total = len(df)
    
    archetype_category_map = {
        "Fragile Perfectionist":       "savings",
        "High Achiever Burnout Risk":  "education",
        "Guarded Stoic":               "bills_utilities",
        "Distracted Wanderer":         "entertainment",
        "Creative Sprinter":           "shopping",
        "UPI Native":                  "upi_p2p",
        "Impulsive Temporal Discounter": "food_delivery",
    }
    
    key_cat = archetype_category_map.get(archetype, "other")
    key_count = counts.get(key_cat, 0)
    other_count = counts.get("other", 0)
    
    signal_strength = (key_count / total * 100) if total > 0 else 0
    noise_penalty = (other_count / total * 30) if total > 0 else 0
    confidence = int(min(97, max(55, signal_strength * 1.5 - noise_penalty + 40)))
    return confidence

def build_top_merchants(df: pd.DataFrame) -> List[dict]:
    try:
        merchant_data = df.groupby("description_norm").agg(
            amount=("amount_norm", lambda x: x.abs().sum()),
            count=("amount_norm", "count")
        ).reset_index()
        
        merchant_data = merchant_data[
            merchant_data["description_norm"].str.len() > 2
        ]
        
        top3 = merchant_data.nlargest(3, "amount")
        
        return [
            {
                "name": str(row["description_norm"])[:25],
                "amount": round(float(row["amount"]), 2),
                "count": int(row["count"]),
            }
            for _, row in top3.iterrows()
        ]
    except Exception:
        return []

def calculate_trend(df: pd.DataFrame) -> str:
    try:
        df["date_parsed"] = pd.to_datetime(
            df["date_norm"], dayfirst=True, errors="coerce"
        )
        df = df.dropna(subset=["date_parsed"])
        if df.empty:
            return "stable"
        
        df["amount_abs"] = df["amount_norm"].abs()
        mid = df["date_parsed"].min() + (
            df["date_parsed"].max() - df["date_parsed"].min()
        ) / 2
        
        first_half = df[df["date_parsed"] <= mid]["amount_abs"].sum()
        second_half = df[df["date_parsed"] > mid]["amount_abs"].sum()
        
        if second_half > first_half * 1.15:
            return "increasing"
        elif second_half < first_half * 0.85:
            return "decreasing"
        else:
            return "stable"
    except Exception:
        return "stable"

def build_experience_log(df: pd.DataFrame, 
                         stats: dict, 
                         archetype: str) -> List[dict]:
    log = []
    counts = df["category"].value_counts().to_dict()

    if counts.get("savings", 0) > 0:
        log.append({"event": "Savings detected", 
                    "xp": "+100", "type": "positive"})
    if counts.get("education", 0) > 0:
        log.append({"event": "Learning investment found", 
                    "xp": "+50", "type": "positive"})
    if counts.get("bills_utilities", 0) > 0:
        log.append({"event": "Bills paid on time", 
                    "xp": "+40", "type": "positive"})
    if counts.get("groceries", 0) > 0:
        log.append({"event": "Healthy grocery spend", 
                    "xp": "+30", "type": "positive"})
    if counts.get("health", 0) > 0:
        log.append({"event": "Health investment detected", 
                    "xp": "+25", "type": "positive"})
    if counts.get("food_delivery", 0) >= 5:
        log.append({"event": "Delivery dependency detected", 
                    "xp": "-20", "type": "negative"})
    if counts.get("entertainment", 0) >= 3:
        log.append({"event": "Subscription trap active", 
                    "xp": "-15", "type": "negative"})
    if counts.get("savings", 0) == 0:
        log.append({"event": "No savings found", 
                    "xp": "-50", "type": "negative"})
    log.append({"event": f"Archetype unlocked: {archetype}", 
                "xp": "+75", "type": "unlock"})
    return log

# ── MAIN ENDPOINT ─────────────────────────────────────────
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)) -> AnalysisResponse:

    filename = file.filename.lower()
    content  = await file.read()

    if filename.endswith(".csv"):
        df_raw = read_csv_flexibly(content)
        df_txn = prepare_transactions(df_raw)
        df_txn["category"] = df_txn["description_norm"].apply(categorize_description)

    elif filename.endswith(".pdf"):
        df_txn = parse_pdf(content)

    else:
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV or PDF file only."
        )

    df_txn = df_txn.dropna(subset=["amount_norm"])
    df_txn = df_txn[df_txn["amount_norm"] != 0]

    if df_txn.empty:
        raise HTTPException(
            status_code=400,
            detail="No transactions found in the file.",
        )

    archetype    = detect_archetype(df_txn)
    stats        = calculate_stats(df_txn)
    evidence     = build_evidence(df_txn)
    counts       = df_txn["category"].value_counts().to_dict()
    rpg          = calculate_rpg(stats, df_txn, archetype)
    quests       = ALL_QUESTS.get(archetype, ALL_QUESTS["Impulsive Temporal Discounter"])
    boss_quest   = BOSS_QUESTS.get(archetype, BOSS_QUESTS["Impulsive Temporal Discounter"])
    debuffs      = detect_debuffs(df_txn)
    achievements = detect_achievements(df_txn, stats, archetype)
    experience_log = build_experience_log(df_txn, stats, archetype)
    weekly_spend   = build_weekly_spend(df_txn)
    insights       = await generate_ai_insights(df_txn, archetype, stats)
    confidence     = calculate_confidence(df_txn, archetype)
    top_merchants  = build_top_merchants(df_txn)
    trend          = calculate_trend(df_txn)

    return AnalysisResponse(
        archetype=archetype,
        description=ARCHETYPE_DESCRIPTIONS.get(archetype, ""),
        evidence=evidence,
        stats=Stats(**stats),
        rpg=rpg,
        quests=quests,
        boss_quest=boss_quest,
        debuffs=debuffs,
        achievements=achievements,
        experience_log=experience_log,
        weekly_spend=weekly_spend,
        insights=insights,
        confidence=confidence,
        top_merchants=top_merchants,
        trend=trend,
        total_transactions=len(df_txn),
        categories_breakdown={k: int(v) for k, v in counts.items()},
    )
