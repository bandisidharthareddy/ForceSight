# Phase 1: Video Ingestion & Dense Optical Flow Core - Context

**Gathered:** October 27, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the foundational video ingestion and computer vision motion tracking pipeline for ForceSight. It accepts local crowd benchmark video files (.mp4/.avi) and extracts dense OpenCV optical flow fields ($u, v$) and velocity variance metrics across consecutive frames to power the downstream Digital Photoelastic stress simulation.

</domain>

<decisions>
## Implementation Decisions

### Optical Flow Algorithm
- **D-01:** Use `cv2.calcOpticalFlowFarneback` with tunable pyramid scale, levels, and window size (`winSize=15` or `21`) as the standard, robust algorithm for dense velocity field estimation. — **Reversibility:** reversible
- **D-02:** Compute optical flow between every consecutive frame ($t$ and $t+1$), applying a light Gaussian pre-blur (`cv2.GaussianBlur` $3\times3$ or $5\times5$) to suppress high-frequency camera sensor noise. — **Reversibility:** reversible

### Frame Resolution & Pipeline Synchronization
- **D-03:** Dual-pipeline execution: high-resolution RGB frames are maintained for visual dashboard rendering, while a downsampled 640x360 grayscale proxy is fed into the Farnebäck optical flow calculation to maintain real-time throughput (>30 FPS on CPU). — **Reversibility:** costly — affects coordinate scaling in downstream heatmap overlays
- **D-04:** Resulting optical flow fields and stress surfaces are upscaled back to original frame dimensions during display overlay generation. — **Reversibility:** reversible

### Benchmark Assets & Ingestion Architecture
- **D-05:** Provide bundled sample benchmark crowd video(s) in `data/benchmarks/` alongside a synthetic crowd motion video generator (`scripts/generate_synthetic_crowd.py`) to enable zero-dependency unit tests and offline evaluation. — **Reversibility:** reversible
- **D-06:** Implement a stateful video stream generator (`src/ingestion/video_loader.py`) yielding structured `FrameData` objects (containing raw RGB frame, grayscale proxy, frame index, timestamp, playback status, and loop capabilities). — **Reversibility:** costly — standard container consumed by all downstream modules

### Motion Turbulence & Stagnation Modeling
- **D-07:** Employ a dual spatial representation: continuous pixel-level flow field for smooth heatmap rendering + spatial grid-cell aggregation (e.g. 20x20px blocks) for statistical variance and turbulence analysis. — **Reversibility:** reversible
- **D-08:** Extract two complementary physical indicators from the flow field:
  1. *Velocity Variance*: Angular and speed variance representing chaotic non-laminar movement.
  2. *Stagnation Divergence*: Abrupt deceleration when high incoming crowd velocity collides with a zero-velocity boundary (e.g. gate/barrier). — **Reversibility:** costly — core input to Phase 2 Peak Stress Index

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Vision
- `.planning/PROJECT.md` — Project context, core value, and Digital Photoelastic Simulation paradigm
- `.planning/REQUIREMENTS.md` — Scope requirements INGEST-01, INGEST-02, FLOW-01, FLOW-02, FLOW-03
- `.planning/research/STACK.md` — OpenCV, NumPy, and Python architecture recommendations

### Physics & Motion Foundations
- `.planning/research/SUMMARY.md` — Helbing crowd turbulence formula and gas-kinetic pressure analogies ($P = \rho \cdot \text{Var}(v)$)
- `IDEA.md` — User persona and bottleneck crowd crush problem space

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield workspace: directory structure `src/ingestion/` and `src/vision/` to be established according to architectural research.

### Established Patterns
- Python generator pattern for video frame streaming (`FrameData` container).
- Vectorized NumPy calculations for grid aggregation and Farnebäck polar vector transformations (`cv2.cartToPolar`).

</code_context>

<specifics>
## Specific Ideas

- The video loader must support seamless looping when running benchmark demonstrations.
- A synthetic crowd video generator should produce moving geometric dots/particles undergoing bottleneck compression so developers can verify optical flow and stagnation metrics without needing external gigabyte-sized CCTV downloads immediately.

</specifics>

<deferred>
## Deferred Ideas

- Live RTSP/IP camera streaming — deferred to v2.0.
- Interactive polygonal chokepoint ROI selector on video canvas — deferred to Phase 4 / v2.0.

</deferred>

---

*Phase: 01-video-ingestion-dense-optical-flow-core*
