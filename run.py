import os
import sys
import subprocess
import argparse
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

def print_banner():
    print(r"""
  ==============================================================
    ____          _  __ __          __  __ _     
   / __/ ___   _ (_)/ // /         /  |/  / |    
  _\ \  / _ \ / // // // / ______ / /|_/ /  /    
 /___/ / .__//_//_//_//_/ /_____//_/  /_/  /___/ 
      /_/                                        
  LLVM 19.1.7 Greedy Register Allocation ML Intelligence Lab
  ==============================================================
    """)

def run_production():
    print_banner()
    print("  [+] Launching Full Stack Application...")
    print("  [*] Frontend & API: http://127.0.0.1:8000")
    print("  [*] Swagger Docs:   http://127.0.0.1:8000/docs")
    print("  --------------------------------------------------------------")
    print("  Press Ctrl+C to terminate the server.\n")

    sys.path.insert(0, str(BACKEND_DIR))
    import uvicorn
    uvicorn.run("app:app", app_dir=str(BACKEND_DIR), host="127.0.0.1", port=8000, reload=False)

def run_dev():
    print_banner()
    print("  [+] Launching Development Environment (Vite + FastAPI Hot-Reload)...")
    print("  [*] React Dev Server: http://localhost:5173")
    print("  [*] FastAPI API:      http://127.0.0.1:8000")
    print("  --------------------------------------------------------------\n")

    import concurrent.futures
    def run_backend():
        sys.path.insert(0, str(BACKEND_DIR))
        import uvicorn
        uvicorn.run("app:app", app_dir=str(BACKEND_DIR), host="127.0.0.1", port=8000, reload=True)

    def run_frontend():
        subprocess.run(["npm", "run", "dev"], cwd=str(FRONTEND_DIR), shell=True)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        executor.submit(run_backend)
        executor.submit(run_frontend)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Spill-ML Application Launcher")
    parser.add_argument("--dev", action="store_true", help="Launch in hot-reload development mode")
    args = parser.parse_args()

    if args.dev:
        run_dev()
    else:
        run_production()
