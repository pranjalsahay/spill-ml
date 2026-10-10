import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Layers,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { fetchIntervals, fetchScatterSample } from '../services/api';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function DatasetExplorer() {
  const [intervals, setIntervals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [project, setProject] = useState('');
  const [regClass, setRegClass] = useState('');
  const [spillFilter, setSpillFilter] = useState('');
  const [hardFilter, setHardFilter] = useState('');

  // Scatter plot data
  const [scatterData, setScatterData] = useState([]);

  useEffect(() => {
    fetchScatterSample(500).then(setScatterData);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      page,
      limit,
      ...(search ? { program: search } : {}),
      ...(project ? { project } : {}),
      ...(regClass ? { reg_class: regClass } : {}),
      ...(spillFilter !== '' ? { spilled: Number(spillFilter) } : {}),
      ...(hardFilter !== '' ? { is_hard: Number(hardFilter) } : {})
    };

    fetchIntervals(params)
      .then((data) => {
        setIntervals(data.intervals || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search, project, regClass, spillFilter, hardFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  const spilledScatter = scatterData.filter((d) => d.spilled === 1);
  const keptScatter = scatterData.filter((d) => d.spilled === 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>24,068 Recorded Live Intervals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dataset &amp; Live Interval Explorer
          </h1>
          <p className="text-sm text-slate-300">
            Search, filter, and inspect live intervals across 80 programs in PolyBench, zlib, and Lua with features dumped directly from LLVM's greedy register allocator.
          </p>
        </div>
      </div>

      {/* Scatter Plot: Weight vs Size Space */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Feature Space: log10(Spill Weight) vs log10(Live Size)</h2>
            <p className="text-xs text-slate-400">
              Interactive sample showing the boundary between spilled (red) and assigned (cyan) intervals
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-800 self-start sm:self-auto">
            Stratified 500 Interval Sample
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1d2c47" opacity={0.5} />
              <XAxis
                type="number"
                dataKey="log_size"
                name="log10(Live Size)"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              <YAxis
                type="number"
                dataKey="log_weight"
                name="log10(Weight)"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[-6, 1]}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#09101d] border border-[#1d2c47] p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
                        <p className="font-bold text-white">{data.program} : {data.func}</p>
                        <p className="text-slate-400">vreg: <span className="text-cyan-300">{data.vreg}</span> | {data.reg_class}</p>
                        <p className="text-slate-400">weight: <span className="text-cyan-300">{data.weight.toExponential(3)}</span></p>
                        <p className="text-slate-400">live size: <span className="text-cyan-300">{data.live_size}</span></p>
                        <p className={data.spilled === 1 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                          Status: {data.spilled === 1 ? 'SPILLED' : 'ASSIGNED TO REGISTER'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Scatter name="Assigned to Register" data={keptScatter} fill="#06b6d4" opacity={0.7} />
              <Scatter name="Spilled to Stack Slot" data={spilledScatter} fill="#f43f5e" opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0e1626]/90 border border-[#1d2c47] rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search program or function (e.g. 2mm, inflate, lvm)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#09101d] border border-[#1d2c47] pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Project filter */}
          <select
            value={project}
            onChange={(e) => {
              setProject(e.target.value);
              setPage(1);
            }}
            className="bg-[#09101d] border border-[#1d2c47] px-3 py-2.5 rounded-xl text-xs font-mono text-slate-200 focus:border-cyan-400 outline-none"
          >
            <option value="">All Projects</option>
            <option value="polybench">PolyBench</option>
            <option value="zlib">zlib</option>
            <option value="lua">Lua</option>
          </select>

          {/* Register Class filter */}
          <select
            value={regClass}
            onChange={(e) => {
              setRegClass(e.target.value);
              setPage(1);
            }}
            className="bg-[#09101d] border border-[#1d2c47] px-3 py-2.5 rounded-xl text-xs font-mono text-slate-200 focus:border-cyan-400 outline-none"
          >
            <option value="">All Register Classes</option>
            <option value="GR64">GR64 (64-bit GPR)</option>
            <option value="GR32">GR32 (32-bit GPR)</option>
            <option value="VR128">VR128 (Vector)</option>
            <option value="FR64">FR64 (Float)</option>
            <option value="GR8">GR8 (8-bit)</option>
          </select>

          {/* Spilled filter */}
          <select
            value={spillFilter}
            onChange={(e) => {
              setSpillFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#09101d] border border-[#1d2c47] px-3 py-2.5 rounded-xl text-xs font-mono text-slate-200 focus:border-cyan-400 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="1">Spilled (1)</option>
            <option value="0">Kept in Register (0)</option>
          </select>

          {/* Hard filter */}
          <select
            value={hardFilter}
            onChange={(e) => {
              setHardFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#09101d] border border-[#1d2c47] px-3 py-2.5 rounded-xl text-xs font-mono text-slate-200 focus:border-cyan-400 outline-none"
          >
            <option value="">All Gates</option>
            <option value="1">Hard (0 Free Regs)</option>
            <option value="0">Free Regs Available</option>
          </select>
        </div>

        {/* Results summary and pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1d2c47]">
          <span>
            Showing <strong className="text-white font-mono">{intervals.length}</strong> of{' '}
            <strong className="text-white font-mono">{total.toLocaleString()}</strong> intervals
          </span>

          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-[#09101d] border border-[#1d2c47] text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg bg-[#09101d] border border-[#1d2c47] text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Intervals Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#1d2c47]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#09101d] text-slate-400 border-b border-[#1d2c47]">
              <tr>
                <th className="py-3 px-3">Program</th>
                <th className="py-3 px-3">Function</th>
                <th className="py-3 px-3">vreg</th>
                <th className="py-3 px-3">Reg Class</th>
                <th className="py-3 px-3 text-right">Live Size</th>
                <th className="py-3 px-3 text-right">Spill Weight</th>
                <th className="py-3 px-3 text-center">Uses/Defs</th>
                <th className="py-3 px-3 text-center">Loop Depth</th>
                <th className="py-3 px-3 text-center">Free Regs</th>
                <th className="py-3 px-3 text-center">Visits</th>
                <th className="py-3 px-3 text-center">Spill Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2c47]/50 bg-[#0e1626]/60">
              {intervals.map((row, idx) => {
                const isSpilled = row.spilled === 1;
                return (
                  <tr key={idx} className="hover:bg-[#131e33] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[140px]">{row.program}</td>
                    <td className="py-2.5 px-3 text-slate-300 truncate max-w-[120px]">{row.func}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">%{row.vreg}</td>
                    <td className="py-2.5 px-3 text-slate-300">{row.reg_class}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{Math.round(row.live_size)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{Number(row.weight).toExponential(2)}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{row.uses}/{row.defs}</td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{row.max_depth}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        row.free_regs === 0 ? 'bg-rose-950/70 text-rose-300 border border-rose-800' : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                      }`}>
                        {row.free_regs}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{row.visits}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSpilled ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isSpilled ? 'SPILLED' : 'KEPT'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
