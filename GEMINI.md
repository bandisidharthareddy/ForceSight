<!-- GSD:project-start source:PROJECT.md -->

## Project

**ForceSight**

ForceSight is a proactive computer vision and predictive crowd stress simulation system engineered to eliminate crowd surges, stampedes, and crushing incidents at structural bottlenecks (gates, barricades, turnstiles, and narrow passageways). It pioneers a **Digital Photoelastic Simulation**—using OpenCV optical flow and crowd density analytics to mimic how physical stress alters chromatic fringes in photoelastic materials under polarized light. The crowd video actively shifts colors (blue ➔ yellow ➔ deep red) in high-stress zones, quantifying localized crush risk through a standardized **Peak Stress Index (0 to 100)** so security marshals have an indisputable, glanceable early-warning dashboard to throttle ingress before dangerous thresholds are reached.

**Core Value:** Making invisible crowd stress visible in real time through a Digital Photoelastic Heatmap and Peak Stress Index (0–100), giving security marshals indisputable, early-warning visual justification to throttle or divert crowds before dangerous physical crushes develop.

### Constraints

- **Input Modality**: Local pre-recorded benchmark video files (.mp4/.avi)
- **Modeling**: OpenCV Farnebäck / Lucas-Kanade optical flow + spatial density mapping feeding the 0–100 Peak Stress Index
- **Visuals**: Continuous photoelastic chromatic gradient (blue ➔ yellow ➔ deep red) blended onto video frames (no crude bounding boxes)
- **Interface**: Web dashboard (Streamlit) for real-time visualization

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

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

# Core Vision & Physics

# Dashboard & Visualization

# Testing & Dev

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

- Use YOLOv8x/YOLO11x for higher detection precision in dense queues.
- Run batch frame inference with TensorRT.
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

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
