---
phase: "5"
slug: "benchmark-evaluation-system-hardening"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-27"
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | `pytest.ini` |
| **Quick run command** | `python -m pytest tests/test_benchmarks.py -q` |
| **Full suite command** | `python -m pytest tests/ -q` |
| **Estimated runtime** | ~6 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest tests/test_benchmarks.py -q`
- **After every plan wave:** Run `python -m pytest tests/ -q`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 6 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | — | — | Multi-scenario benchmark video generator | unit | `python -m pytest tests/test_benchmarks.py -k test_benchmark_generation -q` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | — | — | Benchmark CLI runner and throughput profiling | unit | `python -m pytest tests/test_benchmarks.py -k test_benchmark_runner -q` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | — | — | False-alarm suppression on orderly queue flow | unit | `python -m pytest tests/test_benchmarks.py -k test_orderly_queue_suppression -q` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | — | — | Surge detection latency and system hardening resilience | unit | `python -m pytest tests/test_benchmarks.py -k test_hardening_edge_cases -q` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_benchmarks.py` — unit tests for multi-scenario benchmark generation, runner execution, false-alarm suppression, and edge-case hardening

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time Streamlit dashboard live playback | DASH-01 | Verifies visual smoothness and human-observable responsiveness | Run `streamlit run src/dashboard/app.py`, select each of the 3 benchmark videos, and verify seamless color shifts and alerts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 6s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
