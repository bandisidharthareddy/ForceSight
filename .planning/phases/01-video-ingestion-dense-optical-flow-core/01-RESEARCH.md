# Phase 1: Video Ingestion & Dense Optical Flow Core - Research

**Researched:** October 27, 2026
**Domain:** Computer Vision Video Ingestion & Dense Optical Flow Motion Tracking
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use `cv2.calcOpticalFlowFarneback` with tunable pyramid scale, levels, and window size (`winSize=15` or `21`) as the standard, robust algorithm for dense velocity field estimation.
- **D-02:** Compute optical flow between every consecutive frame ($t$ and $t+1$), applying a light Gaussian pre-blur (`cv2.GaussianBlur` $3\times3$ or $5\times5$) to suppress camera sensor noise.
- **D-03:** Dual-pipeline execution: high-resolution RGB frames are maintained for visual dashboard rendering, while a downsampled 640x360 grayscale proxy is fed into the Farnebäck optical flow calculation to maintain real-time throughput (>30 FPS on CPU).
- **D-04:** Resulting optical flow fields and stress surfaces are upscaled back to original frame dimensions during display overlay generation.
- **D-05:** Provide bundled sample benchmark crowd video(s) in `data/benchmarks/` alongside a synthetic crowd motion video generator (`scripts/generate_synthetic_crowd.py`) to enable zero-dependency unit tests and offline evaluation.
- **D-06:** Implement a stateful video stream generator (`src/ingestion/video_loader.py`) yielding structured `FrameData` objects (containing raw RGB frame, grayscale proxy, frame index, timestamp, playback status, and loop capabilities).
- **D-07:** Employ a dual spatial representation: continuous pixel-level flow field for smooth heatmap rendering + spatial grid-cell aggregation (e.g. 20x20px blocks) for statistical variance and turbulence analysis.
- **D-08:** Extract two complementary physical indicators from the flow field:
  1. *Velocity Variance*: Angular and speed variance representing chaotic non-laminar movement.
  2. *Stagnation Divergence*: Abrupt deceleration when high incoming crowd velocity collides with a zero-velocity boundary (e.g. gate/barrier).

### the agent's Discretion
- Choice of synthetic particle motion physics in `scripts/generate_synthetic_crowd.py`.
- Exact Farnebäck parameter tuning: `pyr_scale=0.5, levels=3, winsize=15, iterations=3, poly_n=5, poly_sigma=1.2, flags=0`.
- Directory structure and test harness layout.

### Deferred Ideas (OUT OF SCOPE)
- Live RTSP/IP camera streaming (v2.0).
- Interactive polygonal chokepoint ROI selector on video canvas (Phase 4 / v2.0).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Video file loading & frame extraction | Ingestion Tier (`src/ingestion/`) | — | Decouples video container decoding, frame seeking, and looping from CV algorithms |
| Farnebäck optical flow & vector tracking | Vision Core Tier (`src/vision/`) | — | Pure compute module transforming consecutive frame pairs into dense $(H, W, 2)$ velocity arrays |
| Motion turbulence & stagnation extraction | Analytics Tier (`src/vision/motion_stats.py`) | Physics Tier | Statistical variance and deceleration divergence calculation bridging vision to Phase 2 stress index |
| Synthetic crowd video generation | Tooling / Script (`scripts/`) | Tests | Zero-dependency benchmark generator creating standardized test videos for regression testing |

</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 establishes the real-time visual perception and motion tracking backbone for ForceSight. Dense optical flow using the Farnebäck method (`cv2.calcOpticalFlowFarneback`) provides an exhaustive displacement vector $(u, v)$ for every pixel on the downscaled 640x360 proxy frame. 

By applying Gaussian smoothing prior to flow estimation, sensor noise and video compression artifacts are eliminated. The resulting flow vectors are converted into polar coordinates $(r, \theta)$ to extract directional velocity and magnitude. Spatial grid pooling (20x20 pixel blocks) aggregates local movement into neighborhood velocity variance ($\text{Var}(v)$) and stagnation divergence, precisely matching the inputs required by Helbing's crowd turbulence formulation.

A synthetic crowd video generator (`scripts/generate_synthetic_crowd.py`) creates realistic converging particle flows toward a central bottleneck, providing deterministic ground-truth video for automated unit and integration tests without external dataset downloads.

**Primary recommendation:** Implement a clean generator-based `VideoLoader` streaming `FrameData` into an optimized `OpticalFlowTracker` that emits both pixel-dense $(H, W, 2)$ velocity arrays and aggregated grid turbulence statistics.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python | 3.11+ | Runtime environment | Standard for modern scientific computing and computer vision |
| opencv-python | 4.10+ | Video decoding & Farnebäck optical flow | High-performance C++ implementation with Python bindings; `cv2.calcOpticalFlowFarneback` and `cv2.cartToPolar` are optimized |
| numpy | 1.26+ | Dense vector operations & grid aggregation | Vectorized operations over flow fields and velocity variance |
| pydantic | 2.9+ | Data schemas & configuration | Type-safe configuration models for optical flow parameters and video metadata |

### Supporting & Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest | 8.0+ | Automated test suite | Running unit and regression tests on video loaders and flow calculators |

**Installation:**
```bash
pip install opencv-python numpy pydantic pytest
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Component Architecture

```
[Local Benchmark Video (.mp4)]
            │
            ▼
┌───────────────────────────────┐
│     src/ingestion/loader.py   │  ── yields FrameData
│    (cv2.VideoCapture Stream)  │     (RGB Full-Res + Grayscale 640x360 Proxy)
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│     src/vision/tracker.py     │  ── cv2.calcOpticalFlowFarneback
│   (Dense Optical Flow Engine) │     Input: Prev Gray & Curr Gray Proxy
└───────────────┬───────────────┘
                │
                ├─────────────────────────────────────────┐
                ▼                                         ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│  Continuous Flow Field        │       │  src/vision/turbulence.py     │
│  (u, v) & (mag, ang)          │       │  (Grid-Cell Pooling 20x20px)  │
│  For Phase 3 Heatmap Overlay  │       │  Var(v) & Stagnation Diverg.  │
└───────────────────────────────┘       └───────────────────────────────┘
```

### Data Container Pattern

```python
@dataclass
class FrameData:
    frame_idx: int
    timestamp_ms: float
    rgb_frame: np.ndarray        # Original full-res frame for visual rendering
    gray_proxy: np.ndarray       # Downsampled 640x360 frame for optical flow
    fps: float
    total_frames: int
    is_last_frame: bool

@dataclass
class FlowResult:
    frame_idx: int
    flow_vectors: np.ndarray     # (360, 640, 2) dense (u, v) array
    magnitude: np.ndarray        # (360, 640) displacement magnitude
    angle: np.ndarray            # (360, 640) directional angle (0 to 2*pi)
    grid_variance: np.ndarray    # (18, 32) velocity variance per 20x20 block
    stagnation_score: float      # Normalized stagnation indicator (0 to 1)
```

</architecture_patterns>

## Validation Architecture

### Test Infrastructure

- **Framework**: `pytest`
- **Config**: `pytest.ini`
- **Quick run command**: `pytest tests/test_ingestion.py tests/test_flow.py -q`
- **Full suite command**: `pytest tests/ -q`
- **Estimated runtime**: ~3 seconds

### Automated Verification Coverage

1. `tests/test_ingestion.py`:
   - Validates that `VideoLoader` initializes and successfully reads video frames.
   - Verifies seeking, looping, and correct downscaled proxy generation (640x360).
   - Verifies handling of non-existent video files with descriptive exceptions.

2. `tests/test_flow.py`:
   - Validates that `OpticalFlowTracker` accepts consecutive frames and outputs $(H, W, 2)$ vectors.
   - Verifies that zero-movement frames yield zero flow magnitude.
   - Verifies that synthetic rightward motion produces positive $u$ vectors.
   - Verifies that `TurbulenceExtractor` detects high velocity variance in turbulent motion vs zero in laminar flow.

3. `tests/test_synthetic_generator.py`:
   - Validates that `scripts/generate_synthetic_crowd.py` produces a valid playable `.mp4` file of configurable length and FPS.

---
*Phase 1 Research completed: October 27, 2026*
