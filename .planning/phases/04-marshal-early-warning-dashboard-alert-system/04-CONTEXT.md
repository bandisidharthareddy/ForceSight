# Phase 4: Marshal Early-Warning Dashboard & Alert System - Context

**Gathered:** October 27, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers the interactive Streamlit operator dashboard for ForceSight. It unifies video ingestion (Phase 1), crowd stress simulation (Phase 2), and photoelastic birefringence overlay rendering (Phase 3) into a single glanceable command center. Security marshals can play/pause benchmark crowd videos, observe live photoelastic overlays, monitor real-time PSI on a Plotly radial gauge and rolling time-series graph, receive high-contrast gate-throttling alert banners, and tune model sensitivity parameters from the sidebar.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout & Spatial Hierarchy
- **D-01:** Implement a 2-Column Command Center layout:
  - Left Column (~65% width): Large video stream player displaying live blended photoelastic crowd footage, with Play / Pause / Rewind / Loop controls and FPS throttle below.
  - Right Column (~35% width): Real-time telemetry dashboard hosting the Peak Stress Index radial gauge, current risk regime badge, actionable early-warning banner, and rolling time-series chart. — **Reversibility:** reversible

### PSI Gauge & Risk Indicator
- **D-02:** Build an interactive semi-circular Plotly radial gauge (0–100):
  - Green zone ($0\text{–}49$): Nominal
  - Amber zone ($50\text{–}74$): Warning
  - Deep Red zone ($75\text{–}100$): Critical
  - Large digital readout of current smoothed PSI accompanied by a prominent color-coded risk badge (`NOMINAL`, `WARNING`, `CRITICAL`). — **Reversibility:** reversible

### Early-Warning Alert Presentation
- **D-03:** Prominently display dynamic high-contrast alert banners above/alongside telemetry:
  - **Nominal ($< 50$)**: Green alert card — `"STATUS: NOMINAL — Normal crowd flow. Standard ingress permitted."`
  - **Warning ($50\text{–}74$)**: Bold Amber warning banner — `"ACTION REQUIRED: THROTTLE GATES BY 50% — High bottleneck compression detected."`
  - **Critical ($75\text{–}100$)**: Flashing Deep Red critical banner — `"CRITICAL SURGE: HALT INGRESS IMMEDIATELY — Severe crush risk at primary bottleneck."` — **Reversibility:** reversible

### Real-Time Playback Engine
- **D-04:** Use Streamlit stateful session loop with `st.empty()` placeholder for live frame updates:
  - Supports Play, Pause, Frame-Step, and Rewind.
  - Maintains a circular buffer of the past 100 frames of PSI data for the rolling Plotly line chart.
  - Sidebar contains sensitivity sliders (Optical Flow sensitivity, Density weight, Alert thresholds). — **Reversibility:** reversible

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — User persona (Karthik Reddy, gate marshal) and early-warning glanceability requirements
- `.planning/REQUIREMENTS.md` — Scope requirements DASH-01, DASH-02, DASH-03, DASH-04, DASH-05

### Upstream Modules
- `src/ingestion/video_loader.py` — `VideoLoader`, `FrameData`
- `src/vision/tracker.py` — `OpticalFlowTracker`
- `src/vision/motion_stats.py` — `TurbulenceExtractor`
- `src/physics/density.py` — `SpatialDensityEstimator`
- `src/physics/stress_engine.py` — `PhotoelasticStressEngine`
- `src/physics/risk_state.py` — `RiskStateMachine`, `RiskLevel`
- `src/visualization/overlay.py` — `PhotoelasticOverlayRenderer`, `OverlayResult`
- `src/config.py` — Global configuration parameters

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Full pipeline chain: `VideoLoader` $\rightarrow$ `OpticalFlowTracker` $\rightarrow$ `TurbulenceExtractor` $\rightarrow$ `SpatialDensityEstimator` $\rightarrow$ `PhotoelasticStressEngine` $\rightarrow$ `RiskStateMachine` $\rightarrow$ `PhotoelasticOverlayRenderer`.
- All modules are modular dataclass/class instances with default configs in `src/config.py`.

### Integration Points
- `src/pipeline.py` — Integrated end-to-end pipeline processor running each video frame through tracking, physics, and visualization.
- `src/dashboard/app.py` — Main Streamlit dashboard application.
- `src/dashboard/components.py` — Reusable Plotly chart generators (gauge, rolling chart, alert banners).

</code_context>

<specifics>
## Specific Ideas

- The rolling time-series graph should feature horizontal dashed threshold lines at 50 (Warning) and 75 (Critical) to visually indicate proximity to danger.
- The pipeline processor in `src/pipeline.py` allows both programmatic headless execution (for tests and benchmarks) and UI frame yielding for Streamlit.

</specifics>

<deferred>
## Deferred Ideas

- Direct RTSP IP camera streaming and audio horn alarms — deferred to v2.

</deferred>

---

*Phase: 04-marshal-early-warning-dashboard-alert-system*
