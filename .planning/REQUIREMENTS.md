# Requirements: ForceSight

**Defined:** October 27, 2026
**Core Value:** Making invisible crowd stress visible in real time through a Digital Photoelastic Heatmap and Peak Stress Index (0–100), giving security marshals indisputable, early-warning visual justification to throttle or divert crowds before dangerous physical crushes develop.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Video Ingestion

- [x] **INGEST-01**: User can select and load pre-recorded crowd benchmark video files (.mp4/.avi) from local disk
- [x] **INGEST-02**: User can control playback (play, pause, loop, and seek frame-by-frame)

### Vision & Optical Flow Tracking

- [x] **FLOW-01**: System extracts dense inter-frame optical flow fields (magnitude and directional vectors) using OpenCV
- [x] **FLOW-02**: System detects crowd density and spatial occupancy distribution across the camera frame
- [x] **FLOW-03**: System computes localized velocity variance (turbulence and sudden stagnation) from optical flow vectors

### Digital Photoelastic Simulation & Stress Metric

- [ ] **SIM-01**: System computes the **Peak Stress Index (PSI: 0 to 100)** by coupling localized crowd density with optical flow velocity variance
- [ ] **SIM-02**: System applies temporal exponential moving average (EMA) smoothing to prevent transient single-frame spikes
- [ ] **SIM-03**: System categorizes PSI into three clear operating regimes: Nominal (0–49), Warning (50–74), and Critical (75–100)

### Photoelastic Heatmap Overlay

- [ ] **PHOTO-01**: System maps the continuous 2D stress field to a photoelastic chromatic spectrum (cool blue ➔ yellow ➔ deep crimson) mimicking polarized stress birefringence
- [ ] **PHOTO-02**: System blends the photoelastic chromatic fringes over the raw crowd footage with calibrated alpha transparency, keeping individuals visible beneath the stress field
- [ ] **PHOTO-03**: System highlights localized stress peak contours/hotspots where bottleneck compression is highest

### Marshal Dashboard & Early-Warning Alerts

- [ ] **DASH-01**: User can view the live processed video with the real-time Photoelastic Heatmap Overlay
- [ ] **DASH-02**: User can view a glanceable Peak Stress Index (0–100) gauge and current risk tier badge (Nominal, Warning, Critical)
- [ ] **DASH-03**: System displays high-contrast visual alert banners with concrete gate-throttling recommendations when PSI exceeds 50 (Warning) and 75 (Critical)
- [ ] **DASH-04**: User can inspect a live rolling time-series graph of PSI over time to observe stress buildup momentum ($d\text{PSI}/dt$)
- [ ] **DASH-05**: User can adjust sensitivity, optical flow parameters, and threshold triggers via sidebar controls

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Ingestion & Calibration
- **INGEST-03**: System ingests live RTSP / IP camera network streams from CCTV infrastructure
- **CALIB-01**: User can draw custom polygonal chokepoint ROIs directly on the video canvas

### Advanced Alerting
- **ALERT-01**: System triggers audible tone/chime alerts for critical threshold breaches
- **ALERT-02**: System dispatches mobile push alerts to patrolling marshals

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Simulated load-cell hardware / kg pressure measurements | Misleading and uncalibrated; replaced by the normalized 0–100 Peak Stress Index |
| Simple red bounding box spam | Replaced by organic, continuous Photoelastic Heatmap Overlay |
| Automated turnstile / gate interlocking | Critical safety hazard — locking physical barriers during panics causes fatal crushes; human marshals must always retain control |
| Facial recognition & biometric identity tracking | Privacy violations and unnecessary compute; crowd crush prevention relies purely on macroscopic fluid stress |
| Cloud SaaS multi-tenant streaming | MVP is designed for a self-contained local security marshal workstation |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGEST-01 | Phase 1 | Complete |
| INGEST-02 | Phase 1 | Complete |
| FLOW-01 | Phase 1 | Complete |
| FLOW-02 | Phase 1 | Complete |
| FLOW-03 | Phase 1 | Complete |
| SIM-01 | Phase 2 | Pending |
| SIM-02 | Phase 2 | Pending |
| SIM-03 | Phase 2 | Pending |
| PHOTO-01 | Phase 3 | Pending |
| PHOTO-02 | Phase 3 | Pending |
| PHOTO-03 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| DASH-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: October 27, 2026*
*Last updated: October 27, 2026 after initialization (Photoelastic Simulation pivot)*
