# Roadmap: ForceSight

## Overview

ForceSight makes invisible crowd pressure visible through Digital Photoelastic Simulation. The system moves from local video ingestion and dense optical flow tracking (Phase 1), to mathematical formulation of the Peak Stress Index (Phase 2), chromatic photoelastic fringe overlay generation (Phase 3), security marshal early-warning dashboard assembly (Phase 4), and end-to-end benchmark evaluation (Phase 5).

## Phases

- [x] **Phase 1: Video Ingestion & Dense Optical Flow Core** - Ingest crowd footage and compute OpenCV dense optical flow fields and motion vectors.
- [ ] **Phase 2: Digital Photoelastic Simulation & Peak Stress Index (PSI)** - Formulate the 0–100 Peak Stress Index from density and optical flow turbulence.
- [ ] **Phase 3: Photoelastic Birefringence Heatmap Overlay** - Render dynamic chromatic stress fringes (blue ➔ yellow ➔ crimson) directly onto crowd video frames.
- [ ] **Phase 4: Marshal Early-Warning Dashboard & Alert System** - Streamlit operator interface with live video, PSI gauge, rolling charts, and gate throttle advisories.
- [ ] **Phase 5: Benchmark Evaluation & System Hardening** - Comprehensive test suite and validation against real-world bottleneck crowd scenarios.

## Phase Details

### Phase 1: Video Ingestion & Dense Optical Flow Core
**Goal**: Ingest benchmark crowd video and compute continuous OpenCV dense optical flow fields and motion vectors.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: INGEST-01, INGEST-02, FLOW-01, FLOW-02, FLOW-03
**UI hint**: no
**Success Criteria** (what must be TRUE):
  1. System loads and decodes local crowd video benchmark files (.mp4/.avi) frame-by-frame with play/pause/loop controls.
  2. OpenCV dense optical flow (Farnebäck) computes motion vectors and displacement magnitudes across consecutive frames.
  3. Spatial grid occupancy detects crowd density and identifies localized stagnation or turbulence zones.
**Plans**: 2 plans

Plans:
- [x] 01-01: Video ingestion loader and synthetic crowd benchmark generator
- [x] 01-02: Farnebäck dense optical flow tracking and velocity turbulence extraction

### Phase 2: Digital Photoelastic Simulation & Peak Stress Index (PSI)
**Goal**: Formulate and implement the Digital Photoelastic stress engine, coupling density with velocity turbulence to generate the 0–100 Peak Stress Index.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: SIM-01, SIM-02, SIM-03
**UI hint**: no
**Success Criteria** (what must be TRUE):
  1. System computes the normalized Peak Stress Index (0 to 100) combining localized density with optical flow velocity variance.
  2. Temporal exponential moving average (EMA) smoothing stabilizes the index against single-frame transient noise.
  3. Risk classification engine categorizes stress into Nominal (0–49), Warning (50–74), and Critical (75–100) operating regimes.
**Plans**: TBD

Plans:
- [ ] 02-01: Peak Stress Index mathematical engine and density-velocity coupling
- [ ] 02-02: Temporal EMA smoothing and 3-tier risk classification state machine

### Phase 3: Photoelastic Birefringence Heatmap Overlay
**Goal**: Render real-time chromatic stress fringes (blue ➔ yellow ➔ deep crimson) directly over crowd footage mimicking photoelastic materials under polarized stress.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03
**UI hint**: no
**Success Criteria** (what must be TRUE):
  1. Continuous 2D stress fields map to a photoelastic chromatic spectrum (cool blue ➔ yellow ➔ deep crimson) without discrete stepping artifacts.
  2. Alpha-blended overlay renders onto video frames while preserving visual clarity of individuals in the crowd.
  3. Chokepoint compression hotspots dynamically flare in deep crimson as stress approaches critical levels.
**Plans**: TBD

Plans:
- [ ] 03-01: Photoelastic chromatic colormap generator and continuous field interpolator
- [ ] 03-02: Real-time alpha blending and contour hotspot visualizer

### Phase 4: Marshal Early-Warning Dashboard & Alert System
**Goal**: Build the interactive Streamlit operator dashboard featuring real-time photoelastic video playback, PSI gauge, rolling stress charts, and actionable gate-throttling advisories.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**UI hint**: yes
**Success Criteria** (what must be TRUE):
  1. Security marshal can view real-time processed video with the blended photoelastic overlay.
  2. Glanceable Peak Stress Index (0–100) radial gauge and color-coded risk badge display instantaneous danger levels.
  3. High-contrast alert banners present actionable throttle guidance (e.g. "THROTTLE GATE BY 50%", "HALT INGRESS IMMEDIATELY") during Warning/Critical tiers.
  4. Live rolling line chart plots PSI over time, exposing stress rate-of-climb ($d\text{PSI}/dt$).
  5. Sidebar controls allow adjusting optical flow sensitivity, video playback source, and alert thresholds.
**Plans**: TBD

Plans:
- [ ] 04-01: Streamlit dashboard shell, layout components, and video player widget
- [ ] 04-02: Real-time PSI gauges, rolling Plotly stress trend chart, and reactive alert banner

### Phase 5: Benchmark Evaluation & System Hardening
**Goal**: Benchmark ForceSight against real-world crowd surge and crush video scenarios to validate detection stability, responsiveness, and false-alarm resistance.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: None (System verification & hardening phase)
**UI hint**: no
**Success Criteria** (what must be TRUE):
  1. Automated test suite validates video ingestion, optical flow extraction, PSI math, and alert thresholds.
  2. End-to-end evaluation runs against benchmark crowd clips, confirming timely alert triggering prior to maximum crush density.
  3. Demonstration scripts, sample video guidelines, and documentation are complete for operator deployment.
**Plans**: TBD

Plans:
- [ ] 05-01: Automated unit and integration test suite
- [ ] 05-02: Benchmark evaluation and operator demonstration pack

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Video Ingestion & Dense Optical Flow Core | 2/2 | Complete | 2026-10-27 |
| 2. Digital Photoelastic Simulation & Peak Stress Index (PSI) | 0/2 | Not started | - |
| 3. Photoelastic Birefringence Heatmap Overlay | 0/2 | Not started | - |
| 4. Marshal Early-Warning Dashboard & Alert System | 0/2 | Not started | - |
| 5. Benchmark Evaluation & System Hardening | 0/2 | Not started | - |
