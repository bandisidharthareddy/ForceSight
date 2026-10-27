# Phase 5: Benchmark Evaluation & System Hardening - Context

**Gathered:** October 27, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 is the final milestone verification and hardening phase of ForceSight. It evaluates the entire system under rigorous synthetic and real-world benchmark conditions to prove detection latency, surge accuracy, false-alarm resilience, and real-time processing throughput ($\ge 24$ FPS). It hardens the system against edge cases (camera shakes, sensor noise, low light, empty scenes) and produces a standalone benchmark CLI runner (`scripts/run_benchmarks.py`) and evaluation reports in `data/reports/`.

</domain>

<decisions>
## Implementation Decisions

### Benchmark Scenarios
- **D-01:** Build a 3-scenario synthetic benchmark generator:
  1. **Orderly Queue** (`data/benchmarks/orderly_queue.mp4`): Laminar, steady-state crowd ingress. Peak Stress Index must remain strictly in Nominal regime ($\text{PSI} < 40$) without false alarms.
  2. **Sudden Bottleneck Jam** (`data/benchmarks/bottleneck_jam.mp4`): Fast crowd rushing toward a narrow gate that abruptly halts, causing compressive shockwaves. PSI must escalate to Critical ($\text{PSI} > 75$) within 5 frames of impact.
  3. **Counter-Flow Collision** (`data/benchmarks/counter_flow.mp4`): Two opposing crowd streams colliding in a narrow passageway, inducing violent velocity turbulence. PSI must surge into Critical ($\text{PSI} > 80$). — **Reversibility:** reversible

### Throughput & Granular Profiling
- **D-02:** Implement a granular per-stage latency profiler:
  - Measures execution time (ms) for: (1) Frame Ingestion/Resizing, (2) Farnebäck Optical Flow, (3) Velocity Variance & Stagnation, (4) Spatial Density Estimation, (5) Helbing Stress Surface & PSI Engine, (6) Photoelastic Overlay Rendering.
  - Verifies total end-to-end throughput reaches $\ge 24$ FPS on standard 720p resolution. — **Reversibility:** reversible

### System Hardening & Edge Cases
- **D-03:** Harden the pipeline against adverse field conditions:
  - **Camera Jitter / Shake**: Ensure global camera translation does not cause artificial turbulence spikes (mitigated by spatial variance and grid divergence).
  - **Extreme Low-Light / Dark Frames**: Ensure edge detector and optical flow do not raise divide-by-zero or NaN values when mean pixel luminance $< 10$.
  - **Empty Corridor**: Zero crowd activity yields zero PSI.
  - **Abrupt Scene Cuts**: Immediate recovery without lingering state corruption. — **Reversibility:** reversible

### Deliverables & Benchmark CLI
- **D-04:** Provide `scripts/run_benchmarks.py`:
  - Executes all 3 benchmark scenarios.
  - Prints a formatted terminal summary table (Scenario, Max PSI, Regime, Detection Latency, Mean FPS).
  - Saves annotated proof frames and evaluation report to `data/reports/benchmark_report.json` and markdown summary. — **Reversibility:** reversible

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Metrics
- `.planning/PROJECT.md` — Performance goals ($\ge 24$ FPS, 0–100 PSI scale)
- `.planning/ROADMAP.md` — Phase 5 success criteria

### Upstream Modules
- `src/pipeline.py` — `ForceSightPipeline`, `PipelineResult`
- `scripts/generate_synthetic_crowd.py` — Base synthetic particle crowd generator
- `src/dashboard/app.py` — Streamlit dashboard reading benchmark video files

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/generate_synthetic_crowd.py` — Extend to support multiple scenario modes (`orderly`, `bottleneck`, `counter_flow`).
- `src/pipeline.py` — Provides atomic `process_frame()` and `reset()`.

### Integration Points
- `scripts/run_benchmarks.py` — Standalone test runner and metrics evaluator.
- `tests/test_benchmarks.py` — Automated regression and hardening test suite.

</code_context>

<specifics>
## Specific Ideas

- The benchmark CLI can be executed via `python scripts/run_benchmarks.py` for instant evaluation during demonstrations.
- Save a sample visual frame showing the photoelastic overlay at peak stress for each scenario in `data/reports/`.

</specifics>

<deferred>
## Deferred Ideas

- None — this is the final milestone phase.

</deferred>

---

*Phase: 05-benchmark-evaluation-system-hardening*
