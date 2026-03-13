import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Shield, Brain, Zap } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

/* ═══════════════════════════════════════════════════════
   QUESTIONS & SCORING
   ═══════════════════════════════════════════════════════ */
const QUESTIONS = [
  {
    id: 1,
    title: 'The Saturday Night Decision',
    question: 'You have ₹500 and no plans. What do you do?',
    options: [
      { key: 'A', text: 'Order Swiggy and watch Netflix', scores: { impulsive: 2, distracted: 1 } },
      { key: 'B', text: 'Transfer it to savings immediately', scores: { perfectionist: 2, stoic: 1 } },
      { key: 'C', text: 'Buy something you\'ve been eyeing online', scores: { sprinter: 2, impulsive: 1 } },
      { key: 'D', text: 'Pay off a pending bill', scores: { stoic: 2, perfectionist: 1 } },
      { key: 'E', text: 'Spend it on an online course', scores: { achiever: 2, upi: 1 } },
    ],
  },
  {
    id: 2,
    title: 'Bank Balance Habits',
    question: 'Last time you checked your bank balance?',
    options: [
      { key: 'A', text: 'This morning — I check daily', scores: { achiever: 2, stoic: 1, perfectionist: 1 } },
      { key: 'B', text: 'When I got a low balance alert', scores: { impulsive: 1, upi: 2 } },
      { key: 'C', text: 'I don\'t remember honestly', scores: { distracted: 2, impulsive: 1 } },
      { key: 'D', text: 'After every transaction', scores: { stoic: 2, perfectionist: 1 } },
      { key: 'E', text: 'When my salary hit', scores: { sprinter: 2, upi: 1 } },
    ],
  },
  {
    id: 3,
    title: 'Emergency Response',
    question: 'Your reaction to a ₹5,000 unexpected expense?',
    options: [
      { key: 'A', text: 'Put it on card and stress later', scores: { impulsive: 2, sprinter: 1 } },
      { key: 'B', text: 'Already have an emergency fund for this', scores: { achiever: 2, stoic: 2 } },
      { key: 'C', text: 'Transfer from savings but feel guilty', scores: { perfectionist: 2 } },
      { key: 'D', text: 'Borrow from a friend', scores: { upi: 2, distracted: 1 } },
      { key: 'E', text: 'Panic, then figure it out', scores: { sprinter: 2, distracted: 1 } },
    ],
  },
  {
    id: 4,
    title: 'Subscription Life',
    question: 'Your relationship with subscriptions?',
    options: [
      { key: 'A', text: 'I have 5+ and use all of them', scores: { sprinter: 2 } },
      { key: 'B', text: 'I have 5+ and honestly forget some exist', scores: { distracted: 2, impulsive: 1 } },
      { key: 'C', text: 'I only pay for what I truly need', scores: { achiever: 1, perfectionist: 1, upi: 1 } },
      { key: 'D', text: 'I don\'t believe in subscriptions', scores: { stoic: 2 } },
      { key: 'E', text: 'I cancelled everything to save money', scores: { achiever: 1, perfectionist: 1 } },
    ],
  },
  {
    id: 5,
    title: 'End of Month Reality',
    question: 'End of month, your wallet looks like...',
    options: [
      { key: 'A', text: 'Empty — where did it all go', scores: { impulsive: 2, distracted: 1 } },
      { key: 'B', text: 'Same as start — I budget tightly', scores: { stoic: 2, achiever: 1 } },
      { key: 'C', text: 'Less than expected — small leaks everywhere', scores: { distracted: 2, upi: 1 } },
      { key: 'D', text: 'Healthy — I planned this', scores: { perfectionist: 2, stoic: 1 } },
      { key: 'E', text: 'Depends on the month entirely', scores: { sprinter: 2 } },
    ],
  },
  {
    id: 6,
    title: 'Financial Regret',
    question: 'Your biggest financial regret this year?',
    options: [
      { key: 'A', text: 'Too much food delivery', scores: { impulsive: 2, upi: 1 } },
      { key: 'B', text: 'Never started investing', scores: { perfectionist: 2 } },
      { key: 'C', text: 'Bought things I didn\'t need', scores: { sprinter: 2, impulsive: 1 } },
      { key: 'D', text: 'Subscribed to too many things', scores: { distracted: 2 } },
      { key: 'E', text: 'No regrets — I\'m disciplined', scores: { achiever: 2, stoic: 1 } },
    ],
  },
  {
    id: 7,
    title: 'Salary Day Ritual',
    question: 'When you get your salary...',
    options: [
      { key: 'A', text: 'First thing — pay bills and save', scores: { stoic: 2, achiever: 1 } },
      { key: 'B', text: 'Invest a fixed amount immediately', scores: { achiever: 1, perfectionist: 2 } },
      { key: 'C', text: 'Spend first, save whatever is left', scores: { impulsive: 2, upi: 1 } },
      { key: 'D', text: 'No fixed plan, flows naturally', scores: { distracted: 1, sprinter: 2 } },
      { key: 'E', text: 'It disappears faster than expected', scores: { impulsive: 1, sprinter: 1 } },
    ],
  },
  {
    id: 8,
    title: 'Savings Reality Check',
    question: 'Your savings account right now?',
    options: [
      { key: 'A', text: 'Empty or doesn\'t exist', scores: { impulsive: 1, distracted: 1, sprinter: 1, upi: 1 } },
      { key: 'B', text: 'Has money but I never grow it', scores: { perfectionist: 2 } },
      { key: 'C', text: 'Has a SIP running automatically', scores: { achiever: 2 } },
      { key: 'D', text: 'Has emergency fund only', scores: { stoic: 2 } },
      { key: 'E', text: 'Multiple investments active', scores: { achiever: 1, stoic: 1 } },
    ],
  },
  {
    id: 9,
    title: 'Sale Temptation',
    question: 'You see a sale on something you want...',
    options: [
      { key: 'A', text: 'Buy immediately — it\'s on sale!', scores: { impulsive: 2, sprinter: 1 } },
      { key: 'B', text: 'Research for days then miss the sale', scores: { perfectionist: 2 } },
      { key: 'C', text: 'Add to cart and forget about it', scores: { distracted: 1, upi: 1 } },
      { key: 'D', text: 'Only buy if it was already planned', scores: { stoic: 2, achiever: 1 } },
      { key: 'E', text: 'Share it with friends and maybe split', scores: { upi: 1, sprinter: 1 } },
    ],
  },
  {
    id: 10,
    title: 'Money Philosophy',
    question: 'Your money philosophy in one line?',
    options: [
      { key: 'A', text: 'YOLO — you only live once', scores: { impulsive: 2, upi: 1 } },
      { key: 'B', text: 'Safety first, always', scores: { stoic: 2, perfectionist: 1 } },
      { key: 'C', text: 'Money is meant to be experienced', scores: { sprinter: 2, distracted: 1 } },
      { key: 'D', text: 'Learning is the best investment', scores: { achiever: 2 } },
      { key: 'E', text: 'Consistency beats intensity', scores: { achiever: 1, stoic: 1 } },
    ],
  },
];

const ARCHETYPES = {
  impulsive: {
    name: 'Impulsive Temporal Discounter',
    description: 'You live for the present. Every purchase is an emotional response — your wallet reflects avoidance rather than intention.',
    emoji: '⚡',
    color: 'from-red-500 to-orange-500',
    glow: 'shadow-red-500/30',
  },
  achiever: {
    name: 'High Achiever Burnout Risk',
    description: 'High discipline, zero rest. You invest in everything except yourself. The system is dangerously close to overload.',
    emoji: '🔥',
    color: 'from-amber-500 to-red-500',
    glow: 'shadow-amber-500/30',
  },
  distracted: {
    name: 'Distracted Wanderer',
    description: 'You leak money through subscriptions you forgot exist. No dominant pattern — money goes everywhere and nowhere.',
    emoji: '🌀',
    color: 'from-purple-500 to-indigo-500',
    glow: 'shadow-purple-500/30',
  },
  stoic: {
    name: 'Guarded Stoic',
    description: 'You trust no one with your money. Bills are paid, transfers are minimal. Protection has become a prison.',
    emoji: '🛡️',
    color: 'from-slate-400 to-slate-600',
    glow: 'shadow-slate-500/30',
  },
  sprinter: {
    name: 'Creative Sprinter',
    description: 'You live in extremes. In creative highs you spend freely. In lows you go silent. Feast or famine, nothing in between.',
    emoji: '🎨',
    color: 'from-emerald-500 to-cyan-500',
    glow: 'shadow-emerald-500/30',
  },
  perfectionist: {
    name: 'Fragile Perfectionist',
    description: 'You research everything obsessively but act on nothing. The fear of a bad decision has become the worst decision of all.',
    emoji: '🔬',
    color: 'from-blue-500 to-indigo-500',
    glow: 'shadow-blue-500/30',
  },
  upi: {
    name: 'UPI Native',
    description: 'Your entire financial life runs through UPI. You trust the network but have no savings safety net. Fast money, fragile foundation.',
    emoji: '📱',
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/30',
  },
};

/* ═══════════════════════════════════════════════════════
   QUIZ SCREEN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function QuizScreen() {
  const navigate = useNavigate();
  const { setQuizArchetype } = useAnalysis();
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState({
    impulsive: 0, achiever: 0, distracted: 0, stoic: 0, sprinter: 0, perfectionist: 0, upi: 0,
  });
  const [selectedOption, setSelectedOption] = useState(null);
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'analyzing' | 'reveal'
  const [predictedKey, setPredictedKey] = useState(null);

  const question = QUESTIONS[currentQ];
  const progress = ((currentQ) / QUESTIONS.length) * 100;

  const handleSelect = (option) => {
    setSelectedOption(option.key);

    // Update scores
    const newScores = { ...scores };
    Object.entries(option.scores).forEach(([archetype, points]) => {
      newScores[archetype] = (newScores[archetype] || 0) + points;
    });
    setScores(newScores);

    // Move to next question after a brief delay
    setTimeout(() => {
      setSelectedOption(null);
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        // Done — find the winner
        const winner = Object.entries(newScores).reduce((a, b) => a[1] >= b[1] ? a : b);
        setPredictedKey(winner[0]);
        setQuizArchetype(ARCHETYPES[winner[0]].name);
        setPhase('analyzing');
      }
    }, 400);
  };

  // Analyzing → Reveal transition
  useEffect(() => {
    if (phase === 'analyzing') {
      const timer = setTimeout(() => setPhase('reveal'), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Navigate after reveal
  const handleContinue = () => {
    navigate('/upload');
  };

  const predicted = predictedKey ? ARCHETYPES[predictedKey] : null;

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── QUIZ PHASE ──────────────────────────── */}
        {phase === 'quiz' && (
          <motion.div
            key={`q-${currentQ}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Brain className="size-5 text-white" />
                </div>
                <span className="text-sm font-black text-white">LifeOS</span>
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {currentQ + 1} / {QUESTIONS.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#1e2638] rounded-full mb-10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
                animate={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Question */}
            <div className="mb-10">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">{question.title}</p>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{question.question}</h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, i) => (
                <motion.button
                  key={option.key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleSelect(option)}
                  disabled={selectedOption !== null}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 group ${
                    selectedOption === option.key
                      ? 'bg-blue-600/20 border-blue-500/50 scale-[0.98]'
                      : 'bg-[#0d1424]/80 border-white/5 hover:border-blue-500/30 hover:bg-[#0d1424] hover:scale-[1.01]'
                  }`}
                >
                  <div className={`size-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-colors ${
                    selectedOption === option.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1e2638] text-slate-400 group-hover:text-white group-hover:bg-[#2a3550]'
                  }`}>
                    {option.key}
                  </div>
                  <span className={`text-sm font-bold transition-colors ${
                    selectedOption === option.key ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {option.text}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── ANALYZING PHASE ────────────────────── */}
        {phase === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 text-center flex flex-col items-center gap-6"
          >
            <div className="relative">
              <div className="size-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/30">
                <Sparkles className="size-10 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="absolute inset-0 size-24 rounded-full bg-blue-500/20 blur-2xl animate-ping" style={{ animationDuration: '2s' }}></div>
            </div>
            <h2 className="text-2xl font-black text-white">Analyzing Your Personality...</h2>
            <p className="text-sm text-slate-400 font-medium">Cross-referencing your answers with 7 financial archetypes</p>
            <div className="flex gap-2 mt-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="size-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── REVEAL PHASE ───────────────────────── */}
        {phase === 'reveal' && predicted && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl text-center"
          >
            {/* Archetype Emoji */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="mb-8"
            >
              <div className={`size-28 rounded-3xl bg-gradient-to-br ${predicted.color} flex items-center justify-center mx-auto shadow-2xl ${predicted.glow}`}>
                <span className="text-5xl">{predicted.emoji}</span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Your Predicted Archetype</p>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">{predicted.name}</h1>
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md mx-auto mb-10">
                {predicted.description}
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="space-y-4"
            >
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">
                But is your gut feeling right? Let's find out.
              </p>
              <button
                onClick={handleContinue}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm shadow-2xl shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-3 mx-auto"
              >
                <Shield className="size-4" />
                Verify with Your Bank Statement
                <ChevronRight className="size-4" />
              </button>
            </motion.div>

            {/* Score breakdown (subtle) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-12 flex flex-wrap justify-center gap-2"
            >
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([key, val]) => (
                  <div key={key} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {ARCHETYPES[key]?.name.split(' ')[0]} · {val}pts
                  </div>
                ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
