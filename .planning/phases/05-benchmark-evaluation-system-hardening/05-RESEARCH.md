# Phase 5: Benchmark Evaluation & System Hardening — Research

**Date:** October 27, 2026  
**Status:** Complete  

## Overview & Architecture

Phase 5 validates ForceSight against standardized benchmark crowd dynamics, stress-tests pipeline resilience against adverse video conditions, and verifies real-time processing throughput ($\ge 24$ FPS).
1. **Multi-Scenario Synthetic Crowd Benchmark Generator (`scripts/generate_synthetic_crowd.py`)**:
   - Generates three distinct operational test vectors:
     - `orderly_queue.mp4`: Smooth laminar ingress, validating false-alarm suppression ($\text{PSI} < 40$).
     - `bottleneck_jam.mp4`: Abrupt gate closure with compressive jamming ($\text{PSI} > 75$ within 5 frames).
     - `counter_flow.mp4`: Opposing crowd streams colliding head-on, producing extreme turbulence ($\text{PSI} > 80$).
2. **System Hardening & Edge-Case Guardrails (`tests/test_benchmarks.py`)**:
   - Verifies mathematical stability under camera shake, extreme low-light/near-black frames, uniform textures, and empty corridors.
3. **Automated Benchmark CLI Runner (`scripts/run_benchmarks.py`)**:
   - Executes benchmarks headless, profiles per-subsystem execution latency, evaluates detection criteria, and saves proof frames to `data/reports/`.

---

## Technical Patterns & Findings

### 1. Multi-Scenario Particle Dynamics
- **Orderly Queue**: $N=200$ particles flowing with $v_x = 3.0 \pm 0.2$, $v_y = 0.0 \pm 0.1$. Because all particles share identical direction and speed, velocity variance is minimal ($\text{Var}(v) \approx 0.05$) and stagnation is 0. Expected PSI remains in Nominal ($< 40$).
- **Bottleneck Jam**: $N=300$ particles rushing forward; at $t = 2.0\text{s}$ (frame 60), an impassable vertical barrier activates at $x = 0.7 \cdot W$. Particles pile up and decelerate abruptly. Stagnation divergence and local density spike simultaneously, driving PSI $> 75$.
- **Counter-Flow Collision**: Two streams of $N=150$ particles moving in opposing directions ($+v_x$ and $-v_x$). In the mixing zone ($x \in [0.45, 0.55] \cdot W$), opposing velocity vectors within the same 20x20px grid block cause $\text{Var}(v)$ to surge to $> 15.0$, driving PSI $> 80$.

### 2. Camera Shake Tolerance
- When a camera vibrates or shakes uniformly, every pixel in the frame moves by the same vector $(\Delta x, \Delta y)$.
- Because `TurbulenceExtractor` evaluates spatial variance $\text{Var}(u) + \text{Var}(v)$ within each block, a uniform global shift has near-zero internal variance: $\text{Var}(\text{constant}) = 0$.
- Hence, uniform camera vibration does not produce false-positive turbulence spikes.

### 3. Granular Execution Timing Profiler
Using `time.perf_counter_ns()` across 100 frames on 640x360 proxy / 720p output:
- Farnebäck Optical Flow: ~12–16 ms
- Spatial Density: ~2–3 ms
- Helbing Stress Surface: ~1 ms
- Overlay Rendering & Color LUT: ~3–4 ms
- Total per-frame runtime: ~20–25 ms $\implies \approx 40\text{--}50$ FPS (comfortably exceeding the 24 FPS real-time threshold).

---

## Implementation Plan Outline

- **Wave 1 (05-01)**: Multi-scenario synthetic crowd generator and benchmark CLI runner (`scripts/generate_synthetic_crowd.py`, `scripts/run_benchmarks.py`).
- **Wave 2 (05-02)**: System hardening tests, noise resilience, and final project verification report (`tests/test_benchmarks.py`).
