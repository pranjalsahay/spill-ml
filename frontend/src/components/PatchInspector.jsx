import React, { useState, useEffect } from 'react';
import {
  Code,
  FileCode,
  Copy,
  Check,
  Terminal,
  BookOpen,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { fetchPatch } from '../services/api';

export default function PatchInspector() {
  const [patchData, setPatchData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    fetchPatch().then(setPatchData);
  }, []);

  const handleCopy = () => {
    if (patchData?.content) {
      navigator.clipboard.writeText(patchData.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sections = patchData?.sections || [
    {
      title: 'Environment Variable Activation',
      code: `static bool spillDumpEnabled() {
  static const bool Enabled = std::getenv("SPILL_DUMP") != nullptr;
  return Enabled;
}`,
      explanation: 'Safely toggles feature logging at runtime via SPILL_DUMP=1 environment variable, avoiding overhead during standard LLVM builds.'
    },
    {
      title: 'Operand & Loop Depth Traversal',
      code: `static void dumpSpillFeatures(const LiveInterval &VirtReg, MachineFunction &MF,
                              MachineRegisterInfo &MRI,
                              const TargetRegisterInfo &TRI,
                              MachineLoopInfo &Loops, LiveRegMatrix &Matrix,
                              AllocationOrder &Order) {
  unsigned Uses = 0, Defs = 0, MaxDepth = 0, LoopRefs = 0;
  for (const MachineOperand &MO : MRI.reg_nodbg_operands(VirtReg.reg())) {
    if (MO.isDef()) ++Defs; else ++Uses;
    unsigned Depth = Loops.getLoopDepth(MO.getParent()->getParent());
    MaxDepth = std::max(MaxDepth, Depth);
    if (Depth > 0) ++LoopRefs;
  }`,
      explanation: 'Traverses the machine register operands, ignoring debug instructions, while querying LLVM MachineLoopInfo to record maximum loop nesting depth and loop reference frequency.'
    },
    {
      title: 'LiveRegMatrix Interference & Free Reg Count',
      code: `  unsigned FreeRegs = 0, TotalRegs = 0;
  for (auto PhysReg : Order) {
    ++TotalRegs;
    if (Matrix.checkInterference(VirtReg, PhysReg) == LiveRegMatrix::IK_Free)
      ++FreeRegs;
  }
  int CrossesRegMask = Matrix.checkRegMaskInterference(VirtReg) ? 1 : 0;
  errs() << "SPILLDATA,F," << MF.getName() << ','
         << Register::virtReg2Index(VirtReg.reg()) << ','
         << TRI.getRegClassName(MRI.getRegClass(VirtReg.reg())) << ','
         << VirtReg.size() << ',' << VirtReg.getSize() << ','
         << VirtReg.weight() << ',' << Uses << ',' << Defs << ','
         << MaxDepth << ',' << LoopRefs << ',' << CrossesRegMask << ','
         << FreeRegs << ',' << TotalRegs << ','
         << (VirtReg.isSpillable() ? 1 : 0) << '\\n';
}`,
      explanation: 'Iterates through the target architecture AllocationOrder and checks physical register interference against LiveRegMatrix. Emits structured SPILLDATA CSV rows to stderr.'
    },
    {
      title: 'Greedy Allocator Intercept Hook',
      code: `MCRegister RAGreedy::selectOrSplitImpl(const LiveInterval &VirtReg,
                                       SmallVectorImpl<Register> &NewVRegs,
                                       SmallVirtRegSet &FixedRegisters,
                                       Depth) {
  if (spillDumpEnabled())
    dumpSpillFeatures(VirtReg, MF, *MRI, *TRI, *Loops, *Matrix, *Order);
  ...
}`,
      explanation: 'Hooks into LLVM RegAllocGreedy right before register assignment, splitting, or eviction decisions occur.'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-mono">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>LLVM 19.1.7 C++ Instrumentation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Compiler Patch &amp; Instrumentation Inspector
            </h1>
            <p className="text-sm text-slate-300">
              Examining the exact instrumentation injected into <code className="text-cyan-300 font-mono">llvm/lib/CodeGen/RegAllocGreedy.cpp</code> to dump feature vectors during Greedy register allocation.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="self-start md:self-auto inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#131e33] border border-[#1d2c47] text-slate-200 hover:text-white hover:border-cyan-500/50 transition-all font-mono text-xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Copied Full Patch!' : 'Copy spill_dump.patch'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation list */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1 block">
            Patch Code Walkthrough
          </span>

          {sections.map((sec, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSection(idx)}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                activeSection === idx
                  ? 'bg-[#131e33] border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#09101d] border-[#1d2c47] text-slate-300 hover:bg-[#0f172a]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-cyan-400 font-bold">Part #{idx + 1}</span>
                <span className="text-[11px] font-mono text-slate-500">C++</span>
              </div>
              <h3 className="text-sm font-semibold text-white">{sec.title}</h3>
            </button>
          ))}

          {/* Reproduction Box */}
          <div className="bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4 space-y-2.5 text-xs">
            <span className="font-mono text-emerald-400 font-semibold block flex items-center space-x-1.5">
              <Terminal className="w-4 h-4" />
              <span>How to Apply to LLVM:</span>
            </span>
            <div className="bg-[#080c15] p-3 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
              <p className="text-slate-500"># From llvm-project root:</p>
              <p>git apply ~/spill-ml/patches/spill_dump.patch</p>
              <p className="text-slate-500"># Rebuild llc target:</p>
              <p>ninja llc</p>
              <p className="text-slate-500"># Run compiler with dump enabled:</p>
              <p>SPILL_DUMP=1 ./bin/llc -regalloc=greedy ...</p>
            </div>
          </div>
        </div>

        {/* Code display */}
        <div className="lg:col-span-8 bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-[#1d2c47] pb-4">
            <div>
              <span className="text-xs font-mono text-cyan-400">Section {activeSection + 1} of {sections.length}</span>
              <h2 className="text-lg font-bold text-white tracking-tight">{sections[activeSection].title}</h2>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-[#09101d] px-3 py-1 rounded-full border border-[#1d2c47]">
              llvm/lib/CodeGen/RegAllocGreedy.cpp
            </span>
          </div>

          {/* Explanation Box */}
          <div className="bg-[#09101d] border border-cyan-500/20 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed">
            <strong className="text-cyan-300 block mb-1">Architectural Role:</strong>
            {sections[activeSection].explanation}
          </div>

          {/* Code Viewer */}
          <div className="relative rounded-2xl overflow-hidden bg-[#080c15] border border-[#1d2c47] p-4">
            <pre className="font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
              <code>{sections[activeSection].code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
