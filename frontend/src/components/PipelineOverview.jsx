import React, { useState } from 'react';
import {
  ShieldAlert,
  Zap,
  TrendingUp,
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  FileCode,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import MetricCard from './MetricCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function PipelineOverview({ overview, setActiveTab }) {
  const [selectedStep, setSelectedStep] = useState(3);

  const pipelineSteps = [
    {
      id: 0,
      title: 'C Benchmark Suites',
      desc: 'PolyBench 4.2.1, zlib, and Lua real-world programs.',
      badge: 'Source Code',
      detail: '74-80 programs compiled to analyze diverse workload characteristics: dense numerical linear algebra (PolyBench), byte streaming compression (zlib), and dynamic bytecode interpreter loops (Lua).'
    },
    {
      id: 1,
      title: 'LLVM IR Generation',
      desc: 'Clang compiles C sources to target-independent IR.',
      badge: 'clang -O2',
      detail: 'Generated via `clang -O2 -S -emit-llvm` into data/ir/*.ll. SSA form with infinite virtual registers is constructed prior to register allocation.'
    },
    {
      id: 2,
      title: 'Patched LLC (SPILL_DUMP=1)',
      desc: 'Greedy Register Allocator instrumentation in C++.',
      badge: 'RegAllocGreedy.cpp',
      detail: 'Instruments `RAGreedy::selectOrSplitImpl` in LLVM 19.1.7 (x86-64). At every decision point, emits SPILLDATA lines capturing live range span, uses/defs, loop depth, register interference, and available physical registers.'
    },
    {
      id: 3,
      title: 'Feature Extraction & Gate',
      desc: 'Constructs feature vectors and evaluates the Contention Gate.',
      badge: 'Gate Mechanism',
      detail: 'Key empirical discovery: 100% of decision-point spills occur when free_regs == 0. The First-Visit Gate reaches 77.6% recall ceiling (746/961 spills). Non-hard intervals bypass the model with 0% spill risk.'
    },
    {
      id: 4,
      title: 'Machine Learning vs Baseline',
      desc: 'Grouped Random Forest vs LLVM static spill weight.',
      badge: 'Model Inference',
      detail: 'On hard intervals, Random Forest achieves 0.910 PR-AUC vs 0.710 for LLVM spill-weight baseline. End-to-end PR-AUC reaches 0.719 vs 0.112 (a +542% gain).'
    }
  ];

  const regClassData = overview?.top_reg_classes || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1626] via-[#09101d] to-[#080c15] border border-[#1d2c47] p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Empirical LLVM Compiler Optimization Study</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Machine Learning Guided Spill Prediction for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">LLVM Register Allocation</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Predicting whether LLVM's Greedy Register Allocator (<span className="text-cyan-300 font-mono">LLVM 19.1.7, x86-64</span>) spills a live interval using feature vectors dumped at the allocator's decision point, outperforming the heuristic spill-weight baseline by up to <strong className="text-emerald-400 font-mono">+542%</strong>.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('predictor')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-teal-400 transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Launch Live Predictor</span>
            </button>
            <button
              onClick={() => setActiveTab('benchmarks')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#131e33] border border-[#1d2c47] text-slate-200 font-medium text-sm hover:bg-[#1a2942] hover:text-white transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Explore Benchmarks</span>
            </button>
            <button
              onClick={() => setActiveTab('patch')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#131e33] border border-[#1d2c47] text-slate-200 font-medium text-sm hover:bg-[#1a2942] hover:text-white transition-all cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>View C++ Patch</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Gate Recall Ceiling"
          value={`${overview?.first_visit_gate_ceiling || 77.6}%`}
          subtext="746 of 961 spills caught at first visit"
          icon={ShieldAlert}
          color="emerald"
          badge="First-Visit Filter"
        />
        <MetricCard
          title="Hard Intervals PR-AUC"
          value="0.910"
          subtext="Model vs 0.710 LLVM baseline (+28.2%)"
          icon={Zap}
          color="cyan"
          badge="5/5 Folds Superior"
        />
        <MetricCard
          title="End-to-End PR-AUC"
          value="0.719"
          subtext="Gate+Model vs 0.112 Weight-Only"
          icon={TrendingUp}
          color="purple"
          badge="+542% Relative Gain"
        />
        <MetricCard
          title="Spillable Intervals"
          value={(overview?.spillable_intervals || 18628).toLocaleString()}
          subtext={`Across ${overview?.programs_count || 80} programs in 3 suites`}
          icon={FolderTree}
          color="amber"
          badge="GroupKFold Validated"
        />
      </div>

      {/* Interactive Compiler Pipeline */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>Interactive LLVM Compiler Optimization Pipeline</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Click through the stages to inspect instrumentation, feature extraction, and decision points
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-800 self-start sm:self-auto">
            Stage {selectedStep + 1} of {pipelineSteps.length}
          </span>
        </div>

        {/* Step Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {pipelineSteps.map((step) => {
            const isSelected = selectedStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setSelectedStep(step.id)}
                className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/60 to-[#0e1626] border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-[#09101d] border-[#1d2c47]/80 hover:border-slate-600 hover:bg-[#0f172a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {step.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500">#{step.id + 1}</span>
                </div>
                <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {step.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* Step Detail Card */}
        <div className="bg-[#09101d] border border-[#1d2c47] rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Info className="w-4 h-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wider font-mono">
              Stage #{selectedStep + 1}: {pipelineSteps[selectedStep].title}
            </h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            {pipelineSteps[selectedStep].detail}
          </p>
        </div>
      </div>

      {/* Deep Dives: Gate Discovery & Project Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gate Discovery Highlight */}
        <div className="lg:col-span-2 bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">The "Free Register Gate" Breakthrough</h3>
              <p className="text-xs text-slate-400">Why physical register saturation is the definitive spill prerequisite</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#09101d] border border-emerald-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-semibold">FREE REGS &gt; 0</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">Fast Path</span>
              </div>
              <p className="text-2xl font-black text-white font-mono">0.00%</p>
              <p className="text-xs text-slate-400">
                0 out of 16,429 intervals with free physical registers spilled immediately. The allocator always assigns available physical slots.
              </p>
            </div>

            <div className="bg-[#09101d] border border-rose-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-rose-400 font-semibold">FREE REGS == 0</span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono">Contention Gate</span>
              </div>
              <p className="text-2xl font-black text-white font-mono">43.70%</p>
              <p className="text-xs text-slate-400">
                961 out of 2,199 saturated intervals spilled. This is where machine learning shines by predicting eviction vs memory spill.
              </p>
            </div>
          </div>

          <div className="bg-[#09101d]/60 border border-[#1d2c47] rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-300">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-amber-300">Eviction Cascades (215 intervals):</strong> 215 of 961 spills were initially assigned a free register on their first visit, but were later evicted in subsequent rounds when higher-priority intervals arrived. All 215 were examined multiple times by LLVM's greedy queue.
            </p>
          </div>
        </div>

        {/* Project Breakdown Card */}
        <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Benchmark Suites</h3>
            <p className="text-xs text-slate-400">Interval and spill statistics per testbed</p>
          </div>

          <div className="space-y-3">
            {(overview?.projects || []).map((proj) => (
              <div key={proj.project} className="bg-[#09101d] border border-[#1d2c47] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-cyan-400">{proj.project}</span>
                  <span className="text-xs font-mono text-slate-400">{proj.programs} programs</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{proj.total_intervals.toLocaleString()} intervals</span>
                  <span className="font-mono text-slate-200">{proj.spilled} spills ({proj.spill_rate}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, proj.spill_rate * 10)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Register Class Contention Bar Chart */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Spill Distribution by x86-64 Register Class</h3>
            <p className="text-xs text-slate-400">
              GR64 (64-bit general purpose) represents 63.8% of all spills (613 spills), followed by GR32 and FR64
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-[#09101d] px-3 py-1 rounded-full border border-[#1d2c47] self-start sm:self-auto">
            Total Classes: {regClassData.length}
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regClassData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="reg_class" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#09101d', borderColor: '#1d2c47', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#06b6d4' }}
              />
              <Bar dataKey="spilled" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                {regClassData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#06b6d4' : index === 1 ? '#0ea5e9' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
