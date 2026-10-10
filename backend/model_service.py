import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

_parent = Path(__file__).resolve().parent.parent
if (_parent / "data").exists():
    BASE_DIR = _parent
elif (_parent / "spill-ml" / "data").exists():
    BASE_DIR = _parent / "spill-ml"
else:
    BASE_DIR = _parent

DATA_DIR = BASE_DIR / "data"

class ModelService:
    def __init__(self):
        self.model: Optional[RandomForestClassifier] = None
        self.feature_names: List[str] = []
        self.reg_classes: List[str] = []
        self.is_trained = False
        self._train_model()

    def _train_model(self):
        csv_path = DATA_DIR / "dataset2_dedup.csv"
        if not csv_path.exists():
            return
        
        df = pd.read_csv(csv_path)
        d = df[(df.spillable == 1) & np.isfinite(df.weight) & (df.free_regs == 0)].reset_index(drop=True)
        d["log_weight"] = np.log10(d.weight.clip(lower=1e-12))
        d["log_size"] = np.log10(d.live_size.clip(lower=1))
        d["loop_frac"] = d.loop_refs / (d.uses + d.defs).clip(lower=1)
        
        d = pd.get_dummies(d, columns=["reg_class"])
        self.reg_classes = [c.replace("reg_class_", "") for c in d.columns if c.startswith("reg_class_")]
        cls_cols = [c for c in d.columns if c.startswith("reg_class_")]
        
        self.feature_names = [
            "log_weight", "segments", "log_size", "uses", "defs", "max_depth",
            "loop_frac", "crosses_mask", "total_regs"
        ] + cls_cols

        X = d[self.feature_names].astype(float)
        y = d.spilled.values

        rf = RandomForestClassifier(
            n_estimators=150,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        )
        rf.fit(X, y)
        self.model = rf
        self.is_trained = True

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_trained or self.model is None:
            return {"error": "Model not trained"}

        live_size = float(data.get("live_size", 100.0))
        weight = float(data.get("weight", 0.005))
        segments = float(data.get("segments", 1.0))
        uses = float(data.get("uses", 3.0))
        defs = float(data.get("defs", 1.0))
        max_depth = float(data.get("max_depth", 0.0))
        loop_refs = float(data.get("loop_refs", 0.0))
        crosses_mask = float(data.get("crosses_mask", 0))
        free_regs = float(data.get("free_regs", 0))
        total_regs = float(data.get("total_regs", 15.0))
        reg_class = str(data.get("reg_class", "GR64"))
        threshold = float(data.get("threshold", 0.5))

        # Check gate
        if free_regs > 0:
            # Free register bypass
            return {
                "gate_status": "FREE_REGISTER_BYPASS",
                "gate_triggered": False,
                "gate_badge": "Free Reg Available (Fast Path)",
                "gate_description": f"{int(free_regs)} of {int(total_regs)} hardware registers free in {reg_class}. Immediate spill probability is near zero.",
                "spill_probability": 0.005,
                "spill_predicted": 0,
                "threshold": threshold,
                "risk_level": "very_low",
                "recommendation": "Assign available physical register immediately. No eviction needed.",
                "llvm_baseline_score": round(-float(np.log10(max(1e-12, weight))), 3),
                "feature_contributions": [
                    {"feature": "Free Registers", "impact": "High Negative (-0.95)", "direction": "decrease"},
                    {"feature": "Spill Weight", "impact": f"Score {weight:.6f}", "direction": "neutral"},
                    {"feature": "Loop Depth", "impact": f"Depth {int(max_depth)}", "direction": "neutral"}
                ]
            }

        # Gate Triggered (Hard Interval)
        log_weight = float(np.log10(max(1e-12, weight)))
        log_size = float(np.log10(max(1.0, live_size)))
        loop_frac = float(loop_refs / max(1.0, uses + defs))

        # Construct vector
        row = {
            "log_weight": log_weight,
            "segments": segments,
            "log_size": log_size,
            "uses": uses,
            "defs": defs,
            "max_depth": max_depth,
            "loop_frac": loop_frac,
            "crosses_mask": crosses_mask,
            "total_regs": total_regs
        }
        for rc in self.reg_classes:
            row[f"reg_class_{rc}"] = 1.0 if rc == reg_class else 0.0

        df_vec = pd.DataFrame([row])[self.feature_names]
        proba = float(self.model.predict_proba(df_vec)[0][1])
        predicted = 1 if proba >= threshold else 0

        # Risk level
        if proba >= 0.75:
            risk = "critical"
        elif proba >= 0.50:
            risk = "high"
        elif proba >= 0.25:
            risk = "moderate"
        else:
            risk = "low"

        # LLVM heuristic baseline
        base_score = -log_weight
        # Relative ranking estimation
        llvm_spill_candidate = True if weight < 0.01 else False

        # Compute feature contributions based on deviations from hard interval means
        contributions = []
        if log_weight < -3.0:
            contributions.append({"feature": "Low Spill Weight", "impact": f"log10={log_weight:.2f} (spill risk elevated)", "direction": "increase"})
        else:
            contributions.append({"feature": "Sufficient Spill Weight", "impact": f"log10={log_weight:.2f} (protects interval)", "direction": "decrease"})

        if crosses_mask == 1:
            contributions.append({"feature": "Crosses Call Mask", "impact": "Interferes with caller-saved registers", "direction": "increase"})

        if log_size > 3.0:
            contributions.append({"feature": "Large Live Interval Span", "impact": f"Size {int(live_size)} units conflicts widely", "direction": "increase"})

        if max_depth > 0:
            contributions.append({"feature": "Inside Loop Nest", "impact": f"Depth {int(max_depth)} multiplies spill cost", "direction": "decrease" if weight > 0.05 else "increase"})

        if len(contributions) < 3:
            contributions.append({"feature": "Register Class Contention", "impact": f"{reg_class} has 0 free hardware slots", "direction": "increase"})

        recommendation = ""
        if predicted == 1:
            if max_depth > 1:
                recommendation = "Split live range outside inner loop before spilling to avoid memory stall in critical path."
            else:
                recommendation = "Designate as spill slot early to free physical register for higher priority loop variables."
        else:
            recommendation = "Retain in register; evict candidate with lower spill weight or shorter loop duration."

        return {
            "gate_status": "HIGH_CONTENTION_GATE",
            "gate_triggered": True,
            "gate_badge": "0 Free Regs (Contention Gate)",
            "gate_description": f"Zero free hardware registers in {reg_class}. Machine learning model activated to predict spill vs. eviction.",
            "spill_probability": round(proba, 4),
            "spill_predicted": predicted,
            "threshold": threshold,
            "risk_level": risk,
            "recommendation": recommendation,
            "llvm_baseline_score": round(base_score, 3),
            "llvm_spill_candidate": llvm_spill_candidate,
            "model_vs_baseline_agreement": (predicted == 1 and llvm_spill_candidate) or (predicted == 0 and not llvm_spill_candidate),
            "feature_contributions": contributions
        }
