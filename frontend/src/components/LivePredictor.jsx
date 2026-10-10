import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  Activity,
  Layers,
  Flame
} from 'lucide-react';
import { predictSpill } from '../services/api';
import PhysicalRegisterBoard from './PhysicalRegisterBoard';

export default function LivePredictor({ initialPresetIndex }) {
  const PRESETS = [
    {
      name: 'Matrix Multiply (Contention)',
      data: {
        live_size: 9600,
        weight: 0.0035,
        segments: 1,
        uses: 3,
        defs: 1,
        max_depth: 2,
        loop_refs: 2,
        crosses_mask: 1,
        free_regs: 0,
        total_regs: 15,
        reg_class: 'GR64',
        threshold: 0.5
      }
    },
    {
      name: 'Inner Loop Index (Heavy)',
      data: {
        live_size: 320,
        weight: 0.045,
        segments: 2,
        uses: 8,
        defs: 1,
        max_depth: 3,
        loop_refs: 7,
        crosses_mask: 0,
        free_regs: 0,
        total_regs: 15,
        reg_class: 'GR64',
        threshold: 0.5
      }
    },
    {
      name: 'Call Boundary Scalar',
      data: {
        live_size: 4500,
        weight: 0.0008,
        segments: 3,
        uses: 4,
        defs: 1,
        max_depth: 1,
        loop_refs: 1,
        crosses_mask: 1,
        free_regs: 0,
        total_regs: 15,
        reg_class: 'GR64',
        threshold: 0.5
      }
    },
    {
      name: 'Free Register Fast-Path',
      data: {
        live_size: 1200,
        weight: 0.005,
        segments: 1,
        uses: 3,
        defs: 1,
        max_depth: 0,
        loop_refs: 0,
        crosses_mask: 0,
        free_regs: 4,
        total_regs: 15,
        reg_class: 'GR64',
        threshold: 0.5
      }
    }
  ];

  const [form, setForm] = useState(PRESETS[0].data);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const regClasses = ['GR64', 'GR32', 'VR128', 'FR64', 'GR64_with_sub_8bit', 'GR8'];

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    predictSpill(form)
      .then((res) => {
        if (mounted) {
          setResult(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [form]);

  useEffect(() => {
    if (initialPresetIndex !== null && initialPresetIndex !== undefined && PRESETS[initialPresetIndex]) {
      setForm(PRESETS[initialPresetIndex].data);
    }
  }, [initialPresetIndex]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const prob = result?.spill_probability ?? 0;
  const isSpill = (result?.spill_predicted ?? (prob >= form.threshold ? 1 : 0)) === 1;
  const isFreeGate = (form.free_regs || 0) > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-mono mb-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Allocator Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Live Spill Predictor & Heuristic Playground
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Adjust virtual register live interval features to observe gate decisions, ML spill probability, and LLVM baseline comparison
            </p>
          </div>

          {/* Workload Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setForm(p.data)}
                className="text-xs px-3 py-1.5 rounded-xl bg-[#09101d] border border-[#1d2c47] text-slate-300 hover:text-white hover:border-cyan-500/50 hover:bg-[#131e33] transition-all cursor-pointer font-mono"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Physical Hardware Register Map */}
      <PhysicalRegisterBoard
        freeRegs={form.free_regs}
        totalRegs={form.total_regs}
        isSpill={isSpill}
        prob={prob}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1d2c47] pb-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Live Interval Parameters</span>
            </h2>
            <button
              onClick={() => setForm(PRESETS[0].data)}
              className="text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Free Physical Registers (Gate controller) */}
            <div className="sm:col-span-2 bg-[#09101d] border border-cyan-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>Free Hardware Registers (IK_Free)</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {form.free_regs} / {form.total_regs}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="1"
                value={form.free_regs}
                onChange={(e) => handleChange('free_regs', Number(e.target.value))}
                className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[11px] text-slate-400">
                {form.free_regs > 0
                  ? '⚡ Free registers available: Bypasses model with 0% immediate spill rate (Fast Path).'
                  : '⚠️ 0 free registers: All physical registers saturated! Activates Contention Gate & ML Model.'}
              </p>
            </div>

            {/* Spill Weight Slider */}
            <div className="space-y-2 bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">LLVM Spill Weight</span>
                <span className="font-mono text-cyan-400 font-bold bg-[#131e33] px-2 py-0.5 rounded">
                  {form.weight.toFixed(5)}
                </span>
              </div>
              <input
                type="range"
                min="0.0001"
                max="0.08"
                step="0.0001"
                value={form.weight}
                onChange={(e) => handleChange('weight', Number(e.target.value))}
                className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[11px] text-slate-400">
                log10(weight) = {Math.log10(Math.max(1e-12, form.weight)).toFixed(2)}
              </p>
            </div>

            {/* Live Size Slider */}
            <div className="space-y-2 bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Live Interval Size (Span)</span>
                <span className="font-mono text-cyan-400 font-bold bg-[#131e33] px-2 py-0.5 rounded">
                  {form.live_size} units
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="12000"
                step="50"
                value={form.live_size}
                onChange={(e) => handleChange('live_size', Number(e.target.value))}
                className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[11px] text-slate-400">
                Number of machine instructions spanned by live range
              </p>
            </div>

            {/* Register Class */}
            <div className="space-y-2 bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4">
              <span className="text-xs font-semibold text-slate-200 block">Register Class</span>
              <select
                value={form.reg_class}
                onChange={(e) => handleChange('reg_class', e.target.value)}
                className="w-full bg-[#131e33] border border-[#1d2c47] text-white text-xs font-mono rounded-xl p-2.5 focus:border-cyan-400 outline-none"
              >
                {regClasses.map((rc) => (
                  <option key={rc} value={rc}>
                    {rc} {rc === 'GR64' ? '(64-bit GPR - 63.8% spills)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Loop Nesting Depth */}
            <div className="space-y-2 bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Max Loop Depth</span>
                <span className="font-mono text-cyan-400 font-bold bg-[#131e33] px-2 py-0.5 rounded">
                  {form.max_depth}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={form.max_depth}
                onChange={(e) => handleChange('max_depth', Number(e.target.value))}
                className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[11px] text-slate-400">
                {form.max_depth === 0 ? 'Top-level function code' : `Nested inside ${form.max_depth} loop level(s)`}
              </p>
            </div>

            {/* Non-debug Uses & Defs */}
            <div className="space-y-2 bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Uses / Defs Count</span>
                <span className="font-mono text-cyan-400 font-bold bg-[#131e33] px-2 py-0.5 rounded">
                  {form.uses} uses / {form.defs} defs
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={form.uses}
                  onChange={(e) => handleChange('uses', Number(e.target.value))}
                  className="w-1/2 h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={form.defs}
                  onChange={(e) => handleChange('defs', Number(e.target.value))}
                  className="w-1/2 h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Crosses Register Mask Toggle */}
            <div className="space-y-2 bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Crosses Call Reg Mask</span>
                <span className="text-[11px] text-slate-400">Interferes with caller-saved registers</span>
              </div>
              <button
                type="button"
                onClick={() => handleChange('crosses_mask', form.crosses_mask === 1 ? 0 : 1)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  form.crosses_mask === 1 ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    form.crosses_mask === 1 ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Threshold Slider */}
            <div className="sm:col-span-2 space-y-2 bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Decision Classification Threshold (τ)</span>
                <span className="font-mono text-cyan-400 font-bold bg-[#131e33] px-2 py-0.5 rounded">
                  {form.threshold}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={form.threshold}
                onChange={(e) => handleChange('threshold', Number(e.target.value))}
                className="w-full h-2 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>0.1 (High Recall)</span>
                <span>0.5 (Balanced)</span>
                <span>0.9 (High Precision)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Results Cockpit (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-[#1d2c47] pb-4">
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Prediction Cockpit</span>
              </h2>
              {loading && <span className="text-xs font-mono text-cyan-400 animate-pulse">Computing...</span>}
            </div>

            {/* Gate Status Pill */}
            <div>
              <div
                className={`p-4 rounded-2xl border flex items-center space-x-3 ${
                  isFreeGate
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                {isFreeGate ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-wider">
                    {result?.gate_badge || (isFreeGate ? 'Fast Path Active' : 'Contention Gate Active')}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {result?.gate_description}
                  </p>
                </div>
              </div>
            </div>

            {/* Spill Probability Gauge */}
            <div className="bg-[#09101d] border border-[#1d2c47] rounded-2xl p-5 text-center space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Predicted Spill Probability
              </span>

              <div className="text-5xl font-black font-mono tracking-tight text-white">
                {(prob * 100).toFixed(1)}%
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-[#1e293b] rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    prob >= 0.7
                      ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                      : prob >= 0.4
                      ? 'bg-amber-400 shadow-lg shadow-amber-400/50'
                      : 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                  }`}
                  style={{ width: `${Math.max(3, prob * 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-mono text-slate-400 pt-1">
                <span>0.0 (Keep)</span>
                <span className="text-cyan-400 font-bold">Threshold τ = {form.threshold}</span>
                <span>1.0 (Spill)</span>
              </div>
            </div>

            {/* Verdict Card */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isSpill
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
                  Model Recommendation
                </span>
                <span className="text-lg font-black font-mono">
                  {isSpill ? '🔴 SPILL TO STACK SLOT' : '🟢 ASSIGN PHYSICAL REGISTER'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#09101d] border border-[#1d2c47] text-white">
                  Risk: {result?.risk_level?.toUpperCase() || 'NORMAL'}
                </span>
              </div>
            </div>

            {/* Recommendation note */}
            {result?.recommendation && (
              <div className="bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4 text-xs text-slate-300 space-y-1">
                <span className="font-mono text-cyan-400 font-semibold block">Compiler Action Advice:</span>
                <p>{result.recommendation}</p>
              </div>
            )}

            {/* Feature Contributions SHAP style */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Top Decision Drivers
              </span>
              <div className="space-y-1.5">
                {(result?.feature_contributions || []).map((fc, i) => (
                  <div
                    key={i}
                    className="bg-[#09101d] border border-[#1d2c47] rounded-xl px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 font-medium">{fc.feature}</span>
                    <span
                      className={`font-mono text-[11px] ${
                        fc.direction === 'increase'
                          ? 'text-rose-400'
                          : fc.direction === 'decrease'
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {fc.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
