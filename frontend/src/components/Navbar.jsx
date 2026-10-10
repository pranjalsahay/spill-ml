import React from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  Terminal,
  Activity,
  Layers,
  Database,
  Code,
  Search,
  Command,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendStatus, onOpenCommandPalette }) {
  const navItems = [
    { id: 'overview', label: 'Architecture', icon: Layers },
    { id: 'predictor', label: 'Live Predictor', icon: Cpu },
    { id: 'benchmarks', label: 'Benchmarks', icon: Activity },
    { id: 'explorer', label: 'Data Explorer', icon: Database },
    { id: 'patch', label: 'LLVM Patch', icon: Code },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#080c15]/85 backdrop-blur-xl border-b border-[#1d2c47]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('overview')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
              <Terminal className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">
                  SPILL<span className="text-cyan-400">·ML</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
                  LLVM 19.1.7
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-mono">
                Greedy Register Allocator Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Pills with Framer Motion Gliding Pill */}
          <nav className="hidden md:flex items-center p-1 rounded-2xl bg-[#09101d] border border-[#1d2c47] relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer z-10 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 rounded-xl shadow-sm shadow-cyan-500/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Command Palette Button + Status Indicator */}
          <div className="flex items-center space-x-3">
            {/* Quick search shortcut */}
            <button
              onClick={() => onOpenCommandPalette(true)}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#09101d] border border-[#1d2c47] hover:border-cyan-500/40 text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-mono"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#131e33] border border-[#1d2c47] text-[10px] text-slate-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Live API Status Pill */}
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#09101d] border border-[#1d2c47]">
              {backendStatus === 'healthy' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] font-mono text-emerald-300">FastAPI Live</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-[11px] font-mono text-amber-300">Client Engine</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex space-x-1 py-2 overflow-x-auto border-t border-[#1d2c47]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
