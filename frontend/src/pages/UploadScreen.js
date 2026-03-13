import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Loader2, AlertCircle, Sparkles, Shield, Zap } from 'lucide-react';
import { analyzeStatement } from '../api';
import { useAnalysis } from '../context/AnalysisContext';

// Demo data for when backend is unavailable
const DEMO_DATA = {
  rpg: { level: 42, title: 'High Achiever Burnout Risk', xp: 12450, progress_percent: 83 },
  total_transactions: 847,
  stats: { health: 38, focus: 92, discipline: 95, resilience: 41, charisma: 82, wealth: 78 },
  archetype: 'High Achiever Burnout Risk',
  description: 'High discipline, zero rest. You invest in everything except yourself. The system is dangerously close to overload.',
  confidence: 91,
  evidence: [
    { merchant: 'Udemy', amount: 8500, date: '2024-03-10', category: 'Education', why: 'Recurring course purchases indicate relentless self-improvement with no downtime' },
    { merchant: 'Zerodha', amount: 50000, date: '2024-03-08', category: 'Investment', why: 'Aggressive SIP contributions show wealth-building obsession at the cost of liquidity' },
    { merchant: 'Amazon Web Services', amount: 15000, date: '2024-03-05', category: 'Technology', why: 'Infrastructure spending on side projects — building even during off-hours' },
  ],
  insights: [
    'Zero recreational spending detected in the last 30 days — you invest in everything except rest',
    'Discipline score is in the top 3% but Health score has dropped 22% month-over-month',
    'You have 4 active SIPs but no emergency fund — high output, fragile foundation',
    'Weekend spending mirrors weekday patterns — no distinct downtime behavior detected',
  ],
  debuffs: [
    { name: 'Burnout Cascade', description: 'Zero leisure spending for 30+ days. System overload imminent.', stat: 'Health', penalty: -15 },
    { name: 'Rest Deficit', description: 'No entertainment or travel expenses detected. Recovery score critically low.', stat: 'Resilience', penalty: -12 },
  ],
  achievements: [
    { emoji: '💰', title: 'First Lakh Saved', description: 'Reached ₹1,00,000 in savings', xp: 500 },
    { emoji: '🏗️', title: 'System Architect', description: 'Maintained budget for 3 consecutive months', xp: 300 },
    { emoji: '🧠', title: 'Master of Focus', description: 'Reduced impulsive spending by 25%', xp: 250 },
    { emoji: '⚡', title: 'Speed Saver', description: 'Saved 20% of income within first week', xp: 200 },
    { emoji: '🎯', title: 'Goal Crusher', description: 'Completed 5 financial quests', xp: 400 },
    { emoji: '🛡️', title: 'Debt Shield', description: 'Zero credit card debt for 6 months', xp: 350 },
  ],
  quests: [
    { title: 'The Frugal Fortnight', description: 'Spend under ₹500/day for 14 consecutive days', difficulty: 'Medium', xp: 300, category: 'Discipline' },
    { title: 'Investment Initiate', description: 'Set up a monthly SIP of at least ₹5,000', difficulty: 'Easy', xp: 200, category: 'Wealth' },
    { title: 'Subscription Audit', description: 'Cancel all unused subscriptions this month', difficulty: 'Easy', xp: 150, category: 'Wealth' },
  ],
  boss_quest: {
    title: 'The Great Financial Rebalancing',
    description: 'Audit and optimize your entire portfolio allocation. Rebalance investments, eliminate wasteful spending, and establish an emergency fund of 6 months expenses.',
    difficulty: 'Legendary',
    xp: 1000,
    category: 'Wealth',
  },
  weekly_spend: { Week1: 12500, Week2: 18300, Week3: 9800, Week4: 22100 },
  expenditure_trajectory: [
    { name: 'Jan', essential: 10000, total: 15000 },
    { name: 'Feb', essential: 15000, total: 20000 },
    { name: 'Mar', essential: 15000, total: 25000 },
    { name: 'Apr', essential: 30000, total: 35000, highlight: 35000 },
    { name: 'May', essential: 25000, total: 30000 },
    { name: 'Jun', essential: 45000, total: 50000 },
    { name: 'Jul', essential: 40000, total: 45000 },
    { name: 'Aug', essential: 60000, total: 65000 },
    { name: 'Sep', essential: 55000, total: 60000 },
    { name: 'Oct', essential: 70000, total: 75000 },
    { name: 'Nov', essential: 75000, total: 80000, highlight: 80000 },
    { name: 'Dec', essential: 65000, total: 70000 },
    { name: 'Jan', essential: 85000, total: 90000 },
    { name: 'Feb', essential: 90000, total: 95000, highlight: 95000 },
  ],
  categories_breakdown: {
    'Shopping & Hardware': 35,
    'Groceries & Essentials': 20,
    'Dining & Food': 15,
    'Entertainment & Subscriptions': 12,
    'Travel & Transport': 10,
    'Investments': 8,
  },
  top_merchants: [
    { merchant: 'Amazon', total: 45000, count: 23 },
    { merchant: 'Swiggy', total: 12500, count: 45 },
    { merchant: 'Zerodha', total: 50000, count: 8 },
    { merchant: 'Netflix', total: 1500, count: 3 },
    { merchant: 'Uber', total: 8200, count: 32 },
  ],
  trend: 'decreasing',
  experience_log: [
    { event: 'Completed monthly budget review', xp_change: 150, type: 'quest' },
    { event: 'Saved 20% of income this week', xp_change: 100, type: 'habit' },
    { event: 'Cancelled unused Spotify subscription', xp_change: 50, type: 'quest' },
    { event: 'Impulse purchase detected — late night shopping', xp_change: -30, type: 'penalty' },
    { event: 'Investment portfolio rebalanced', xp_change: 200, type: 'achievement' },
    { event: 'Reached Level 42', xp_change: 0, type: 'level_up' },
  ],
};

export default function UploadScreen() {
  const navigate = useNavigate();
  const { setAnalysisData, quizArchetype } = useAnalysis();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'csv'].includes(ext)) {
      setError('Please upload a PDF or CSV file.');
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    setError(null);

    try {
      const data = await analyzeStatement(file);
      setAnalysisData(data);
      navigate('/dashboard');
    } catch (err) {
      setError(`Backend error: ${err.message}. You can try Demo Mode instead.`);
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    // If a quiz archetype exists, override demo data so avatar + UI match the quiz result
    if (quizArchetype) {
      const ARCHETYPE_DESCRIPTIONS = {
        'Impulsive Temporal Discounter': 'You live for the present. Every purchase is an emotional response — your wallet reflects avoidance rather than intention.',
        'High Achiever Burnout Risk': 'High discipline, zero rest. You invest in everything except yourself. The system is dangerously close to overload.',
        'Distracted Wanderer': 'You leak money through subscriptions you forgot exist. No dominant pattern — money goes everywhere and nowhere.',
        'Guarded Stoic': 'You trust no one with your money. Bills are paid, transfers are minimal. Protection has become a prison.',
        'Creative Sprinter': 'You live in extremes. In creative highs you spend freely. In lows you go silent. Feast or famine, nothing in between.',
        'Fragile Perfectionist': 'You research everything obsessively but act on nothing. The fear of a bad decision has become the worst decision of all.',
        'UPI Native': 'Your entire financial life runs through UPI. You trust the network but have no savings safety net. Fast money, fragile foundation.',
      };
      const mergedData = {
        ...DEMO_DATA,
        archetype: quizArchetype,
        description: ARCHETYPE_DESCRIPTIONS[quizArchetype] || DEMO_DATA.description,
        rpg: { ...DEMO_DATA.rpg, title: quizArchetype },
      };
      setAnalysisData(mergedData);
    } else {
      setAnalysisData(DEMO_DATA);
    }
    navigate('/dashboard');
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="size-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">LifeOS</h1>
          </div>
          {quizArchetype ? (
            <div className="space-y-3">
              <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Your gut says you are</p>
              <p className="text-white text-lg font-black">{quizArchetype}</p>
              <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                Let's verify that with your real financial data. Upload your bank statement to see if the data agrees.
              </p>
            </div>
          ) : (
            <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
              Transform your financial data into an RPG-style character sheet. Upload your bank statement to begin.
            </p>
          )}
        </div>

        {/* Upload Card */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            p-10 rounded-3xl border-2 border-dashed transition-all duration-300 text-center
            ${isDragging
              ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
              : 'border-white/10 bg-[#0d1424]/80 hover:border-white/20'
            }
            backdrop-blur-xl shadow-2xl
          `}
        >
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 flex flex-col items-center gap-6"
            >
              <div className="relative">
                <Loader2 className="size-16 text-blue-500 animate-spin" />
                <div className="absolute inset-0 size-16 rounded-full bg-blue-500/20 blur-xl animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-lg font-black text-white mb-2">Analyzing Transactions</h3>
                <p className="text-sm text-slate-400 font-medium">{fileName}</p>
                <div className="flex items-center gap-2 justify-center mt-4">
                  <Sparkles className="size-4 text-purple-400 animate-pulse" />
                  <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">Building your financial profile...</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <div className="size-20 rounded-3xl bg-[#1e2638] border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Upload className="size-8 text-blue-400" />
                </div>
                <h2 className="text-xl font-black text-white mb-2">Upload Your Bank Statement</h2>
                <p className="text-sm text-slate-500 font-medium">
                  Drag and drop your file here, or click to browse
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-sm shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <FileText className="size-4" />
                  Select PDF or CSV
                </button>

                <div className="flex items-center gap-3 mt-2">
                  <div className="h-px w-12 bg-white/10"></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">or</span>
                  <div className="h-px w-12 bg-white/10"></div>
                </div>

                <button
                  onClick={handleDemoMode}
                  className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all active:scale-95 flex items-center gap-2"
                >
                  <Zap className="size-3.5 text-amber-400" />
                  Try Demo Mode
                </button>
              </div>

              <p className="text-[10px] text-slate-600 mt-6 font-medium">
                Supported formats: PDF, CSV • Your data is processed locally
              </p>
            </>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
            >
              <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-bold text-red-300">{error}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {['Financial Archetype', 'RPG Stats', 'AI Insights', 'Quests'].map((label) => (
            <div key={label} className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
