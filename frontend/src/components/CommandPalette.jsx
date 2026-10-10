import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Cpu,
  Layers,
  Activity,
  Database,
  Code,
  Zap,
  CornerDownLeft,
  X,
  FileCode,
  Sparkles
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function CommandPalette({ isOpen, onClose, setActiveTab, onLoadPreset }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addToast } = useToast();

  const commands = [
    {
      id: 'tab-predictor',
      title: 'Open Live Spill Predictor Sandbox',
      category: 'Navigation',
      icon: Cpu,
      action: () => {
        setActiveTab('predictor');
        addToast('Navigated to Live Spill Predictor');
      }
    },
    {
      id: 'tab-overview',
      title: 'View Pipeline & Architecture Overview',
      category: 'Navigation',
      icon: Layers,
      action: () => {
        setActiveTab('overview');
        addToast('Navigated to Pipeline Overview');
      }
    },
    {
      id: 'tab-benchmarks',
      title: 'Inspect 5-Fold CV & Model Leaderboard',
      category: 'Navigation',
      icon: Activity,
      action: () => {
        setActiveTab('benchmarks');
        addToast('Navigated to Benchmark Hub');
      }
    },
    {
      id: 'tab-explorer',
      title: 'Browse 24,068 Recorded Live Intervals',
      category: 'Navigation',
      icon: Database,
      action: () => {
        setActiveTab('explorer');
        addToast('Navigated to Dataset Explorer');
      }
    },
    {
      id: 'tab-patch',
      title: 'Inspect LLVM 19.1.7 C++ Patch (RegAllocGreedy.cpp)',
      category: 'Navigation',
      icon: Code,
      action: () => {
        setActiveTab('patch');
        addToast('Navigated to Patch Inspector');
      }
    },
    {
      id: 'preset-matrix',
      title: 'Load Preset: High-Contention Matrix Multiply (GR64)',
      category: 'Workload Preset',
      icon: Zap,
      action: () => {
        setActiveTab('predictor');
        if (onLoadPreset) onLoadPreset(0);
        addToast('Loaded Matrix Multiply workload preset');
      }
    },
    {
      id: 'preset-loop',
      title: 'Load Preset: Hot Inner-Loop Index (Nested)',
      category: 'Workload Preset',
      icon: Sparkles,
      action: () => {
        setActiveTab('predictor');
        if (onLoadPreset) onLoadPreset(1);
        addToast('Loaded Inner Loop Index preset');
      }
    },
    {
      id: 'preset-fastpath',
      title: 'Load Preset: Free Register Fast-Path (0% Spill)',
      category: 'Workload Preset',
      icon: Zap,
      action: () => {
        setActiveTab('predictor');
        if (onLoadPreset) onLoadPreset(3);
        addToast('Loaded Free Register Fast Path preset');
      }
    }
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
        onClose(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9990] flex items-start justify-center pt-24 sm:pt-32 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose(false)}
            className="fixed inset-0 bg-[#04070e]/80 backdrop-blur-md"
          />

          {/* Palette Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl bg-[#0e1626] border border-[#1d2c47] rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#1d2c47]">
              <Search className="w-4 h-4 text-slate-400 mr-3" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or jump to section..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full bg-transparent text-sm font-mono text-white placeholder-slate-500 outline-none"
              />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131e33] text-slate-400 border border-[#1d2c47]">
                ESC
              </span>
            </div>

            {/* Command List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-slate-500">
                  No matching commands found.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        onClose(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/15 text-white border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-[#131e33]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 bg-[#09101d] px-2 py-0.5 rounded border border-[#1d2c47]/50 ml-2 flex-shrink-0">
                        {item.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#09101d] border-t border-[#1d2c47] text-[11px] font-mono text-slate-500">
              <div className="flex items-center space-x-3">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
              </div>
              <span className="text-cyan-400">Spill-ML Command Palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
