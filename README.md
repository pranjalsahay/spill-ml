# ML-guided spill prediction for LLVM register allocation

Predicts whether LLVM's Greedy register allocator (LLVM 19.1.7, x86-64) spills a live interval, using features recorded at the allocator's decision point.

---

## ⚡ Quick Start: Launch Full-Stack Web Dashboard

The project includes an interactive compiler intelligence web dashboard powered by a **FastAPI** backend and a **React + Tailwind CSS** frontend with real-time inference, an x86-64 physical register hardware matrix, and benchmark analytics.

### Single-Command Launch (Production Mode):
```bash
python run.py
```
*or on Windows PowerShell:*
```powershell
.\start.ps1
```
- **Web App**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **API Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Hot-Reload Development Mode:
```bash
python run.py --dev
```
- **React Dev Server**: [http://localhost:5173](http://localhost:5173) (with HMR)
- **FastAPI API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)

### Dashboard Features:
1. **Interactive Compiler Pipeline**: Step-by-step visual walkthrough of C source $\to$ LLVM IR $\to$ RegAllocGreedy $\to$ Contention Gate $\to$ ML.
2. **Live Spill Predictor & Simulator**: Interactive sliders for spill weight, live size, loop nesting depth, uses/defs, register class, and free physical registers.
3. **Physical Register Hardware Board**: Live visual matrix of all 16 x86-64 physical CPU registers (`RAX`, `RBX`, `RCX`, `RDX`, `RSI`, `RDI`, `RBP`, `RSP`, `R8`-`R15`) and stack spill slots (`[RSP + 0x18]`).
4. **Command Palette (`⌘K` / `Ctrl+K`)**: Instant keyboard search, workload presets, and navigation.
5. **Benchmark & Evaluation Hub**: 5-fold program-grouped CV charts, threshold sensitivity explorer ($\tau \in [0.1, 0.9]$), and leave-one-project-out generalization cards.
6. **Dataset Explorer**: Searchable, filterable datatable of all 24,068 recorded live intervals across 80 programs, plus feature space scatter plots.
7. **LLVM Patch Inspector**: Syntax-highlighted C++ instrumentation for `RegAllocGreedy.cpp` with line-by-line annotations.

---

## Pipeline
C source -> LLVM IR -> patched llc (-regalloc=greedy, SPILL_DUMP=1) -> SPILLDATA lines -> CSV -> scikit-learn models -> comparison with a spill-weight baseline

## Layout
- `backend/` : FastAPI prediction engine, data caching service, and REST endpoints
- `frontend/` : React + Vite + Tailwind CSS + Framer Motion interactive web application
- `patches/spill_dump.patch` : instrumentation for llvm/lib/CodeGen/RegAllocGreedy.cpp (LLVM 19.1.7)
- `scripts/` : parsers, training and evaluation scripts
- `data/` : generated datasets (CSV)
- `results/` : saved outputs and plots
- `run.py` : master runner script for the full-stack web application
- `start.ps1` : PowerShell launcher

## Run the analysis only (no LLVM needed)
The scripts use the path ~/spill-ml, so clone into your home folder:

```bash
git clone https://github.com/pranjalsahay/spill-ml.git ~/spill-ml
cd ~/spill-ml
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 scripts/fair_eval.py
python3 scripts/leave_project_out.py
```

## Regenerate the data (needs LLVM)
1. Build LLVM 19.1.7 (X86 only, assertions on). From the llvm-project root run: `git apply ~/spill-ml/patches/spill_dump.patch`, then rebuild `llc`.
2. Compile PolyBench/C 4.2.1, zlib and lua to LLVM IR (`clang -O2 -S -emit-llvm`) into `data/ir/`.
3. Run `scripts/parse_features.py`, then `scripts/dedupe_v2.py`, then `scripts/parse_first.py`.

## Notes
This is an offline prediction study. It does not measure generated-code quality. Evaluation is grouped by program so files from one program are never split between training and test.

## Which scripts matter
Current pipeline: `parse_features.py` -> `dedupe_v2.py` -> `ablation.py`, `fair_eval.py`, `leave_project_out.py` (and `parse_first.py` -> `first_eval.py` for the first-visit check).
The early scripts (`parse_log.py`, `train.py`, `dedupe.py`, `eval_threshold.py`, `importance_check.py`, `train_v2.py`'s first run) were an initial prototype built on a log parser that wrote duplicate rows. They are kept for history, and their numbers should not be used.
Main dataset: `data/dataset2_dedup.csv` (one row per live interval, identical program copies removed).

## Results summary (first-visit features, 74 programs, 961 spills)
- A first-visit gate (no free register) reaches 746 of 961 spills (77.6%). The other 215 were assigned a register first and spilled after a later re-examination (consistent with eviction).
- Among gated intervals, 5-fold program-grouped CV: model PR-AUC mean 0.91 vs 0.71 for ranking by spill weight; model better in 5/5 folds (`results/first_eval.txt`).
- Leave-one-project-out: model beats the weight ranking on PolyBench (0.871 vs 0.784), zlib (0.887 vs 0.663) and lua (0.781 vs 0.703). Single runs, no error bars.
- End to end over all spillable intervals: gate+model 0.719 vs gate+weight 0.564 vs weight only 0.112 (random 0.052); model better in 5/5 folds (`results/end_to_end_fair.txt`). Most of the gain over the plain weight ranking comes from the gate, and the model adds about +0.155 on top.
- These are offline prediction results. They do not measure generated-code quality.
