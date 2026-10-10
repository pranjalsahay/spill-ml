import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider } from './context/ToastContext';
import CommandPalette from './components/CommandPalette';
import Navbar from './components/Navbar';
import PipelineOverview from './components/PipelineOverview';
import LivePredictor from './components/LivePredictor';
import BenchmarkHub from './components/BenchmarkHub';
import DatasetExplorer from './components/DatasetExplorer';
import PatchInspector from './components/PatchInspector';
import { fetchHealth, fetchOverview } from './services/api';
import { initLenis } from './utils/scroll';
import { Terminal, Shield, Cpu, Activity, Database, Code } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [overview, setOverview] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [presetIndex, setPresetIndex] = useState(null);

  // Initialize Lenis smooth inertia scrolling
  useEffect(() => {
    const scrollHandler = initLenis();
    return () => {
      scrollHandler?.destroy();
    };
  }, []);

  useEffect(() => {
    fetchHealth().then((health) => {
      setBackendStatus(health.status === 'healthy' ? 'healthy' : 'offline');
    });

    fetchOverview().then(setOverview);
  }, []);

  const handleLoadPreset = (index) => {
    setPresetIndex(index);
    setActiveTab('predictor');
  };

  return (
    <div className="min-h-screen bg-[#080c15] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Subtle Engineering Grid Background */}
      <div className="fixed inset-0 compiler-grid pointer-events-none opacity-40 z-0"></div>

      {/* Ambient Gradient Blobs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Floating Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={setCommandPaletteOpen}
        setActiveTab={setActiveTab}
        onLoadPreset={handleLoadPreset}
      />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        onOpenCommandPalette={setCommandPaletteOpen}
      />

      {/* Main Content with Page Transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'overview' && (
              <PipelineOverview overview={overview} setActiveTab={setActiveTab} />
            )}
            {activeTab === 'predictor' && (
              <LivePredictor initialPresetIndex={presetIndex} />
            )}
            {activeTab === 'benchmarks' && <BenchmarkHub />}
            {activeTab === 'explorer' && <DatasetExplorer />}
            {activeTab === 'patch' && <PatchInspector />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Architectural Compiler Footer */}
      <footer className="border-t border-[#1d2c47] bg-[#080c15]/90 py-8 px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-slate-300 font-semibold">
              Spill-ML: LLVM 19.1.7 Greedy Register Allocation ML Intelligence Lab
            </span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span>PolyBench / zlib / Lua</span>
            <span>5-Fold Grouped CV</span>
            <span className="text-cyan-400 font-bold">PR-AUC: 0.910 vs 0.710</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
