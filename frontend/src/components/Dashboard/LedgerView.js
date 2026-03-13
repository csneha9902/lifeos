import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, Wallet, TrendingUp, TrendingDown, Minus, Store } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

const TREND_CONFIG = {
  increasing: { icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Spending Increasing' },
  decreasing: { icon: TrendingDown, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Spending Decreasing' },
  stable: { icon: Minus, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Spending Stable' },
};

/* Custom tooltip */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 shadow-2xl">
      <p className="text-xs font-black text-white mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-400 font-medium">{entry.name}:</span>
          <span className="font-black text-white">₹{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

/* Custom highlighted dot */
const HighlightDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload.highlight) return <circle cx={cx} cy={cy} r={2} fill="#10b981" />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#10b981" stroke="#fff" strokeWidth={2} />
      <text x={cx} y={cy - 14} fill="#94a3b8" fontSize={10} textAnchor="middle" fontWeight="bold">
        {(payload.highlight / 1000).toFixed(0)}k
      </text>
    </g>
  );
};

export const LedgerView = ({ data }) => {
  if (!data) return null;

  // Use expenditure_trajectory if available, otherwise fall back to weekly_spend
  const trajectoryData = data.expenditure_trajectory || [];
  const weeklyData = data.weekly_spend
    ? Object.entries(data.weekly_spend).map(([name, amount]) => ({ name, amount }))
    : [];
  const hasTrajectory = trajectoryData.length > 0;

  // Prepare category breakdown data for donut chart
  const categoryData = data.categories_breakdown
    ? Object.entries(data.categories_breakdown).map(([name, value], i) => ({
        name,
        value,
        color: COLORS[i % COLORS.length],
      }))
    : [];

  const trendConfig = TREND_CONFIG[data.trend] || TREND_CONFIG.stable;
  const TrendIcon = trendConfig.icon;

  return (
    <motion.div
      key="ledger"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Title */}
      <div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
          Financial Ledger
        </h1>
        <p className="text-sm text-slate-400 font-medium">Spending analytics derived from your bank statement.</p>
      </div>

      {/* Spending Trend Indicator */}
      <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl ${trendConfig.bg} border ${trendConfig.border}`}>
        <TrendIcon className={`size-5 ${trendConfig.color}`} />
        <span className={`text-sm font-black ${trendConfig.color}`}>{trendConfig.label}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expenditure Trajectory / Weekly Spending */}
        <div className="lg:col-span-2 p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3">
              <BarChart3 className="size-4 text-blue-400" />
              Expenditure Trajectory
            </h3>
            {hasTrajectory && (
              <div className="flex gap-5">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Essential</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Total</span>
                </div>
              </div>
            )}
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {hasTrajectory ? (
                <ComposedChart data={trajectoryData} margin={{ top: 25, right: 20, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="barGradTrajectory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar
                    dataKey="essential"
                    name="Essential"
                    fill="url(#barGradTrajectory)"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                    animationDuration={1200}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke="url(#lineGrad)"
                    strokeWidth={3}
                    dot={<HighlightDot />}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </ComposedChart>
              ) : (
                <ComposedChart data={weeklyData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="barGradFallback" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="amount" name="Spent" fill="url(#barGradFallback)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1200} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="lg:col-span-1 p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl flex flex-col">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 mb-6">
            <Wallet className="size-4 text-blue-400" />
            Breakdown
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative size-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: 11 }}
                    formatter={(val, name) => [`${val}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2.5 mt-4">
            {categoryData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-slate-300">{item.name}</span>
                </div>
                <span className="text-xs font-black text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Merchants Table */}
      {data.top_merchants?.length > 0 && (
        <div className="p-8 rounded-2xl bg-[#0d1424] border border-white/5 shadow-2xl">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3 mb-6">
            <Store className="size-4 text-blue-400" />
            Top Merchants
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest pb-4 pr-4">#</th>
                  <th className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest pb-4">Merchant</th>
                  <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest pb-4">Total Amount</th>
                  <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest pb-4">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {data.top_merchants.map((m, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="border-b border-white/5 last:border-none hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 pr-4 text-sm font-black text-slate-600">{i + 1}</td>
                    <td className="py-4 text-sm font-bold text-white">{m.merchant}</td>
                    <td className="py-4 text-right text-sm font-black text-amber-400">₹{m.total?.toLocaleString()}</td>
                    <td className="py-4 text-right text-sm font-bold text-slate-400">{m.count}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};
