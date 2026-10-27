# Requirements: ForceSight

**Defined:** October 27, 2026
**Core Value:** Making invisible crowd compressive force visible in real time to give security personnel indisputable, early-warning justification to throttle or divert crowds before dangerous crushes develop.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Video Ingestion

- [ ] **INGEST-01**: User can select and load pre-recorded crowd benchmark video files (.mp4/.avi) from local disk
- [ ] **INGEST-02**: User can control playback (play, pause, loop, and frame step)

### Vision Detection & Tracking

- [ ] **VIS-01**: System detects human heads/persons in video frames using YOLO
- [ ] **VIS-02**: System extracts 2D centroid coordinates and bounding boxes for each detected individual
- [ ] **VIS-03**: System tracks inter-frame displacement vectors between consecutive frames

### Spatial Grid & Ground Calibration

- [ ] **GRID-01**: System partitions the monitored chokepoint scene into a calibrated 2D ground grid
- [ ] **GRID-02**: System applies perspective depth scaling to normalize density across near and far corridor areas
- [ ] **GRID-03**: System calculates localized crowd density (persons/m²) for each spatial grid cell

### Physics & Compressive Force Engine

- [ ] **PHYS-01**: System calculates Helbing crowd pressure from localized density and velocity variance
- [ ] **PHYS-02**: System translates localized pressure into compressive mechanical force in kilograms (kg)
- [ ] **PHYS-03**: System applies exponential moving average (EMA) temporal smoothing to prevent transient frame jitter
- [ ] **PHYS-04**: System categorizes crowd risk state into three thresholds: Safe (<150 kg), Warning (150–250 kg), and Critical (>250 kg)

### Thermal Heatmap & Visual Overlay

- [ ] **HEAT-01**: System computes a 2D continuous force intensity surface using Gaussian spatial filtering
- [ ] **HEAT-02**: System renders a dynamic thermal color heatmap (Green/Yellow/Red) overlay on the video frame
- [ ] **HEAT-03**: System applies alpha-transparency blending so the underlying crowd footage remains visible

### Operator Dashboard & Early-Warning Alerts

- [ ] **DASH-01**: User can view real-time processed video alongside current peak compressive force in kg
- [ ] **DASH-02**: User can view a glanceable risk status gauge (Safe, Warning, Critical) with color indicators
- [ ] **DASH-03**: System displays high-contrast visual alert banners with concrete gate-throttling recommendations during Warning and Critical states
- [ ] **DASH-04**: User can inspect a live rolling time-series graph of force (kg vs time) to detect surge momentum
- [ ] **DASH-05**: User can adjust risk threshold parameters and detection confidence sliders via sidebar controls

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Ingestion & Integration
- **INGEST-03**: System ingests live RTSP / IP camera network streams from CCTV infrastructure
- **INGEST-04**: System supports multi-camera handoff across consecutive chokepoints

### Advanced Alerting & UX
- **ALERT-01**: System triggers audible tone/chime alerts for critical threshold breaches
- **ALERT-02**: User can draw custom polygonal chokepoint ROIs directly on the video feed canvas
- **ALERT-03**: System dispatches mobile push alerts to patrolling marshals

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automated turnstile / gate interlocking | Critical safety hazard — locking physical barriers during panics causes fatal crushes; human marshals must always retain final control |
| Facial recognition & biometric identity tracking | Privacy violations and unnecessary compute; crowd crush prevention relies purely on physical fluid density |
| Cloud SaaS multi-tenant streaming | MVP is designed for a self-contained local security marshal workstation |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGEST-01 | Phase 1 | Pending |
| INGEST-02 | Phase 1 | Pending |
| VIS-01 | Phase 1 | Pending |
| VIS-02 | Phase 1 | Pending |
| VIS-03 | Phase 1 | Pending |
| GRID-01 | Phase 2 | Pending |
| GRID-02 | Phase 2 | Pending |
| GRID-03 | Phase 2 | Pending |
| PHYS-01 | Phase 3 | Pending |
| PHYS-02 | Phase 3 | Pending |
| PHYS-03 | Phase 3 | Pending |
| PHYS-04 | Phase 3 | Pending |
| HEAT-01 | Phase 4 | Pending |
| HEAT-02 | Phase 4 | Pending |
| HEAT-03 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| DASH-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: October 27, 2026*
*Last updated: October 27, 2026 after initialization*
