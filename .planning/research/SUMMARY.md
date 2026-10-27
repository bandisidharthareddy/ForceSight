# Project Research Summary

**Project:** ForceSight
**Domain:** Computer Vision Crowd Density & Compressive Force Analytics
**Researched:** October 27, 2026
**Confidence:** HIGH

## Executive Summary

ForceSight addresses the "invisible danger" phenomenon at crowd bottlenecks, where compressive mechanical force accumulates silently across human bodies, reaching fatal asphyxiation thresholds (250–400 kg) before external security personnel notice distress. 

Industry research and crowd safety literature (notably Dirk Helbing’s Social Force and crowd turbulence formulations) establish that crowd crush is not simply a function of headcount, but a product of localized physical density ($\rho > 4\text{–}6\text{ persons/m}^2$) and velocity variance ($\text{Var}(v)$), which produce mechanical shockwaves.

The recommended architectural approach for this Software MVP combines:
1. **Ultralytics YOLOv8/11** for robust, real-time head/upper-body detection in packed bottlenecks.
2. **A spatial grid and ground-plane calibration engine** that corrects for perspective distortion.
3. **An empirical crowd dynamics force model** calculating localized compressive load in kilograms ($kg$) based on Helbing’s pressure equations.
4. **An interactive Streamlit operator dashboard** rendering real-time, alpha-blended thermal force heatmaps, glanceable risk gauges (Safe, Warning, Critical), and actionable gate throttle advisories.

The primary technical risks involve perspective distortion, occlusion in ultra-dense packs, and alert flickering. These are mitigated via homography calibration, upper-body focus, and temporal hysteresis smoothing.

## Key Findings

### Recommended Stack

- **Computer Vision & Inference**: Python 3.11+, Ultralytics YOLOv8/11, OpenCV (`cv2`).
- **Physics & Grid Engine**: NumPy, SciPy (Gaussian spatial filtering and vectorized pressure formulas).
- **Dashboard & Alert UI**: Streamlit with Plotly charts and custom responsive CSS status widgets.
- **Data Validation & Schemas**: Pydantic for camera calibration and safety threshold profiles.

### Expected Features

**Must have (table stakes):**
- Local benchmark video ingestion and playback controls (.mp4/.avi).
- Real-time head/person detection and crowd headcount.
- Spatial grid density calculation ($\text{persons/m}^2$).
- Mechanical compressive force estimation in kilograms ($kg$).
- Color-coded thermal force heatmap overlay on video frames.
- Glanceable risk status gauge (Safe <150kg, Warning 150-250kg, Critical >250kg).
- Prominent visual alert banners with concrete gate throttle advisories.

**Should have (competitive differentiators):**
- Dynamic chokepoint ROI polygon selection.
- Temporal force surge trend line graphs ($kg$ over time) with rate-of-climb indicators.
- Audio tone alerts for critical threshold violations.

**Defer (v2+):**
- Live multi-camera RTSP/IP streaming.
- Hardware automated turnstile/barrier interlocking (always maintain human in the loop).
- Mobile push notifications for patrolling marshals.

### Architecture Approach

A modular 4-tier pipeline:
1. **Video Ingestion Layer**: OpenCV frame decoder feeding video frames sequentially.
2. **Vision Detection Layer**: YOLOv8/11 inference extracting head/body bounding boxes and centroids.
3. **Spatial & Physics Engine**: Discretizes frames into ground-calibrated cells, computes density $\rho$ and velocity variance $\text{Var}(v)$, and translates to compressive force ($kg$).
4. **Alert & UI Presentation Layer**: Streamlit dashboard with alpha-blended heatmap overlays, stateful hysteresis alert logic, and throttle guidance.

### Critical Pitfalls

1. **Perspective Distortion**: Front pixels appearing denser than distant corridor surges. *Mitigation:* Ground-plane homography / depth-scaled grid weighting.
2. **Severe Occlusion in High Density**: Full-body detectors losing accuracy when only heads are visible. *Mitigation:* Head/upper-body focus and point centroids.
3. **Alert Flickering**: Rapid toggling between Safe and Critical due to single-frame noise. *Mitigation:* Rolling temporal average (15–30 frames) with hysteresis thresholds.
4. **Misleading Metrics**: Presenting uninterpretable physics units instead of glanceable safety indices. *Mitigation:* Standardized $kg$ force metric with intuitive green/yellow/red bands.

## Implications for Roadmap

Suggested phase structure for ForceSight MVP:

### Phase 1: Video Ingestion & Vision Detection Pipeline
**Rationale:** Core computer vision detection must reliably detect crowd individuals in benchmark video clips before any physics calculations can occur.
**Delivers:** Video decoding engine, YOLOv8/11 head/person detection pipeline, bounding box/centroid extraction, and FPS performance benchmarks.
**Addresses:** Video file ingestion, real-time head/person detection.
**Avoids:** Occlusion failures by establishing head-centric detection.

### Phase 2: Spatial Discretization & Ground Calibration
**Rationale:** Translating 2D image coordinates into realistic physical spatial densities ($\text{persons/m}^2$) requires calibrated spatial grid mapping.
**Delivers:** Spatial grid generator, ground plane perspective calibration (homography/depth scaling), and local density map computation.
**Addresses:** Crowd density calculation ($\text{p/m}^2$).
**Avoids:** Perspective distortion pitfalls.

### Phase 3: Crowd Physics & Compressive Force Engine
**Rationale:** The foundational innovation of ForceSight is mapping density and velocity variance to mechanical compressive force ($kg$).
**Delivers:** Helbing crowd pressure formula implementation, static and dynamic mass load accumulation, temporal EMA smoothing, and risk threshold state machine (Safe, Warning, Critical).
**Addresses:** Mechanical force estimation ($kg$), hysteresis debounced risk states.
**Avoids:** Alert flickering and unphysical force numbers.

### Phase 4: Dynamic Heatmap Overlay & Visualizer
**Rationale:** Marshals need immediate visual comprehension of where pressure is building up on the physical ground.
**Delivers:** Thermal color spectrum generator, alpha-blended transparent heatmap overlay on video frames, and ROI chokepoint highlighting.
**Addresses:** Compressive force heatmap overlay.
**Avoids:** Obscuring underlying video details with opaque overlays.

### Phase 5: Marshal Early-Warning Dashboard & Alert System
**Rationale:** Assemble all components into an intuitive, glanceable operational tool designed specifically for security marshals like Karthik.
**Delivers:** Streamlit web dashboard, real-time video stream player, risk gauge widgets, force trend line chart, audio/visual throttle alert banners, and threshold controls.
**Addresses:** Glanceable safety status gauges, visual alert banners, gate-throttle advisories.
**Avoids:** Operator alarm fatigue through clear, actionable recommendations.

### Phase 6: End-to-End Validation & Benchmark Evaluation
**Rationale:** Verify that ForceSight accurately detects surges and fires alerts on known crowd crush benchmark video scenarios.
**Delivers:** Benchmark evaluation test suite, synthetic surge injection tests, false-positive rate assessment, and comprehensive demonstration documentation.
**Addresses:** System reliability, performance verification.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Python, YOLOv8/11, OpenCV, NumPy, and Streamlit are mature, well-documented, and battle-tested. |
| Features | HIGH | Clear scope boundaries between MVP requirements and deferred enterprise/hardware capabilities. |
| Architecture | HIGH | Clean pipeline separation between vision, physics, alert logic, and UI. |
| Pitfalls | HIGH | Grounded in published crowd dynamics literature (Helbing, Still) and computer vision calibration practices. |

**Overall confidence:** HIGH

---
*Research completed: October 27, 2026*
*Ready for roadmap: yes*
