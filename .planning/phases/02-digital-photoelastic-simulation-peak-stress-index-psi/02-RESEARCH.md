# Phase 2: Digital Photoelastic Simulation & Peak Stress Index (PSI) - Research

**Researched:** October 27, 2026
**Domain:** Crowd Physics Modeling, Digital Photoelastic Stress Engine & State Machine
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Implement a coupled Helbing formulation for the 2D stress surface: combining localized density ($\rho$), velocity variance ($\text{Var}(v)$), an interaction term ($\rho \cdot \text{Var}(v)$), and boundary stagnation divergence.
- **D-02:** Normalize the continuous stress field and scalar peak metric to a strict 0 to 100 scale using a calibrated sigmoidal/scaling curve (0 = calm corridor, 100 = severe crowd crush shockwaves).
- **D-03:** Extract spatial density using a hybrid edge-gradient energy approach (Sobel/Canny edge density representing head/shoulder contours) combined with optical flow activity occupancy across the 20x20 pixel grid cells.
- **D-04:** Apply an asymmetric Exponential Moving Average (EMA) to the instantaneous stress metrics:
  - *Fast-Attack* ($\alpha_{\text{rise}} = 0.35$): Rapidly responds to sudden surges, forward rushes, or deceleration spikes (~3-5 frames).
  - *Slow-Decay* ($\alpha_{\text{fall}} = 0.10$): Gradually cools down to prevent premature "all-clear" signals while crowds remain packed.
- **D-05:** Establish three standardized risk regimes:
  - **Nominal**: $0 \le \text{PSI} < 50$ (Normal flowing crowd, green state)
  - **Warning**: $50 \le \text{PSI} < 75$ (Compression and agitation mounting, gate throttling recommended)
  - **Critical**: $75 \le \text{PSI} \le 100$ (Dangerous crush risk, immediate ingress halt required)
- **D-06:** Implement a 5-point hysteresis buffer on downward transitions:
  - Entering Warning requires $\text{PSI} \ge 50$; clearing Warning back to Nominal requires falling below 45 for $\ge 15$ consecutive frames.
  - Entering Critical requires $\text{PSI} \ge 75$; clearing Critical back to Warning requires falling below 70 for $\ge 15$ consecutive frames.

### the agent's Discretion
- Choice of exact weighting constants ($w_1, w_2, w_3, w_4$) for density, variance, interaction, and stagnation.
- Sigmoid scaling slope and midpoint calibration.
- Pydantic configuration schema structure in `src/config.py`.

### Deferred Ideas (OUT OF SCOPE)
- Chromatic fringe rendering and alpha blending (Phase 3).
- Streamlit dashboard gauges and audio alert cues (Phase 4).
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Spatial density extraction | Vision/Physics Tier (`src/physics/density.py`) | — | Computes edge-gradient contour density and grid occupancy from frame proxies |
| 2D Photoelastic stress field calculation | Physics Engine (`src/physics/stress_engine.py`) | — | Evaluates coupled Helbing formulas across 18x32 grid cells and interpolates continuous stress |
| Peak Stress Index (0–100) aggregation | Physics Engine (`src/physics/stress_engine.py`) | — | Computes 95th-percentile / peak localized stress normalized to 0–100 |
| Asymmetric temporal smoothing | State Machine (`src/physics/risk_state.py`) | — | Applies fast-attack / slow-decay EMA filter across frame sequence |
| Hysteresis risk tier state management | State Machine (`src/physics/risk_state.py`) | — | Manages Nominal/Warning/Critical transitions with debouncing buffers |

</architectural_responsibility_map>

<research_summary>
## Summary

Phase 2 develops the scientific mathematical engine of ForceSight. Drawing directly from Dirk Helbing's empirical formulations on crowd turbulence and disaster dynamics ($P = \rho \cdot \text{Var}(v)$), we synthesize a continuous 2D photoelastic stress field. In physical photoelasticity, localized shear and compressive stress induce optical birefringence, concentrating chromatic fringes at structural pinch points. In ForceSight, physical stress is modeled as the product of spatial crowd compaction ($\rho$) and kinetic turbulence ($\text{Var}(v)$).

Spatial density is extracted via Sobel spatial gradients—which quantify the density of human head and shoulder silhouettes per unit area—weighted by active optical flow cells. When incoming crowds collide with structural bottlenecks, forward velocity drops abruptly while density and variance surge; our stagnation divergence term detects this compressive shockwave even before full physical pileup occurs.

To ensure stability on live CCTV video, the raw scalar index is passed through an asymmetric Exponential Moving Average (EMA). Fast attack ($\alpha = 0.35$) ensures life-safety early warnings are triggered within 150ms of surge onset, while slow decay ($\alpha = 0.10$) and 5-point hysteresis boundaries eliminate flickering alarms.

**Primary recommendation:** Implement `SpatialDensityEstimator`, `PhotoelasticStressEngine`, and `RiskStateMachine` in a dedicated `src/physics/` package, exposing clean interfaces for Phase 3's chromatic rendering and Phase 4's operator dashboard.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python | 3.11+ | Runtime environment | Standard for scientific computing |
| numpy | 1.26+ | Vectorized 2D grid matrix operations | High-speed array math for Helbing interaction products and percentile pooling |
| scipy | 1.13+ | 2D Gaussian spatial smoothing | `scipy.ndimage.gaussian_filter` generates organic, continuous stress fields from grid cells |
| opencv-python | 4.10+ | Edge gradient extraction | `cv2.Sobel` computes directional spatial gradients for crowd density estimation |
| pydantic | 2.9+ | Data schemas & configuration | Type-safe models for `StressConfig` and `StressState` |

### Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest | 8.0+ | Automated test suite | Regression testing of formulas, EMA smoothing, and hysteresis states |

**Installation:**
```bash
pip install scipy
```
</standard_stack>

## Validation Architecture

### Test Infrastructure
- **Framework**: `pytest 8.x`
- **Config file**: `pytest.ini`
- **Quick run command**: `pytest tests/test_physics.py -q`
- **Full suite command**: `pytest tests/ -q`
- **Estimated runtime**: ~4 seconds

### Automated Verification Coverage

1. `tests/test_physics.py`:
   - `test_density_estimation`: Validates that empty frames produce ~0.0 density while frames crowded with head contours produce high density.
   - `test_stress_formula_bounds`: Validates that `PhotoelasticStressEngine` strictly outputs PSI within $[0.0, 100.0]$.
   - `test_stagnation_amplification`: Verifies that adding stagnation divergence to identical density/variance conditions increases PSI.
   - `test_asymmetric_ema`: Verifies fast-attack response on sudden step jumps vs slow exponential decay on sudden drop-offs.
   - `test_hysteresis_state_machine`: Verifies that entering Warning requires PSI $\ge 50$, and clearing Warning requires falling below 45 for 15 frames.
   - `test_critical_hysteresis`: Verifies that entering Critical requires PSI $\ge 75$, and clearing Critical requires falling below 70 for 15 frames.

---
*Phase 2 Research completed: October 27, 2026*
