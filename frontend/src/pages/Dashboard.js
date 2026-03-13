import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import AvatarViewer from '../components/AvatarViewer';
import avatarMap from '../utils/avatarMap';
import { LedgerView } from '../components/Dashboard/LedgerView';
import { XPView } from '../components/Dashboard/XPView';
import {
  Shield, Brain, Swords, Trophy, FileText, LayoutGrid, Bell,
  LogOut, Skull, Zap, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Lightbulb, Target, Heart, Eye, Coins,
  ChevronRight, Star, Award
} from 'lucide-react';

/* ── Metric Ring ─────────────────────────────────────── */
function MetricRing({ value, color, label }) {
  const radius = 40;
  const stroke = 6;
  const r = radius - stroke;
  const c = r * 2 * Math.PI;
  const dashOffset = c - (value / 100) * c;

  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth={stroke} r={r} cx={radius} cy={radius} />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            r={r} cx={radius} cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-base font-black text-white">{value}%</span>
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 max-w-[90px] leading-tight">{label}</span>
    </div>
  );
}

/* ── Stat Colors ─────────────────────────────────────── */
const STAT_COLORS = {
  health: '#ef4444',
  focus: '#06b6d4',
  discipline: '#f59e0b',
  resilience: '#10b981',
  charisma: '#8b5cf6',
  wealth: '#3b82f6',
};

const STAT_ICONS = {
  health: Heart,
  focus: Eye,
  discipline: Target,
  resilience: Shield,
  charisma: Star,
  wealth: Coins,
};

/* ── Difficulty Colors ───────────────────────────────── */
const DIFF_COLORS = {
  Easy: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10',
  Medium: 'text-amber-400 border-amber-400/20 bg-amber-400/10',
  Hard: 'text-red-400 border-red-400/20 bg-red-400/10',
  Legendary: 'text-purple-400 border-purple-400/20 bg-purple-400/10',
};

/* ═══════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const { analysisData, quizArchetype } = useAnalysis();
  const [currentView, setCurrentView] = useState('hero');

  // If no data, redirect to upload
  if (!analysisData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070b14]">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No analysis data loaded.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm"
          >
            Upload Statement
          </button>
        </div>
      </div>
    );
  }

  const d = analysisData; // shorthand

  const sidebarItems = [
    { key: 'hero', label: 'Hero Overview', icon: Shield },
    { key: 'ledger', label: 'Financial Ledger', icon: Coins },
    { key: 'xp', label: 'Experience Log', icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#070b14]">
      {/* ── Sidebar ──────────────────────────────────── */}
      <div className="w-64 bg-[#0b1120] border-r border-white/5 flex flex-col p-6 hidden md:flex z-10 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="size-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="size-4 text-white" />
          </div>
          <div>
            <h2 className="font-black text-white text-sm tracking-tight">LifeOS</h2>
            <span className="text-[10px] font-bold text-blue-400 tracking-wider">v3.0 BETA</span>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {sidebarItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                currentView === key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all mt-auto"
        >
          <LogOut className="size-4" />
          New Analysis
        </button>
      </div>

      {/* ── Main Content ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">

        {/* ── Quiz vs Bank Comparison Banner ─────────── */}
        {quizArchetype && currentView === 'hero' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`mb-8 p-6 rounded-2xl border ${
              quizArchetype === d.archetype
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20'
            }`}
          >
            {quizArchetype === d.archetype ? (
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-400 mb-1">Your instincts are sharp.</h3>
                  <p className="text-sm text-slate-300 font-medium">
                    You predicted <span className="font-black text-white">{quizArchetype}</span> — and your bank confirms it. The data doesn't lie, and neither did your gut.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🔄</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-400 mb-1">Interesting. The data tells a different story.</h3>
                  <p className="text-sm text-slate-300 font-medium">
                    You thought you were <span className="font-black text-white">{quizArchetype}</span>, but your bank says you're <span className="font-black text-white">{d.archetype}</span>. The data doesn't lie.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {currentView === 'hero' && <HeroOverview key="hero" d={d} quizArchetype={quizArchetype} />}
          {currentView === 'ledger' && <LedgerView key="ledger" data={d} />}
          {currentView === 'xp' && <XPView key="xp" data={d} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO OVERVIEW
   ═══════════════════════════════════════════════════════ */
function HeroOverview({ d, quizArchetype }) {
  // Pick avatar config: backend archetype > quiz archetype > default
  const avatarKey = d.archetype || quizArchetype || 'High Achiever Burnout Risk';
  const avatarConfig = avatarMap[avatarKey] || avatarMap['high_achiever'] || Object.values(avatarMap)[0];
  const avatarPath = typeof avatarConfig === 'string' ? avatarConfig : (avatarConfig.path || avatarConfig);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10 max-w-6xl mx-auto"
    >
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#1e2638] rounded-xl border border-white/5">
            <LayoutGrid className="size-6 text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Hero Overview</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{d.total_transactions} transactions analyzed</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#1e2638] border border-white/5 rounded-full px-5 py-2.5 gap-3">
            <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-blue-600/30">LVL {d.rpg?.level}</span>
            <span className="text-xs font-black text-white">{d.rpg?.xp?.toLocaleString()} <span className="text-slate-500 font-bold">XP</span></span>
          </div>

          {/* 3D Avatar Pedestal */}
          <div className="flex flex-col items-center justify-center p-2">
            <div className="relative size-48 flex items-center justify-center">
              <div className="absolute inset-4 rounded-full bg-blue-500/10 border border-white/10 blur-xl"></div>
              <div className="absolute inset-8 rounded-full bg-[#1e2638] border border-white/5 shadow-inner"></div>
              <div className="size-64 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[85%] pointer-events-none z-10 flex items-center justify-center">
                <AvatarViewer avatar={avatarPath} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Player Profile + XP Bar ──────────────────── */}
      <div className="p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white">{d.rpg?.title || 'Adventurer'}</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Level {d.rpg?.level} • {d.rpg?.xp?.toLocaleString()} XP</p>
          </div>
          <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-black text-blue-400">
            {d.rpg?.progress_percent || 0}% to next level
          </div>
        </div>
        <div className="w-full h-3 bg-[#070b14] rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${d.rpg?.progress_percent || 0}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          />
        </div>
      </div>

      {/* ── Personal Metrics (6 Rings) ───────────────── */}
      <div className="p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl">
        <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 mb-8">
          <Brain className="size-4 text-blue-400" />
          Personal Metrics
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {d.stats && Object.entries(d.stats).map(([key, val]) => (
            <MetricRing
              key={key}
              value={val}
              color={STAT_COLORS[key] || '#3b82f6'}
              label={key}
            />
          ))}
        </div>
      </div>

      {/* ── Financial Archetype ──────────────────────── */}
      <div className="p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 mb-4">
              <Award className="size-4 text-purple-400" />
              Financial Archetype
            </h3>
            <h2 className="text-2xl font-black text-white mb-2">{d.archetype}</h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xl">{d.description}</p>
          </div>
          {d.confidence && (
            <div className="px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center shrink-0">
              <span className="text-2xl font-black text-purple-400">{d.confidence}%</span>
              <p className="text-[9px] font-bold text-purple-300/60 uppercase tracking-widest mt-1">Confidence</p>
            </div>
          )}
        </div>

        {/* Evidence Cards */}
        {d.evidence?.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Why this archetype was detected</p>
            {d.evidence.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-[#1e2638]/50 border border-white/5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-sm font-black text-white">{e.merchant}</h4>
                    <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{e.category}</span>
                  </div>
                  <p className="text-xs text-slate-400 italic">{e.why}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-black text-amber-400">₹{e.amount?.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-slate-600">{e.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── AI Behavioral Insights ───────────────────── */}
      {d.insights?.length > 0 && (
        <div className="p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 mb-6">
            <Lightbulb className="size-4 text-amber-400" />
            AI Behavioral Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {d.insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4"
              >
                <Lightbulb className="size-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-slate-300 leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Debuffs ──────────────────────────────────── */}
      {d.debuffs?.length > 0 && (
        <div className="p-8 rounded-2xl bg-[#0d1424] border border-red-500/10 shadow-2xl">
          <h3 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-3 mb-6">
            <AlertTriangle className="size-4" />
            Active Debuffs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {d.debuffs.map((debuff, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-xl bg-red-500/5 border border-red-500/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-red-300">{debuff.name}</h4>
                  <span className="text-xs font-black text-red-500">{debuff.penalty} {debuff.stat}</span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{debuff.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Achievements ─────────────────────────────── */}
      {d.achievements?.length > 0 && (
        <div className="p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 mb-6">
            <Trophy className="size-4 text-amber-400" />
            Achievements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {d.achievements.map((ach, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-xl bg-[#1e2638]/50 border border-white/5 hover:border-amber-500/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{ach.emoji}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-white">{ach.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{ach.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Zap className="size-3 text-amber-400" />
                      <span className="text-[10px] font-black text-amber-400">+{ach.xp} XP</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quests + Boss Quest ───────────────────────── */}
      <div className="p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl">
        <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 mb-6">
          <Swords className="size-4 text-blue-400" />
          Active Quests
        </h3>
        <div className="space-y-4">
          {d.quests?.map((quest, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-xl bg-[#1e2638]/50 border border-white/5 flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Swords className="size-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white">{quest.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{quest.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${DIFF_COLORS[quest.difficulty] || DIFF_COLORS.Medium}`}>
                  {quest.difficulty}
                </span>
                <span className="text-xs font-black text-emerald-400">+{quest.xp} XP</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Boss Quest */}
        {d.boss_quest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-purple-500/5 border border-red-500/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-purple-500"></div>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10">
                <Skull className="size-7 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded">Boss Quest</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${DIFF_COLORS[d.boss_quest.difficulty] || DIFF_COLORS.Legendary}`}>
                    {d.boss_quest.difficulty}
                  </span>
                </div>
                <h4 className="text-lg font-black text-white">{d.boss_quest.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{d.boss_quest.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-amber-400">+{d.boss_quest.xp} XP</span>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{d.boss_quest.category}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
