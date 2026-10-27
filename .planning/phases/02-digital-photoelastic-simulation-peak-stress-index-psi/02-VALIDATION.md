---
phase: "2"
slug: "digital-photoelastic-simulation-peak-stress-index-psi"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-27"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | `pytest.ini` |
| **Quick run command** | `pytest tests/test_physics.py -q` |
| **Full suite command** | `pytest tests/ -q` |
| **Estimated runtime** | ~4 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest tests/test_physics.py -q`
- **After every plan wave:** Run `pytest tests/ -q`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SIM-01 | — | Spatial density extraction from edge gradients | unit | `pytest tests/test_physics.py -k test_density -q` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | SIM-01 | — | Coupled Helbing stress surface & 0-100 PSI calculation | unit | `pytest tests/test_physics.py -k test_stress_formula -q` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | SIM-02 | — | Asymmetric fast-attack / slow-decay EMA filter | unit | `pytest tests/test_physics.py -k test_asymmetric_ema -q` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | SIM-03 | — | 3-tier risk classification with 5-point hysteresis | unit | `pytest tests/test_physics.py -k test_hysteresis -q` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_physics.py` — unit tests for density, stress engine, asymmetric EMA, and hysteresis state machine
- [ ] `scipy` — install scipy package if missing

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time stress responsiveness | SIM-01, SIM-02 | Subjective responsiveness to human eye | Run pipeline on `data/benchmarks/synthetic_surge.mp4` and observe that PSI spikes synchronously when bottleneck congestion starts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
