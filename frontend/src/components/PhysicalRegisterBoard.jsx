import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, ShieldCheck, ShieldAlert, ArrowDown } from 'lucide-react';

const X86_REGISTERS = [
  { name: 'RAX', role: 'Return Val / Acc', type: 'caller' },
  { name: 'RCX', role: 'Arg 4 / Counter', type: 'caller' },
  { name: 'RDX', role: 'Arg 3 / Data', type: 'caller' },
  { name: 'RBX', role: 'Base Pointer', type: 'callee' },
  { name: 'RSI', role: 'Arg 2 / Source', type: 'caller' },
  { name: 'RDI', role: 'Arg 1 / Dest', type: 'caller' },
  { name: 'RBP', role: 'Frame Pointer', type: 'callee' },
  { name: 'RSP', role: 'Stack Pointer', type: 'reserved' },
  { name: 'R8',  role: 'Arg 5', type: 'caller' },
  { name: 'R9',  role: 'Arg 6', type: 'caller' },
  { name: 'R10', role: 'Temp / Scratch', type: 'caller' },
  { name: 'R11', role: 'Temp / Scratch', type: 'caller' },
  { name: 'R12', role: 'Preserved', type: 'callee' },
  { name: 'R13', role: 'Preserved', type: 'callee' },
  { name: 'R14', role: 'Preserved', type: 'callee' },
  { name: 'R15', role: 'Preserved', type: 'callee' },
];

export default function PhysicalRegisterBoard({ freeRegs, totalRegs = 15, isSpill, prob }) {
  const freeCount = Math.min(15, Math.max(0, freeRegs));

  return (
    <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1d2c47] pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>x86-64 Physical Register Hardware Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time physical register interference &amp; stack slot allocation visualizer
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#09101d] border border-[#1d2c47] text-slate-300">
            {freeCount > 0 ? (
              <span className="text-emerald-400 font-bold">{freeCount} Free Slots (IK_Free)</span>
            ) : (
              <span className="text-rose-400 font-bold">0 Free (Class Saturated)</span>
            )}
          </span>
        </div>
      </div>

      {/* Physical Register Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {X86_REGISTERS.map((reg, idx) => {
          // Reserve RSP
          if (reg.name === 'RSP') {
            return (
              <div
                key={reg.name}
                className="bg-[#09101d] border border-slate-800 rounded-xl p-2.5 text-center opacity-60"
              >
                <span className="font-mono font-bold text-xs text-slate-400 block">{reg.name}</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase">Reserved</span>
              </div>
            );
          }

          const isAvailable = idx < freeCount;
          return (
            <motion.div
              key={reg.name}
              initial={false}
              animate={{
                scale: isAvailable ? 1 : 0.98,
                borderColor: isAvailable ? 'rgba(16, 185, 129, 0.4)' : 'rgba(29, 44, 71, 0.8)'
              }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl p-2.5 border text-center transition-all ${
                isAvailable
                  ? 'bg-emerald-950/20 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'bg-[#09101d] border-[#1d2c47]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs text-white">{reg.name}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-mono block truncate ${
                  isAvailable ? 'text-emerald-300 font-semibold' : 'text-slate-400'
                }`}
              >
                {isAvailable ? 'IK_FREE' : 'OCCUPIED'}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Memory Stack Spill Slot Section */}
      <div className="pt-2">
        <div className="bg-[#09101d] border border-[#1d2c47] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl ${
                isSpill ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-white flex items-center space-x-2">
                <span>Stack Memory Spill Slot:</span>
                <span className="text-cyan-400 font-mono">[RSP + 0x18]</span>
              </p>
              <p className="text-[11px] text-slate-400">
                {isSpill
                  ? 'Memory write instruction (MOV [RSP+0x18], %vreg) generated. Costly RAM latency penalty.'
                  : 'Register allocation preserved in hardware. Zero stack spills introduced.'}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                isSpill
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {isSpill ? 'STACK MEMORY ACTIVE' : 'NO MEMORY SPILL'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
