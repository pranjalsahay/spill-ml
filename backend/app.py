from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from data_service import DataService
from model_service import ModelService

app = FastAPI(
    title="Spill-ML API",
    description="LLVM 19.1.7 Greedy Register Allocation ML Prediction & Analytics Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_service = DataService()
model_service = ModelService()

class PredictRequest(BaseModel):
    live_size: float = Field(default=500.0, description="Live interval span size")
    weight: float = Field(default=0.0035, description="LLVM spill weight")
    segments: float = Field(default=1.0, description="Number of interval segments")
    uses: float = Field(default=3.0, description="Number of non-debug register uses")
    defs: float = Field(default=1.0, description="Number of register defs")
    max_depth: float = Field(default=1.0, description="Maximum loop depth")
    loop_refs: float = Field(default=1.0, description="References inside loops")
    crosses_mask: float = Field(default=1.0, description="Crosses call register mask (1=yes, 0=no)")
    free_regs: float = Field(default=0.0, description="Available hardware registers in class")
    total_regs: float = Field(default=15.0, description="Total physical registers in class")
    reg_class: str = Field(default="GR64", description="Register class name")
    threshold: float = Field(default=0.5, description="Classification probability threshold")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "data_loaded": data_service.df_dedup is not None,
        "model_trained": model_service.is_trained
    }

@app.get("/api/overview")
def get_overview():
    return data_service.get_overview()

@app.get("/api/models")
def get_models():
    return data_service.get_model_comparison()

@app.get("/api/benchmarks")
def get_benchmarks():
    return data_service.get_benchmarks()

@app.get("/api/feature-importance")
def get_feature_importance():
    return data_service.get_feature_importance()

@app.get("/api/intervals")
def get_intervals(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    project: Optional[str] = None,
    program: Optional[str] = None,
    reg_class: Optional[str] = None,
    spilled: Optional[int] = None,
    is_hard: Optional[int] = None
):
    return data_service.get_intervals(
        page=page,
        limit=limit,
        project=project,
        program=program,
        reg_class=reg_class,
        spilled=spilled,
        is_hard=is_hard
    )

@app.get("/api/scatter-sample")
def get_scatter_sample(limit: int = Query(default=500, ge=50, le=1000)):
    return data_service.get_scatter_sample(limit=limit)

@app.get("/api/llvm-patch")
def get_llvm_patch():
    return data_service.get_llvm_patch()

@app.post("/api/predict")
def predict_spill(req: PredictRequest):
    return model_service.predict(req.model_dump())

# Serve static frontend build if dist exists
from pathlib import Path
from fastapi.staticfiles import StaticFiles

DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
