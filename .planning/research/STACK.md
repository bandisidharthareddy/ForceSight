# Stack Research

**Domain:** Computer Vision Crowd Density & Compressive Force Analytics
**Researched:** October 27, 2026
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Python | 3.11+ | Backend & CV Computation | Standard environment for computer vision, PyTorch, and scientific computing packages. |
| Ultralytics YOLOv8 / YOLO11 | 8.3+ | Human Detection & Head Tracking | Extremely fast inference (real-time on CPU/GPU), reliable pre-trained weights for person/head detection, and built-in tracking (ByteTRACK). |
| OpenCV (opencv-python) | 4.10+ | Video decoding, frame rendering, heatmap generation | High-performance frame processing, perspective transformation (homography for ground plane mapping), and color overlay generation. |
| NumPy & SciPy | 1.26+ / 1.13+ | Spatial Grid & Crowd Physics Engine | Fast vectorized grid density calculations, Gaussian kernel smoothing for density maps, and Helbing crowd pressure formula evaluations. |
| Streamlit | 1.39+ | Operator Dashboard UI | Rapid prototyping of interactive dashboards with built-in metrics, video streaming players, real-time alert banners, and reactive threshold controls. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PyTorch | 2.4+ | Deep Learning backend | Underlying execution engine for YOLO/density estimation models. |
| Plotly / Altair | 5.24+ | Interactive time-series charts | Visualizing real-time force trends (kg over time) and risk timeline on the dashboard. |
| Pydantic | 2.9+ | Data validation & config schemas | Validating grid configurations, camera calibration parameters, and threshold alert limits. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pytest | Unit & regression testing | Test physics calculations, grid mapping, and alert threshold triggers. |
| Ruff | Linting & formatting | Fast Python linter for clean, maintainable code. |

## Installation

```bash
# Core Vision & Physics
pip install opencv-python ultralytics numpy scipy

# Dashboard & Visualization
pip install streamlit plotly pydantic

# Testing & Dev
pip install pytest ruff
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Streamlit | FastAPI + React / WebSockets | Production deployments with multiple concurrent marshals or strict <50ms UI latency requirements. Streamlit is ideal for MVP. |
| YOLOv8/11 (Detection) | CSRNet / DM-Count (Density Map Regression) | Ultra-dense crowds (>10 people/m²) where individual bodies are completely invisible and only fuzzy texture remains. For gates (4-8 p/m²), YOLO tracking is superior. |
| Empirical Helbing Pressure ($P = \rho \cdot \text{Var}(v)$) | Complex Finite Element Biomechanical Simulation (FEM) | Offline forensic accident reconstruction. Unsuitable for real-time live video evaluation. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Pure optical flow without detection (e.g. raw Lucas-Kanade) | Highly sensitive to camera shaking, lighting shifts, and flags/banners; produces massive false positive spikes. | Object detection + spatial tracking combined with grid density. |
| Complex distributed streaming (Kafka/Flink) | Extreme operational overhead for a local benchmark video MVP. | Modular local frame pipeline generator. |
| Client-heavy React SPA for MVP | Slower to develop, adds API/bundling overhead before core vision/physics logic is validated. | Streamlit web application. |

## Stack Patterns by Variant

**If GPU is available (CUDA):**
- Use YOLOv8x/YOLO11x for higher detection precision in dense queues.
- Run batch frame inference with TensorRT.

**If CPU only (Standard Laptop):**
- Use YOLOv8n or YOLO11n (Nano models) with resized input resolution (e.g., 640x360).
- Process every 2nd or 3rd frame to maintain real-time playback rates.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| ultralytics@8.3+ | torch@2.4+ | Fully compatible with PyTorch 2.x and torchvision. |
| streamlit@1.39+ | plotly@5.24+ | Native `st.plotly_chart` support with seamless re-rendering. |

## Sources

- Ultralytics Official Documentation (YOLOv8/YOLO11 benchmarks)
- Helbing, D., et al. (2007). "Dynamics of crowd disasters: An empirical study", *Physical Review E*.
- Still, G. K. (2014). "Introduction to Crowd Science", CRC Press.

---
*Stack research for: ForceSight (Crowd Pressure Analytics)*
*Researched: October 27, 2026*
