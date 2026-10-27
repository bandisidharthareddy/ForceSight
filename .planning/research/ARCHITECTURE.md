# Architecture Research

**Domain:** Computer Vision Crowd Density & Compressive Force Analytics
**Researched:** October 27, 2026
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer (Streamlit)            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Video Player │  │ Force Gauge  │  │ Action Advisory  │  │
│  │ with Heatmap │  │ (Safe/Crit)  │  │ (Throttle Gates) │  │
│  └──────▲───────┘  └──────▲───────┘  └────────▲─────────┘  │
│         │                 │                   │             │
├─────────┴─────────────────┴───────────────────┴─────────────┤
│                     Analytics & Physics Layer                │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐   ┌───────────────────────────┐  │
│  │ Mechanical Force      │   │ Alert / Throttle Engine   │  │
│  │ Calculation (kg)      │   │ (Stateful Hysteresis)     │  │
│  └──────────▲────────────┘   └─────────────▲─────────────┘  │
│             │                              │                │
│  ┌──────────┴────────────┐   ┌─────────────┴─────────────┐  │
│  │ Spatial Grid &        │   │ Velocity & Dispersion     │  │
│  │ Density Map Generator │   │ Vector Tracker            │  │
│  └──────────▲────────────┘   └─────────────▲─────────────┘  │
├─────────────┴──────────────────────────────┴────────────────┤
│                    Computer Vision Pipeline                 │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ YOLOv8/11 Inference Engine (Bounding Boxes/Centroids) │  │
│  └──────────────────────────▲────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────┴────────────────────────────┐  │
│  │ Frame Preprocessor & Ground Plane Calibration (Homogr)│  │
│  └──────────────────────────▲────────────────────────────┘  │
├─────────────────────────────┴───────────────────────────────┤
│                        Data Ingestion Layer                 │
│  ┌──────────────────────────┐  ┌─────────────────────────┐  │
│  │ Local Benchmark Video    │  │ Calibration & Config    │  │
│  │ Decoder (OpenCV)         │  │ Store (YAML/JSON)       │  │
│  └──────────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Video Loader & Decoder | Reads local video benchmark clips, handles frame rate throttling, and feeds RGB frames to pipeline. | OpenCV `cv2.VideoCapture` generator with generator/iterator yielding frames. |
| Vision Detector | Detects people/heads in each frame; outputs centroid coordinates and bounding boxes. | Ultralytics YOLOv8/11 Nano or Small model (`ultralytics.YOLO`). |
| Spatial Density Estimator | Discretizes image plane into calibrated spatial grid cells ($1\text{m} \times 1\text{m}$ or normalized pixels) and computes localized density $\rho(x, y)$. | NumPy 2D histogram / Gaussian kernel density filtering (`scipy.ndimage.gaussian_filter`). |
| Motion & Turbulence Estimator | Tracks centroid displacements between consecutive frames to evaluate velocity variance $\text{Var}(v)$. | Frame-to-frame centroid distance delta and vector variance calculation. |
| Crowd Physics / Force Engine | Evaluates empirical Helbing crowd pressure and cumulative compressive force $F_{\text{comp}}$ in kilograms ($kg$). | Vectorized mathematical formula implementation applying body mass ($m \approx 75\text{ kg}$) and velocity turbulence factors. |
| Alert & Decision Manager | Applies thresholding (Safe: <150kg, Warning: 150-250kg, Critical: >250kg) with hysteresis to avoid flickering. | Python state machine with cooldown timer and severity classifications. |
| Dashboard UI | Renders live video with blended thermal heatmap, metrics cards, gauges, and operator alert banner. | Streamlit application with custom CSS styling and real-time refresh loop. |

## Recommended Project Structure

```
forcesight/
├── src/
│   ├── config.py             # System thresholds, grid size, camera calibration models (Pydantic)
│   ├── ingestion/
│   │   ├── __init__.py
│   │   └── video_loader.py   # OpenCV video file stream generator & frame extraction
│   ├── vision/
│   │   ├── __init__.py
│   │   ├── detector.py       # YOLOv8/11 model wrapper for head/person detection
│   │   └── tracking.py       # Centroid tracking & velocity vector calculation
│   ├── physics/
│   │   ├── __init__.py
│   │   ├── grid.py           # Spatial discretization & density mapping (persons/m²)
│   │   └── force_model.py    # Compressive crowd force (kg) & Helbing pressure formulas
│   ├── alerts/
│   │   ├── __init__.py
│   │   └── alert_engine.py   # Threshold state machine (Safe, Warning, Critical) & advisories
│   └── ui/
│       ├── __init__.py
│       ├── app.py            # Streamlit main dashboard entrypoint
│       ├── heatmap.py        # Thermal color mapping & frame alpha-blending
│       └── components.py     # Gauges, metric cards, and alert banner widgets
├── tests/
│   ├── test_physics.py       # Unit tests for force calculations and density mapping
│   ├── test_detector.py      # Vision inference sanity tests
│   └── test_alerts.py        # Hysteresis and threshold triggering tests
├── data/
│   └── sample_videos/        # Benchmark crowd video clips for testing
├── requirements.txt          # Python dependencies
└── README.md
```

### Structure Rationale

- **`vision/` vs `physics/` separation:** Decouples computer vision detection logic from the mathematical crowd dynamics engine. This allows upgrading YOLO models without breaking physics equations, and vice-versa.
- **`alerts/` isolation:** Keeps alert threshold rules, debounce/hysteresis timers, and security marshal guidelines testable without loading heavy PyTorch models.
- **`ui/` separation:** Enables running the core pipeline either headlessly (for batch benchmarking and evaluation tests) or via the interactive Streamlit UI.

## Architectural Patterns

### Pattern 1: Frame-by-Frame Streaming Pipeline (Generator Pattern)

**What:** Ingest frames sequentially through a generator, passing a `FrameData` data container through Detection -> Physics -> Visualization.
**When to use:** Local video playback where keeping entire video in memory is impossible.
**Trade-offs:** Low memory footprint, predictable throughput; requires synchronous processing unless threaded.

```python
@dataclass
class FrameAnalysis:
    frame_idx: int
    raw_frame: np.ndarray
    detections: list[BoundingBox]
    density_grid: np.ndarray        # persons / m^2
    force_grid: np.ndarray          # kg per cell
    peak_force_kg: float
    status: RiskLevel               # SAFE | WARNING | CRITICAL
    alert_message: str
```

### Pattern 2: Hysteresis Debouncing for Alerts

**What:** Require critical force threshold (>250kg) to be maintained for at least $N$ consecutive frames (or 1.5 seconds) before firing red alert, and require force to drop below 200kg before clearing.
**When to use:** In any physical safety alert system driven by computer vision.
**Trade-offs:** Prevents frantic flickering and operator alert fatigue from single-frame detection noise; introduces a minor (1-2s) deliberate trigger lag.

## Data Flow

```
[Local Video File (.mp4)]
           │
           ▼
   [video_loader.py] ─── (RGB Frame) ──────────────────────────┐
           │                                                   │
           ▼                                                   │
     [detector.py] ─── (Centroids & Boxes) ──────┐             │
           │                                     │             │
           ▼                                     ▼             │
     [tracking.py] ─── (Velocity Vectors) ──> [grid.py]        │
                                                 │             │
                                                 ▼             │
                                         [force_model.py]      │
                                                 │             │
                            ┌────────────────────┴──────────┐  │
                            ▼                               ▼  │
                    [alert_engine.py]                 [heatmap.py]
                            │                               │
                            ▼                               ▼
                 [Alert State & Banner]         [Blended Overlay Frame]
                            │                               │
                            └───────────────┬───────────────┘
                                            ▼
                                   [Streamlit Dashboard]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single Video File (MVP) | In-process synchronous pipeline running on local CPU/GPU with Streamlit. |
| Multi-Camera Chokepoint (v2) | Decouple inference workers via Redis/ZeroMQ; FastAPI WebSocket server feeding React web clients. |
| High-Resolution 4K CCTV (v2+) | Downscale frames to 720p for YOLO inference, map bounding boxes back to full scale for visualization. |

---
*Architecture research for: ForceSight (Crowd Pressure Analytics)*
*Researched: October 27, 2026*
