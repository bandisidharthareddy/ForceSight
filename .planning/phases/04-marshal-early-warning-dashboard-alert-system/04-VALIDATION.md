---
phase: "4"
slug: "marshal-early-warning-dashboard-alert-system"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-27"
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | `pytest.ini` |
| **Quick run command** | `python -m pytest tests/test_dashboard.py -q` |
| **Full suite command** | `python -m pytest tests/ -q` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest tests/test_dashboard.py -q`
- **After every plan wave:** Run `python -m pytest tests/ -q`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | DASH-01 | — | Integrated end-to-end pipeline processing | unit | `python -m pytest tests/test_dashboard.py -k test_pipeline -q` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | DASH-02, DASH-04 | — | Plotly radial gauge and rolling time-series chart generators | unit | `python -m pytest tests/test_dashboard.py -k test_components -q` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | DASH-03 | — | High-contrast actionable alert banner generator | unit | `python -m pytest tests/test_dashboard.py -k test_alert_banners -q` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | DASH-05 | — | Streamlit dashboard imports and configuration schema | unit | `python -m pytest tests/test_dashboard.py -k test_dashboard_app -q` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_dashboard.py` — unit tests for pipeline, Plotly components, alert banners, and dashboard app integration

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Interactive dashboard UI responsiveness | DASH-01, DASH-05 | Streamlit browser rendering and interactive widget controls | Run `streamlit run src/dashboard/app.py` in browser, click Play/Pause, adjust sensitivity slider, and observe synchronized video and telemetry |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
