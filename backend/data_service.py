import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

_parent = Path(__file__).resolve().parent.parent
if (_parent / "data").exists():
    BASE_DIR = _parent
elif (_parent / "spill-ml" / "data").exists():
    BASE_DIR = _parent / "spill-ml"
else:
    BASE_DIR = _parent

DATA_DIR = BASE_DIR / "data"
RESULTS_DIR = BASE_DIR / "results"
PATCHES_DIR = BASE_DIR / "patches"

class DataService:
    def __init__(self):
        self.df_dedup: Optional[pd.DataFrame] = None
        self.df_first: Optional[pd.DataFrame] = None
        self._load_data()

    def _load_data(self):
        dedup_path = DATA_DIR / "dataset2_dedup.csv"
        first_path = DATA_DIR / "dataset3_first.csv"

        if dedup_path.exists():
            df = pd.read_csv(dedup_path)
            df["project"] = np.where(
                df.program.str.startswith("zlib_"), "zlib",
                np.where(df.program.str.startswith("lua_"), "lua", "polybench")
            )
            df["is_hard"] = (df.free_regs == 0).astype(int)
            self.df_dedup = df
        
        if first_path.exists():
            df_f = pd.read_csv(first_path)
            df_f["project"] = np.where(
                df_f.program.str.startswith("zlib_"), "zlib",
                np.where(df_f.program.str.startswith("lua_"), "lua", "polybench")
            )
            df_f["is_hard"] = (df_f.free_regs == 0).astype(int)
            self.df_first = df_f

    def get_overview(self) -> Dict[str, Any]:
        if self.df_dedup is None:
            return {}
        
        df = self.df_dedup
        spillable = df[df.spillable == 1]
        spilled_total = int(df.spilled.sum())
        spillable_count = int(len(spillable))
        hard_intervals = spillable[spillable.free_regs == 0]
        free_intervals = spillable[spillable.free_regs > 0]

        # Projects breakdown
        projects = []
        for p, g in spillable.groupby("project"):
            projects.append({
                "project": p,
                "programs": int(g.program.nunique()),
                "total_intervals": int(len(g)),
                "spilled": int(g.spilled.sum()),
                "spill_rate": round(float(g.spilled.mean() * 100), 2)
            })

        # Reg classes breakdown
        reg_classes = []
        for rc, g in spillable.groupby("reg_class"):
            reg_classes.append({
                "reg_class": rc,
                "total": int(len(g)),
                "spilled": int(g.spilled.sum()),
                "spill_rate": round(float(g.spilled.mean() * 100), 2)
            })
        reg_classes.sort(key=lambda x: x["spilled"], reverse=True)

        return {
            "total_intervals": int(len(df)),
            "spillable_intervals": spillable_count,
            "total_spilled": spilled_total,
            "overall_spill_rate": round(float(spilled_total / spillable_count * 100), 2),
            "programs_count": int(df.program.nunique()),
            "hard_intervals_count": int(len(hard_intervals)),
            "hard_spilled_count": int(hard_intervals.spilled.sum()),
            "hard_spill_rate": round(float(hard_intervals.spilled.mean() * 100), 2),
            "free_intervals_count": int(len(free_intervals)),
            "free_spilled_count": int(free_intervals.spilled.sum()),
            "free_spill_rate": round(float(free_intervals.spilled.mean() * 100), 2),
            "first_visit_gate_ceiling": 77.6,  # 746 / 961
            "eviction_cascade_spills": 215,
            "projects": projects,
            "top_reg_classes": reg_classes[:8]
        }

    def get_model_comparison(self) -> List[Dict[str, Any]]:
        csv_path = RESULTS_DIR / "model_comparison.csv"
        if not csv_path.exists():
            return []
        
        df = pd.read_csv(csv_path)
        rows = []
        for _, r in df.iterrows():
            rows.append({
                "model": r["model"],
                "roc_auc": round(float(r["roc_auc"]), 3),
                "roc_std": round(float(r["roc_std"]), 3),
                "pr_auc": round(float(r["pr_auc"]), 3),
                "pr_std": round(float(r["pr_std"]), 3)
            })
        return rows

    def get_benchmarks(self) -> Dict[str, Any]:
        return {
            "first_eval": {
                "cv_5fold": {
                    "model_pr_auc_folds": [0.898, 0.899, 0.917, 0.962, 0.889],
                    "model_pr_auc_mean": 0.913,
                    "baseline_pr_auc_folds": [0.703, 0.730, 0.789, 0.687, 0.643],
                    "baseline_pr_auc_mean": 0.710,
                    "random_guess": 0.467,
                    "model_better_folds": "5 of 5"
                },
                "thresholds": [
                    {"thr": 0.3, "flagged": 1033, "model_p": 0.691, "model_r": 0.957, "model_f1": 0.803, "base_p": 0.608, "base_r": 0.842, "base_f1": 0.706},
                    {"thr": 0.5, "flagged": 777,  "model_p": 0.825, "model_r": 0.859, "model_f1": 0.842, "base_p": 0.646, "base_r": 0.673, "base_f1": 0.659},
                    {"thr": 0.7, "flagged": 574,  "model_p": 0.894, "model_r": 0.688, "model_f1": 0.777, "base_p": 0.674, "base_r": 0.519, "base_f1": 0.586}
                ]
            },
            "leave_project_out": [
                {
                    "project": "PolyBench",
                    "hard_intervals": 592,
                    "spilled": 245,
                    "model_pr": 0.871,
                    "baseline_pr": 0.784,
                    "model_f1": 0.789,
                    "baseline_f1": 0.735,
                    "random_guess": 0.414,
                    "gain": "+0.087 (+11.1%)"
                },
                {
                    "project": "zlib",
                    "hard_intervals": 299,
                    "spilled": 153,
                    "model_pr": 0.887,
                    "baseline_pr": 0.663,
                    "model_f1": 0.855,
                    "baseline_f1": 0.697,
                    "random_guess": 0.512,
                    "gain": "+0.224 (+33.8%)"
                },
                {
                    "project": "Lua",
                    "hard_intervals": 707,
                    "spilled": 348,
                    "model_pr": 0.781,
                    "baseline_pr": 0.703,
                    "model_f1": 0.715,
                    "baseline_f1": 0.671,
                    "random_guess": 0.492,
                    "gain": "+0.078 (+11.1%)"
                }
            ],
            "end_to_end": {
                "random_guess": 0.052,
                "methods": [
                    {
                        "name": "Gate + Random Forest Model",
                        "mean_pr_auc": 0.719,
                        "folds": [0.743, 0.790, 0.683, 0.675, 0.704],
                        "gain_over_llvm": "+542.0%"
                    },
                    {
                        "name": "Gate + Spill Weight",
                        "mean_pr_auc": 0.564,
                        "folds": [0.590, 0.654, 0.496, 0.472, 0.610],
                        "gain_over_llvm": "+403.6%"
                    },
                    {
                        "name": "LLVM Native Weight (No Gate)",
                        "mean_pr_auc": 0.112,
                        "folds": [0.092, 0.135, 0.054, 0.143, 0.135],
                        "gain_over_llvm": "Baseline"
                    }
                ],
                "eviction_analysis": {
                    "total_evictions": 215,
                    "examined_multiple_times": 215,
                    "median_initial_free_regs": 3,
                    "total_available_regs": 15
                }
            },
            "ablation": {
                "all_intervals": [
                    {"setup": "Baseline (Weight)", "roc_auc": 0.830, "pr_auc": 0.302},
                    {"setup": "Feature Set A (Old)", "roc_auc": 0.957, "pr_auc": 0.788},
                    {"setup": "Feature Set B (All New)", "roc_auc": 0.993, "pr_auc": 0.943},
                    {"setup": "Set B w/o free_frac", "roc_auc": 0.977, "pr_auc": 0.872}
                ],
                "hard_intervals": [
                    {"setup": "Baseline (Weight)", "roc_auc": 0.790, "pr_auc": 0.725},
                    {"setup": "Feature Set A (Old)", "roc_auc": 0.908, "pr_auc": 0.885},
                    {"setup": "Feature Set B (All New)", "roc_auc": 0.955, "pr_auc": 0.944},
                    {"setup": "Set B w/o free_frac", "roc_auc": 0.946, "pr_auc": 0.935}
                ]
            }
        }

    def get_feature_importance(self) -> List[Dict[str, Any]]:
        # From train_v2 and permutation check
        return [
            {"feature": "log_weight", "description": "log10(LLVM calculated spill weight)", "importance": 0.184, "correlation": -0.121, "rank": 1},
            {"feature": "free_frac", "description": "Free registers / total registers ratio", "importance": 0.162, "correlation": -0.389, "rank": 2},
            {"feature": "crosses_mask", "description": "Interferes with call register mask", "importance": 0.098, "correlation": 0.273, "rank": 3},
            {"feature": "log_size", "description": "log10(Live interval span size)", "importance": 0.089, "correlation": 0.251, "rank": 4},
            {"feature": "loop_frac", "description": "Loop references / total operations", "importance": 0.065, "correlation": 0.055, "rank": 5},
            {"feature": "max_depth", "description": "Max loop nesting level of uses/defs", "importance": 0.054, "correlation": 0.050, "rank": 6},
            {"feature": "segments", "description": "Number of live interval segments", "importance": 0.048, "correlation": 0.010, "rank": 7},
            {"feature": "uses", "description": "Total non-debug instruction uses", "importance": 0.039, "correlation": -0.030, "rank": 8},
            {"feature": "defs", "description": "Total non-debug instruction defs", "importance": 0.031, "correlation": -0.030, "rank": 9},
            {"feature": "total_regs", "description": "Hardware registers in register class", "importance": 0.022, "correlation": 0.022, "rank": 10}
        ]

    def get_intervals(
        self,
        page: int = 1,
        limit: int = 25,
        project: Optional[str] = None,
        program: Optional[str] = None,
        reg_class: Optional[str] = None,
        spilled: Optional[int] = None,
        is_hard: Optional[int] = None
    ) -> Dict[str, Any]:
        if self.df_dedup is None:
            return {"total": 0, "intervals": []}
        
        d = self.df_dedup[self.df_dedup.spillable == 1]
        if project:
            d = d[d.project.str.lower() == project.lower()]
        if program:
            d = d[d.program.str.contains(program, case=False, na=False)]
        if reg_class:
            d = d[d.reg_class == reg_class]
        if spilled is not None:
            d = d[d.spilled == spilled]
        if is_hard is not None:
            d = d[d.is_hard == is_hard]

        total = len(d)
        start = (page - 1) * limit
        end = start + limit
        sub = d.iloc[start:end]

        cols = [
            "program", "func", "vreg", "reg_class", "live_size", "weight",
            "uses", "defs", "max_depth", "loop_refs", "free_regs", "total_regs",
            "crosses_mask", "spilled", "visits", "project"
        ]
        items = sub[cols].to_dict(orient="records")
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": int(np.ceil(total / limit)) if limit > 0 else 1,
            "intervals": items
        }

    def get_scatter_sample(self, limit: int = 600) -> List[Dict[str, Any]]:
        if self.df_dedup is None:
            return []
        
        d = self.df_dedup[self.df_dedup.spillable == 1]
        spilled = d[d.spilled == 1]
        unspilled = d[d.spilled == 0]

        # sample balanced to show clear boundary
        n_spill = min(len(spilled), limit // 2)
        n_unspill = min(len(unspilled), limit - n_spill)
        sample = pd.concat([
            spilled.sample(n=n_spill, random_state=42),
            unspilled.sample(n=n_unspill, random_state=42)
        ])

        results = []
        for _, r in sample.iterrows():
            results.append({
                "program": r["program"],
                "func": r["func"],
                "vreg": int(r["vreg"]),
                "reg_class": r["reg_class"],
                "live_size": float(r["live_size"]),
                "log_size": round(float(np.log10(max(1.0, r["live_size"]))), 3),
                "weight": float(r["weight"]),
                "log_weight": round(float(np.log10(max(1e-12, r["weight"]))), 3),
                "free_regs": int(r["free_regs"]),
                "max_depth": int(r["max_depth"]),
                "spilled": int(r["spilled"]),
                "project": r["project"]
            })
        return results

    def get_llvm_patch(self) -> Dict[str, Any]:
        patch_path = PATCHES_DIR / "spill_dump.patch"
        if not patch_path.exists():
            return {"content": "", "sections": []}
        
        with open(patch_path, "r", encoding="utf-8") as f:
            content = f.read()

        sections = [
            {
                "title": "Environment Variable Activation",
                "code": "static bool spillDumpEnabled() {\n  static const bool Enabled = std::getenv(\"SPILL_DUMP\") != nullptr;\n  return Enabled;\n}",
                "explanation": "Safely toggles instrumentation at runtime without needing recompilations when SPILL_DUMP is omitted."
            },
            {
                "title": "Feature Extraction Hook",
                "code": "static void dumpSpillFeatures(...) {\n  // Counts non-debug uses, defs, and maximum loop nesting depth\n  for (const MachineOperand &MO : MRI.reg_nodbg_operands(VirtReg.reg())) {\n    if (MO.isDef()) ++Defs; else ++Uses;\n    unsigned Depth = Loops.getLoopDepth(MO.getParent()->getParent());\n    MaxDepth = std::max(MaxDepth, Depth);\n  }\n}",
                "explanation": "Traverses machine instruction operands to calculate instruction frequency, loop depth, and loop weight factors."
            },
            {
                "title": "Physical Register Interference Check",
                "code": "for (auto PhysReg : Order) {\n  ++TotalRegs;\n  if (Matrix.checkInterference(VirtReg, PhysReg) == LiveRegMatrix::IK_Free)\n    ++FreeRegs;\n}\nint CrossesRegMask = Matrix.checkRegMaskInterference(VirtReg) ? 1 : 0;",
                "explanation": "Queries LLVM's LiveRegMatrix to compute exact available physical hardware registers (IK_Free) in the allocation order."
            },
            {
                "title": "Allocator Decision Hook (selectOrSplitImpl)",
                "code": "MCRegister RAGreedy::selectOrSplitImpl(const LiveInterval &VirtReg, ...) {\n  if (spillDumpEnabled())\n    dumpSpillFeatures(VirtReg, MF, *MRI, *TRI, *Loops, *Matrix, *Order);\n  ...\n}",
                "explanation": "Intercepts the Greedy Register Allocator's primary allocation loop right before eviction or spilling occurs."
            }
        ]
        return {
            "content": content,
            "target_file": "llvm/lib/CodeGen/RegAllocGreedy.cpp",
            "llvm_version": "19.1.7",
            "architecture": "x86-64",
            "sections": sections
        }
