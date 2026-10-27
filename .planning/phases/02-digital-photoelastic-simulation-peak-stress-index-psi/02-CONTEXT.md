# Phase 2: Digital Photoelastic Simulation & Peak Stress Index (PSI) - Context

**Gathered:** October 27, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 formulates and implements the core Digital Photoelastic stress simulation engine. It consumes Phase 1's dense optical flow fields and frame proxies, extracts spatial crowd density, couples density with velocity variance via Helbing's crowd pressure equations, computes the normalized 0–100 Peak Stress Index (PSI), and manages state transitions across Nominal, Warning, and Critical regimes with asymmetric temporal smoothing and hysteresis debouncing.

</domain>

<decisions>
## Implementation Decisions

### Stress Index Mathematical Formulation
- **D-01:** Implement a coupled Helbing formulation for the 2D stress surface: combining localized density ($\rho$), velocity variance ($\text{Var}(v)$), an interaction term ($\rho \cdot \text{Var}(v)$), and boundary stagnation divergence. — **Reversibility:** costly — defines the mathematical core of the entire photoelastic simulation
- **D-02:** Normalize the continuous stress field and scalar peak metric to a strict 0 to 100 scale using a calibrated sigmoidal/scaling curve, where 0 represents calm empty corridors and 100 represents severe crowd crush shockwaves. — **Reversibility:** reversible

### Spatial Density Estimation
- **D-03:** Extract spatial density using a hybrid edge-gradient energy approach (Sobel/Canny edge density representing head/shoulder contours) combined with optical flow activity occupancy across the 20x20 pixel grid cells. — **Reversibility:** reversible

### Temporal Smoothing Strategy
- **D-04:** Apply an asymmetric Exponential Moving Average (EMA) to the instantaneous stress metrics:
  - *Fast-Attack* ($\alpha_{\text{rise}} = 0.35$): Rapidly responds to sudden surges, crowds rushing forward, or abrupt deceleration spikes (~3-5 frames).
  - *Slow-Decay* ($\alpha_{\text{fall}} = 0.10$): Slowly cools down when motion pauses, preventing premature "all-clear" signals while a crowd remains compressed. — **Reversibility:** reversible

### Risk Thresholds & Hysteresis State Machine
- **D-05:** Establish three standardized risk regimes:
  - **Nominal**: PSI $0 \le \text{PSI} < 50$ (Normal flowing crowd, green state)
  - **Warning**: PSI $50 \le \text{PSI} < 75$ (Compression and agitation mounting, gate throttling recommended)
  - **Critical**: PSI $75 \le \text{PSI} \le 100$ (Dangerous crush risk, immediate ingress halt required) — **Reversibility:** reversible
- **D-06:** Implement a 5-point hysteresis buffer on downward transitions:
  - Entering Warning requires $\text{PSI} \ge 50$; clearing Warning back to Nominal requires falling below 45 for $\ge 15$ consecutive frames.
  - Entering Critical requires $\text{PSI} \ge 75$; clearing Critical back to Warning requires falling below 70 for $\ge 15$ consecutive frames. — **Reversibility:** reversible

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Vision
- `.planning/PROJECT.md` — Project context, Peak Stress Index (0–100), and Digital Photoelastic Simulation vision
- `.planning/REQUIREMENTS.md` — Scope requirements SIM-01, SIM-02, SIM-03
- `.planning/research/SUMMARY.md` — Crowd physics research, Helbing pressure formulas, and biomechanical crush risk thresholds

### Phase 1 Outputs
- `.planning/phases/01-video-ingestion-dense-optical-flow-core/01-VERIFICATION.md` — Verified optical flow outputs
- `src/vision/tracker.py` — `FlowVectors` dataclass (Cartesian $u, v$ and polar $mag, ang$)
- `src/vision/motion_stats.py` — `FlowResult` dataclass and `TurbulenceExtractor` (velocity variance and stagnation score)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/config.py` — Extend with `StressConfig` holding formulation weights, EMA alphas, and threshold limits.
- `src/vision/tracker.py` and `src/vision/motion_stats.py` — Direct inputs providing optical flow magnitude and block-level variance.

### Integration Points
- `src/physics/stress_engine.py` — Core module computing the 2D stress field and scalar PSI.
- `src/physics/risk_state.py` — Stateful hysteresis machine managing Nominal/Warning/Critical transitions.

</code_context>

<specifics>
## Specific Ideas

- The stress engine must output both a continuous 2D stress matrix (for Phase 3's photoelastic chromatic heatmap overlay) and an aggregated scalar `peak_stress_index` (for Phase 4's dashboard gauges and banners).
- When a crowd is stationary but densely packed at a closed barrier, the stagnation divergence term ensures PSI stays elevated even if velocity magnitude drops near zero.

</specifics>

<deferred>
## Deferred Ideas

- Chromatic fringe rendering and alpha blending — deferred to Phase 3.
- Streamlit dashboard gauges and audio alert cues — deferred to Phase 4.

</deferred>

---

*Phase: 02-digital-photoelastic-simulation-peak-stress-index-psi*
