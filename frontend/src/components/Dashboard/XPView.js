import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Swords, Leaf, Trophy, Zap, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

const TYPE_CONFIG = {
  quest: { icon: Swords, bg: 'bg-blue-600', shadow: 'shadow-blue-600/30', color: 'text-emerald-400' },
  habit: { icon: Leaf, bg: 'bg-emerald-600', shadow: 'shadow-emerald-600/30', color: 'text-emerald-400' },
  achievement: { icon: Trophy, bg: 'bg-amber-600', shadow: 'shadow-amber-600/30', color: 'text-amber-400' },
  level_up: { icon: Zap, bg: 'bg-purple-600', shadow: 'shadow-purple-600/30', color: 'text-purple-400' },
  penalty: { icon: AlertTriangle, bg: 'bg-red-600', shadow: 'shadow-red-600/30', color: 'text-red-400' },
};

export const XPView = ({ data }) => {
  if (!data) return null;

  const logs = data.experience_log || [];
  const level = data.rpg?.level || 1;
  const xp = data.rpg?.xp || 0;
  const progress = data.rpg?.progress_percent || 0;

  return (
    <motion.div
      key="xp"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      {/* Title */}
      <div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
          Experience Log
        </h1>
        <p className="text-sm text-slate-400 font-medium">A detailed history of your growth, achievements, and the path to your current level.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Level Display */}
        <div className="lg:col-span-1 p-10 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
          <div className="size-36 rounded-full border-[6px] border-[#070b14] flex items-center justify-center bg-[#1e2638] shadow-[0_0_30px_rgba(59,130,246,0.2)] mb-8 relative">
            <div className="absolute inset-3 border border-blue-500/20 rounded-full animate-[spin_12s_linear_infinite]"></div>
            <span className="text-5xl font-black text-white">{level}</span>
          </div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Current Level</h3>
          <p className="text-sm text-slate-400 font-medium mb-8">{xp.toLocaleString()} XP</p>

          <div className="w-full">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black uppercase text-blue-400 tracking-widest">LVL {level}</span>
              <span className="text-xs font-black text-white px-3 py-1 bg-white/5 rounded-full">{progress}%</span>
              <span className="text-xs font-black uppercase text-slate-500 tracking-widest">LVL {level + 1}</span>
            </div>
            <div className="w-full h-3 bg-[#070b14] rounded-full overflow-hidden border border-white/5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]"
              />
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2 p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 mb-8">
            <TrendingUp className="size-4 text-blue-400" />
            Activity Timeline
          </h3>

          {logs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">No experience events recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((entry, i) => {
                const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.quest;
                const Icon = config.icon;
                const isPositive = entry.xp_change > 0;
                const isNegative = entry.xp_change < 0;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-5 p-5 rounded-2xl bg-[#1e2638]/60 border border-white/5 hover:-translate-y-0.5 transition-transform"
                  >
                    <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${config.bg} ${config.shadow}`}>
                      <Icon className="size-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white">{entry.event}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">{entry.type?.replace('_', ' ')}</p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      {isPositive && <ArrowUp className="size-3.5 text-emerald-400" />}
                      {isNegative && <ArrowDown className="size-3.5 text-red-400" />}
                      <span className={`text-sm font-black ${
                        isPositive ? 'text-emerald-400' :
                        isNegative ? 'text-red-400' :
                        'text-purple-400'
                      }`}>
                        {entry.xp_change === 0
                          ? 'Level Up!'
                          : `${isPositive ? '+' : ''}${entry.xp_change} XP`
                        }
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
