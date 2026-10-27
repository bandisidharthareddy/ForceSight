---
phase: "3"
slug: "photoelastic-birefringence-heatmap-overlay"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-27"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | `pytest.ini` |
| **Quick run command** | `python -m pytest tests/test_visualization.py -q` |
| **Full suite command** | `python -m pytest tests/ -q` |
| **Estimated runtime** | ~4 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python -m pytest tests/test_visualization.py -q`
- **After every plan wave:** Run `python -m pytest tests/ -q`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PHOTO-01 | — | 3-stop perceptual chromatic LUT generation & field colorization | unit | `python -m pytest tests/test_visualization.py -k test_colormap -q` | ✅ | ✅ green |
| 03-01-02 | 01 | 1 | PHOTO-01 | — | Bicubic upsampling and edge softening | unit | `python -m pytest tests/test_visualization.py -k test_upsampling -q` | ✅ | ✅ green |
| 03-02-01 | 02 | 2 | PHOTO-02 | — | Stress-weighted adaptive alpha blending over video frames | unit | `python -m pytest tests/test_visualization.py -k test_alpha_blending -q` | ✅ | ✅ green |
| 03-02-02 | 02 | 2 | PHOTO-03 | — | Hotspot bloom glow and iso-stress contour lines | unit | `python -m pytest tests/test_visualization.py -k test_hotspot_overlay -q` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/test_visualization.py` — unit tests for colormap, upsampler, alpha blender, and contour bloom renderer

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual aesthetic quality of photoelastic overlay | PHOTO-01, PHOTO-02, PHOTO-03 | Subjective human perception of chromatic smoothness and transparency clarity | Render processed test frames to `data/test_output.jpg` and inspect that crowd members are recognizable under the smooth chromatic fringe |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated (31 of 31 tests green)
