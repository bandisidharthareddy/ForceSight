# Phase 4: Marshal Early-Warning Dashboard & Alert System — Research

**Date:** October 27, 2026  
**Status:** Complete  

## Overview & Architecture

Phase 4 synthesizes all computer vision, physics, and rendering components into a unified Streamlit operator dashboard. It fulfills requirements `DASH-01` through `DASH-05`:
1. **End-to-End ForceSight Pipeline (`src/pipeline.py`)**: Orchestrates the linear frame processing graph:
   `VideoLoader` $\rightarrow$ `OpticalFlowTracker` $\rightarrow$ `TurbulenceExtractor` $\rightarrow$ `SpatialDensityEstimator` $\rightarrow$ `PhotoelasticStressEngine` $\rightarrow$ `RiskStateMachine` $\rightarrow$ `PhotoelasticOverlayRenderer`.
2. **Dashboard UI Components (`src/dashboard/components.py`)**: Reusable Plotly visualizations for the 0–100 radial gauge, rolling time-series graph with threshold fences, and styled HTML alert banners.
3. **Streamlit Command Center App (`src/dashboard/app.py`)**: 2-Column responsive dashboard with video playback controls, real-time telemetry, and sidebar configuration sliders.

---

## Technical Patterns & Findings

### 1. Unified Pipeline (`src/pipeline.py`)
Encapsulating all previous phases into a single pipeline class ensures:
- Headless execution for unit tests, CLI profiling, and automated benchmarks.
- Clean state maintenance (`RiskStateMachine` and `AsymmetricEMA` history).
- Clean output structure:
  ```python
  @dataclass
  class PipelineResult:
      frame_idx: int
      timestamp_ms: float
      blended_frame: np.ndarray  # RGB/BGR for display
      rgba_overlay: np.ndarray
      instantaneous_psi: float
      smoothed_psi: float
      risk_state: RiskStateResult
      hotspot_coords: tuple[int, int]
      hotspot_pixel: tuple[int, int]
  ```

### 2. Plotly Radial Gauge & Rolling Chart
- Semi-circular radial gauge using `plotly.graph_objects.Indicator`:
  ```python
  fig = go.Figure(go.Indicator(
      mode="gauge+number",
      value=smoothed_psi,
      domain={'x': [0, 1], 'y': [0, 1]},
      gauge={
          'axis': {'range': [0, 100], 'tickwidth': 1},
          'bar': {'color': "darkblue"},
          'steps': [
              {'range': [0, 50], 'color': "rgba(76, 175, 80, 0.4)"},
              {'range': [50, 75], 'color': "rgba(255, 193, 7, 0.5)"},
              {'range': [75, 100], 'color': "rgba(244, 67, 54, 0.6)"},
          ],
          'threshold': {'line': {'color': "red", 'width': 4}, 'thickness': 0.75, 'value': 75}
      }
  ))
  ```
- Rolling chart: Maintains an array of last $N=100$ frame timestamps and smoothed PSI values. Draws horizontal threshold lines at 50 (Warning, amber dash) and 75 (Critical, crimson dash).

### 3. Streamlit Playback Architecture
- To achieve smooth video streaming in Streamlit:
  - Avoid re-instantiating heavy models per frame: cache pipeline in `st.session_state`.
  - Use `video_placeholder = st.empty()` and update with `video_placeholder.image(blended_rgb, channels="RGB", use_container_width=True)`.
  - Provide interactive buttons: `col1.button("Play")`, `col2.button("Pause")`, `col3.button("Reset")`.
  - Frame rate control via `time.sleep(1.0 / target_fps)`.

---

## Pitfalls & Mitigations

| Pitfall | Risk | Mitigation |
|---|---|---|
| Streamlit state reset on every button click | Frame index resets to 0 whenever user interacts with a widget | Store `pipeline`, `current_frame_idx`, and `is_playing` in `st.session_state` |
| Color format inversion (BGR vs RGB) in `st.image` | Video appears with blue faces or reddish backgrounds | Convert BGR blended frames to RGB before displaying in Streamlit |
| UI lag from redundant chart redraws | Plotly charts re-rendering every frame can drop FPS to < 10 FPS | Update Plotly charts every 3–5 frames or when risk regime changes, while streaming video frames at native speed |

---

## Implementation Plan Outline

- **Wave 1 (04-01)**: Integrated pipeline runner (`src/pipeline.py`) and UI telemetry components (`src/dashboard/components.py`).
- **Wave 2 (04-02)**: Complete Streamlit command center dashboard (`src/dashboard/app.py`) with playback controls, alert banners, and sidebar parameter tuning.
