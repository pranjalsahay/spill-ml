# Spill-ML Web Frontend

The interactive compiler intelligence web interface for **Spill-ML: Machine Learning Guided Spill Prediction for LLVM Register Allocation**.

---

## 🎨 Tech Stack & Architecture

- **React 19**: Modern component architecture with functional hooks.
- **Vite 8**: Ultra-fast build tool and development server with Hot Module Replacement (HMR).
- **Tailwind CSS 3.4**: Custom dark compiler theme, subtle engineering grids (`.compiler-grid`), and glowing status accents.
- **Framer Motion 14**: Spring physics sliders, gliding navigation capsule (`layoutId="active-nav-pill"`), and animated page transitions.
- **Lenis 1.3**: Smooth inertia scrolling with exponential deceleration curves.
- **Recharts 3.10**: Interactive data visualizations (hardware distribution, 5-fold CV comparisons, feature space scatter charts).
- **Lucide React**: Clean icons.

---

## 🚀 Running the Frontend

### Standalone Development Mode:
```bash
npm install
npm run dev
```
Runs at [http://localhost:5173](http://localhost:5173), proxying API requests to FastAPI at `http://127.0.0.1:8000`.

### Production Build:
```bash
npm run build
```
Builds the optimized production bundle into `dist/`.

---

## 🧩 Component Breakdown

- **`src/components/Navbar.jsx`**: Floating glassmorphic header with gliding Framer Motion active pill, live API status indicator, and `⌘K` command palette trigger.
- **`src/components/CommandPalette.jsx`**: Global keyboard spotlight search (`Ctrl+K` / `⌘K`) to jump across tabs and load presets.
- **`src/components/PipelineOverview.jsx`**: Executive discovery metrics, interactive 5-stage compiler pipeline, and register class contention charts.
- **`src/components/LivePredictor.jsx`**: Interactive compiler sandbox with feature sliders, classification threshold, probability gauge, and compiler advice.
- **`src/components/PhysicalRegisterBoard.jsx`**: x86-64 hardware matrix visualizing all 16 physical CPU registers (`RAX`-`R15`) and stack memory spill slots (`[RSP + 0x18]`).
- **`src/components/BenchmarkHub.jsx`**: Model leaderboard (RF, GradBoost, DT, LogReg, Baseline), 5-fold grouped CV comparison, and leave-one-project-out generalization cards.
- **`src/components/DatasetExplorer.jsx`**: Filterable, searchable datatable of all 24,068 recorded intervals with log(weight) vs log(size) scatter plots.
- **`src/components/PatchInspector.jsx`**: Syntax-highlighted diff viewer for the LLVM `RegAllocGreedy.cpp` patch with annotations.
- **`src/context/ToastContext.jsx`**: Animated toast notifications on user interactions.
- **`src/utils/scroll.js`**: Lenis smooth inertia scrolling handler.
