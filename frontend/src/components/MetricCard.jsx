import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, color = 'cyan', badge }) {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      glow: 'group-hover:shadow-cyan-500/10',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      badge: 'bg-cyan-950/60 border-cyan-800 text-cyan-300',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      glow: 'group-hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      badge: 'bg-emerald-950/60 border-emerald-800 text-emerald-300',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      glow: 'group-hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-400',
      badge: 'bg-amber-950/60 border-amber-800 text-amber-300',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      glow: 'group-hover:shadow-purple-500/10',
      iconBg: 'bg-purple-500/10 text-purple-400',
      badge: 'bg-purple-950/60 border-purple-800 text-purple-300',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      glow: 'group-hover:shadow-rose-500/10',
      iconBg: 'bg-rose-500/10 text-rose-400',
      badge: 'bg-rose-950/60 border-rose-800 text-rose-300',
    },
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div
      className={`group relative bg-[#0e1626]/80 backdrop-blur-sm border ${scheme.border} rounded-2xl p-5 transition-all duration-300 hover:shadow-xl ${scheme.glow} hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {(subtext || badge) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {subtext && <span className="text-slate-400">{subtext}</span>}
          {badge && (
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-mono font-medium ${scheme.badge}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
