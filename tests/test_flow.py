"""Unit and integration tests for Farneback optical flow and turbulence analysis."""

import cv2
import numpy as np
import pytest

from src.ingestion.video_loader import VideoLoader
from src.vision.motion_stats import FlowResult, TurbulenceExtractor
from src.vision.tracker import FlowVectors, OpticalFlowTracker


def test_zero_motion() -> None:
    """Verify that identical static frames produce near-zero displacement magnitude."""
    tracker = OpticalFlowTracker()
    frame = np.full((360, 640), 128, dtype=np.uint8)

    # First frame initializes baseline
    res1 = tracker.process_frame(frame)
    assert res1 is None

    # Second identical frame
    res2 = tracker.process_frame(frame)
    assert res2 is not None
    assert isinstance(res2, FlowVectors)
    assert res2.magnitude.shape == (360, 640)
    assert np.max(res2.magnitude) < 0.1


def test_farneback_directional_flow() -> None:
    """Verify that a translating textured patch produces directional flow vectors matching motion."""
    tracker = OpticalFlowTracker()

    f1 = np.zeros((360, 640), dtype=np.uint8)
    f2 = np.zeros((360, 640), dtype=np.uint8)

    # Create a textured patch moving 10 pixels to the right
    np.random.seed(42)
    textured_patch = np.random.randint(40, 250, (80, 80), dtype=np.uint8)
    f1[140:220, 200:280] = textured_patch
    f2[140:220, 210:290] = textured_patch

    tracker.process_frame(f1)
    flow = tracker.process_frame(f2)
    assert flow is not None

    # In the region of the moving patch, horizontal velocity u should be ~10px
    patch_u = flow.u[140:220, 210:280]
    patch_v = flow.v[140:220, 210:280]
    assert np.mean(patch_u) > 5.0  # Strong rightward displacement matching 10px translation
    assert abs(np.mean(patch_v)) < 1.0  # Negligible vertical movement


def test_turbulence_and_stagnation() -> None:
    """Verify that chaotic velocity variance exceeds smooth laminar translation."""
    extractor = TurbulenceExtractor(grid_size=20, motion_threshold=0.2)

    # 1. Create laminar flow field (uniform rightward motion everywhere)
    u_laminar = np.full((360, 640), 3.0, dtype=np.float32)
    v_laminar = np.zeros((360, 640), dtype=np.float32)
    mag_laminar, ang_laminar = cv2.cartToPolar(u_laminar, v_laminar)
    laminar_flow = FlowVectors(u=u_laminar, v=v_laminar, magnitude=mag_laminar, angle=ang_laminar)

    laminar_result = extractor.process(laminar_flow)
    assert isinstance(laminar_result, FlowResult)
    # Uniform translation has near-zero internal variance per grid cell
    assert np.max(laminar_result.grid_variance) < 0.01

    # 2. Create turbulent flow field (chaotic motion with high local variance)
    np.random.seed(42)
    u_turbulent = np.random.uniform(-4.0, 4.0, (360, 640)).astype(np.float32)
    v_turbulent = np.random.uniform(-4.0, 4.0, (360, 640)).astype(np.float32)
    mag_turbulent, ang_turbulent = cv2.cartToPolar(u_turbulent, v_turbulent)
    turbulent_flow = FlowVectors(u=u_turbulent, v=v_turbulent, magnitude=mag_turbulent, angle=ang_turbulent)

    turbulent_result = extractor.process(turbulent_flow)
    assert np.mean(turbulent_result.grid_variance) > 2.0  # Significant velocity variance


def test_pipeline_integration(dummy_video_file: str) -> None:
    """Verify end-to-end integration: VideoLoader -> OpticalFlowTracker -> TurbulenceExtractor."""
    loader = VideoLoader(dummy_video_file)
    tracker = OpticalFlowTracker()
    extractor = TurbulenceExtractor(grid_size=20)

    results = []
    with loader:
        for frame in loader.stream_frames():
            flow = tracker.process_frame(frame.gray_proxy)
            if flow is not None:
                stats = extractor.process(flow)
                results.append(stats)
            if len(results) >= 10:
                break

    assert len(results) == 10
    for res in results:
        assert res.grid_variance.shape == (18, 32)
        assert 0.0 <= res.stagnation_score <= 1.0
        assert 0.0 <= res.active_cell_ratio <= 1.0
