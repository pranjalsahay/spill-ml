import React, { useState, useEffect } from 'react';
import {
  Activity,
  Trophy,
  Sliders,
  CheckCircle2,
  TrendingUp,
  GitBranch,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  BarChart2
} from 'lucide-react';
import { fetchModels, fetchBenchmarks } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

export default function BenchmarkHub() {
  const [models, setModels] = useState([]);
  const [benchmarks, setBenchmarks] = useState(null);
  const [activeThreshold, setActiveThreshold] = useState(0.5);

  useEffect(() => {
    fetchModels().then(setModels);
    fetchBenchmarks().then(setBenchmarks);
  }, []);

  const cvFoldsData = [
    { fold: 'Fold 1', Model: 0.898, Baseline: 0.703 },
    { fold: 'Fold 2', Model: 0.899, Baseline: 0.730 },
    { fold: 'Fold 3', Model: 0.917, Baseline: 0.789 },
    { fold: 'Fold 4', Model: 0.962, Baseline: 0.687 },
    { fold: 'Fold 5', Model: 0.889, Baseline: 0.643 }
  ];

  const endToEndData = [
    { name: 'Gate + Model', pr_auc: 0.719, fill: '#10b981' },
    { name: 'Gate + Weight', pr_auc: 0.564, fill: '#06b6d4' },
    { name: 'Weight Only (LLVM)', pr_auc: 0.112, fill: '#f59e0b' },
    { name: 'Random Guess', pr_auc: 0.052, fill: '#64748b' }
  ];

  const thresholdRows = [
    { thr: 0.3, flagged: 1033, m_p: 0.691, m_r: 0.957, m_f1: 0.803, b_p: 0.608, b_r: 0.842, b_f1: 0.706 },
    { thr: 0.5, flagged: 777,  m_p: 0.825, m_r: 0.859, m_f1: 0.842, b_p: 0.646, b_r: 0.673, b_f1: 0.659 },
    { thr: 0.7, flagged: 574,  m_p: 0.894, m_r: 0.688, m_f1: 0.777, b_p: 0.674, b_r: 0.519, b_f1: 0.586 }
  ];

  const currentThrData = thresholdRows.find((r) => r.thr === activeThreshold) || thresholdRows[1];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rigorous Cross-Validation Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Model Benchmarks & Generalization Evaluation
          </h1>
          <p className="text-sm text-slate-300">
            Comparing Random Forest, Gradient Boosting, Decision Tree, Logistic Regression, and LLVM's greedy spill-weight heuristic across 5-fold program-grouped cross validation and leave-one-project-out generalization.
          </p>
        </div>
      </div>

      {/* Model Comparison Leaderboard */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Model Comparison Leaderboard</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cross-validated area under the ROC curve (ROC-AUC) and Precision-Recall curve (PR-AUC)
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800 self-start sm:self-auto">
            Top Performer: Random Forest &amp; GradBoost
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1d2c47] text-slate-400">
                <th className="pb-3 font-semibold uppercase tracking-wider">Model Architecture</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-right">ROC-AUC (± std)</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-right">PR-AUC (± std)</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-right">Gain vs Baseline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2c47]/50">
              {models.map((m, idx) => {
                const isBest = m.model === 'RandomForest' || m.model === 'GradBoost';
                const isBase = m.model.includes('Baseline');
                const basePR = 0.312;
                const gain = !isBase ? `${Math.round(((m.pr_auc - basePR) / basePR) * 100)}%` : 'Baseline';

                return (
                  <tr
                    key={m.model}
                    className={`hover:bg-[#131e33]/50 transition-colors ${
                      isBest ? 'bg-cyan-500/5' : ''
                    }`}
                  >
                    <td className="py-3.5 flex items-center space-x-2.5">
                      <span className={`w-2 h-2 rounded-full ${
                        isBest ? 'bg-cyan-400' : isBase ? 'bg-slate-500' : 'bg-blue-400'
                      }`} />
                      <span className={`font-semibold ${isBest ? 'text-white font-bold' : 'text-slate-200'}`}>
                        {m.model}
                      </span>
                      {isBest && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                          Recommended
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right font-medium text-slate-200">
                      {m.roc_auc.toFixed(3)} <span className="text-slate-500 text-[10px]">± {m.roc_std.toFixed(3)}</span>
                    </td>
                    <td className={`py-3.5 text-right font-bold ${isBest ? 'text-cyan-400 text-sm' : 'text-slate-200'}`}>
                      {m.pr_auc.toFixed(3)} <span className="text-slate-500 text-[10px]">± {m.pr_std.toFixed(3)}</span>
                    </td>
                    <td className={`py-3.5 text-right font-semibold ${
                      !isBase ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {gain !== 'Baseline' ? `+${gain}` : gain}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Fold Program-Grouped CV Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">5-Fold Grouped CV (Hard Intervals)</h2>
              <p className="text-xs text-slate-400">Random Forest PR-AUC vs LLVM Spill-Weight Baseline per fold</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-800">
              5/5 Folds Superior
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cvFoldsData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="fold" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[0, 1.0]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09101d', borderColor: '#1d2c47', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Model" fill="#10b981" radius={[4, 4, 0, 0]} name="Random Forest (Mean: 0.913)" />
                <Bar dataKey="Baseline" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="LLVM Baseline (Mean: 0.710)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threshold Sensitivity Explorer */}
        <div className="lg:col-span-5 bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Threshold Sensitivity (τ)</h2>
            <p className="text-xs text-slate-400">Precision, Recall, and F1 trade-offs on held-out test intervals</p>
          </div>

          {/* Threshold selector tabs */}
          <div className="flex gap-2">
            {[0.3, 0.5, 0.7].map((thr) => (
              <button
                key={thr}
                onClick={() => setActiveThreshold(thr)}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeThreshold === thr
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-[#09101d] text-slate-400 border border-[#1d2c47] hover:bg-[#131e33]'
                }`}
              >
                τ = {thr}
              </button>
            ))}
          </div>

          {/* Metrics Card for active threshold */}
          <div className="bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#1d2c47]">
              <span className="text-slate-400">Flagged Intervals</span>
              <span className="text-white font-bold">{currentThrData.flagged} intervals</span>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Precision</span>
                <span className="text-emerald-400 font-bold">{(currentThrData.m_p * 100).toFixed(1)}% <span className="text-slate-500 font-normal">vs base {(currentThrData.b_p * 100).toFixed(1)}%</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recall</span>
                <span className="text-cyan-400 font-bold">{(currentThrData.m_r * 100).toFixed(1)}% <span className="text-slate-500 font-normal">vs base {(currentThrData.b_r * 100).toFixed(1)}%</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">F1 Score</span>
                <span className="text-purple-400 font-bold">{currentThrData.m_f1.toFixed(3)} <span className="text-slate-500 font-normal">vs base {currentThrData.b_f1.toFixed(3)}</span></span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            At threshold <strong className="text-cyan-400">0.5</strong>, the model achieves balanced performance with <strong className="text-white font-mono">0.842 F1</strong> vs <strong className="text-slate-300 font-mono">0.659</strong> for LLVM spill-weight baseline.
          </p>
        </div>
      </div>

      {/* Leave-One-Project-Out Generalization Cards */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>Leave-One-Project-Out Generalization</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Testing models on entire projects never seen during training (PolyBench vs zlib vs Lua)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              project: 'PolyBench 4.2.1',
              subtitle: 'Dense Numerical Linear Algebra',
              hard: 592,
              spilled: 245,
              model_pr: 0.871,
              base_pr: 0.784,
              model_f1: 0.789,
              base_f1: 0.735,
              gain: '+11.1%'
            },
            {
              project: 'zlib',
              subtitle: 'Byte Stream Compression Algorithms',
              hard: 299,
              spilled: 153,
              model_pr: 0.887,
              base_pr: 0.663,
              model_f1: 0.855,
              base_f1: 0.697,
              gain: '+33.8%'
            },
            {
              project: 'Lua Bytecode VM',
              subtitle: 'Dynamic Virtual Machine Interpreter',
              hard: 707,
              spilled: 348,
              model_pr: 0.781,
              base_pr: 0.703,
              model_f1: 0.715,
              base_f1: 0.671,
              gain: '+11.1%'
            }
          ].map((proj) => (
            <div
              key={proj.project}
              className="bg-[#09101d] border border-[#1d2c47] rounded-2xl p-5 space-y-4 hover:border-cyan-500/40 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-base">{proj.project}</h3>
                  <p className="text-[11px] text-slate-400">{proj.subtitle}</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-full">
                  {proj.gain}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Hard Intervals:</span>
                  <span className="text-white">{proj.hard}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Actual Spilled:</span>
                  <span className="text-white">{proj.spilled}</span>
                </div>
                <div className="pt-2 border-t border-[#1d2c47] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model PR-AUC:</span>
                    <span className="text-cyan-400 font-bold">{proj.model_pr.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Baseline PR-AUC:</span>
                    <span className="text-slate-400">{proj.base_pr.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* End-to-End Pipeline Comparison */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <span>End-to-End Evaluation Across All Spillable Intervals</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Evaluating the combined Gate + Model pipeline against pure LLVM weight ranking over all 18,628 intervals
            </p>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/50 px-3 py-1 rounded-full border border-purple-800 self-start sm:self-auto">
            Random Guess PR-AUC: 0.052
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={endToEndData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 0.8]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09101d', borderColor: '#1d2c47', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="pr_auc" radius={[0, 6, 6, 0]}>
                  {endToEndData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-5 bg-[#09101d] border border-[#1d2c47] rounded-2xl p-5 space-y-3 text-xs leading-relaxed">
            <p className="text-slate-200">
              <strong className="text-emerald-400">Key Finding:</strong> Most of the gain over the plain weight ranking comes from the <span className="text-cyan-300 font-mono">Contention Gate</span> (jumping from 0.112 to 0.564), and the <span className="text-emerald-300 font-mono">Random Forest Model</span> adds another <strong className="text-emerald-300">+0.155</strong> on top (reaching 0.719).
            </p>
            <p className="text-slate-400">
              Plain spill-weight heuristic in LLVM lacks context about physical register saturation, resulting in poor ranking across the entire interval population (0.112 PR-AUC).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
