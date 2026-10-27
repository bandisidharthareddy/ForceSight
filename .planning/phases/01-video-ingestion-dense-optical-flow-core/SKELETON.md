# Walking Skeleton — ForceSight

**Phase:** 1
**Generated:** 2026-10-27

## Capability Proven End-to-End

An operator can run an automated script that ingests synthetic/recorded crowd bottleneck video, computes dense optical flow motion fields across consecutive frames, and outputs localized velocity variance and stagnation metrics in real time.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Core Language & Runtime | Python 3.11+ | Standard ecosystem for computer vision, scientific computing, and OpenCV bindings. |
| Computer Vision Engine | OpenCV (`opencv-python` 4.10+) | Optimized C++ implementations for video container decoding, Farnebäck dense optical flow, and image processing. |
| Processing Proxy Resolution | 640x360 Grayscale | Guarantees real-time (>30 FPS) optical flow vector calculation on standard CPU hardware. |
| Motion Representation | Vectorized NumPy (`u, v` fields + polar `mag, ang`) | Provides fast array math and seamless conversion to Phase 2 stress index. |
| Directory Layout | Modular src (`src/config.py`, `src/ingestion/`, `src/vision/`) | Enforces clear separation between video IO, computer vision tracking, and physics simulation. |
| Test Harness | `pytest` | Standard Python unit test framework for fast feedback loops and CI verification. |

## Stack Touched in Phase 1

- [ ] Project scaffold (`requirements.txt`, `pytest.ini`, `src/config.py`)
- [ ] Ingestion stream — `src/ingestion/video_loader.py` with `FrameData` generator
- [ ] Synthetic crowd benchmark generator — `scripts/generate_synthetic_crowd.py`
- [ ] Vision tracking — `src/vision/tracker.py` (`cv2.calcOpticalFlowFarneback`)
- [ ] Motion turbulence extractor — `src/vision/motion_stats.py` (velocity variance & stagnation)
- [ ] Automated test suite — `tests/test_ingestion.py`, `tests/test_flow.py`, `tests/test_synthetic_generator.py`

## Out of Scope (Deferred to Later Slices)

- Peak Stress Index calculation and risk threshold state machine (Phase 2)
- Photoelastic chromatic heatmap overlay generation (Phase 3)
- Streamlit web operator dashboard and UI controls (Phase 4)
- Live RTSP/IP camera streaming (v2.0)

## Subsequent Slice Plan

Each later phase adds one vertical capability on top of this skeleton:
- Phase 2: Digital Photoelastic Simulation & Peak Stress Index (0–100)
- Phase 3: Photoelastic Birefringence Heatmap Overlay (Blue ➔ Yellow ➔ Crimson)
- Phase 4: Marshal Early-Warning Dashboard & Alert System (Streamlit UI)
- Phase 5: Benchmark Evaluation & System Hardening
