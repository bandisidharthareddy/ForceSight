---
phase: "1"
slug: "video-ingestion-dense-optical-flow-core"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-27"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | `pytest.ini` |
| **Quick run command** | `pytest tests/test_ingestion.py tests/test_flow.py -q` |
| **Full suite command** | `pytest tests/ -q` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest tests/test_ingestion.py tests/test_flow.py -q`
- **After every plan wave:** Run `pytest tests/ -q`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INGEST-01 | — | Graceful error on invalid video path | unit | `pytest tests/test_ingestion.py -k test_invalid_path -q` | ✅ | ✅ green |
| 01-01-02 | 01 | 1 | INGEST-01, INGEST-02 | — | Frame extraction, looping, and proxy downscaling | unit | `pytest tests/test_ingestion.py -k test_frame_stream -q` | ✅ | ✅ green |
| 01-01-03 | 01 | 1 | INGEST-01 | — | Synthetic crowd video generation | integration | `pytest tests/test_synthetic_generator.py -q` | ✅ | ✅ green |
| 01-02-01 | 02 | 1 | FLOW-01 | — | Farnebäck optical flow vector extraction | unit | `pytest tests/test_flow.py -k test_farneback_flow -q` | ✅ | ✅ green |
| 01-02-02 | 02 | 1 | FLOW-02, FLOW-03 | — | Spatial density and velocity variance grid calculation | unit | `pytest tests/test_flow.py -k test_turbulence_and_stagnation -q` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/conftest.py` — shared fixtures creating dummy test frames and video clips
- [ ] `tests/test_ingestion.py` — unit tests for `VideoLoader` and `FrameData`
- [ ] `tests/test_flow.py` — unit tests for `OpticalFlowTracker` and turbulence extraction
- [ ] `tests/test_synthetic_generator.py` — tests for `generate_synthetic_crowd.py`
- [ ] `pytest.ini` — test discovery configuration

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual smoothness of playback | INGEST-02 | Subjective visual frame rate validation | Run `python -m src.ingestion.video_loader` and verify video plays smoothly in a preview window without tearing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
