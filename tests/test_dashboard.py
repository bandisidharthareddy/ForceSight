"""Unit tests for ForceSight end-to-end pipeline and dashboard telemetry components."""

import numpy as np
import plotly.graph_objects as go
import pytest

from src.dashboard.components import (
    create_alert_banner_html,
    create_radial_gauge,
    create_risk_badge_html,
    create_time_series_chart,
)
from src.ingestion.video_loader import FrameData
from src.physics.risk_state import RiskLevel, RiskStateResult
from src.pipeline import ForceSightPipeline, PipelineResult


@pytest.fixture
def sample_frame_data() -> FrameData:
    """Creates a sample FrameData instance with valid RGB and downscaled grayscale proxy."""
    h_orig, w_orig = 720, 1280
    raw_rgb = np.full((h_orig, w_orig, 3), 100, dtype=np.uint8)
    # Add a moving blob
    raw_rgb[300:450, 500:700] = [200, 220, 240]

    h_proxy, w_proxy = 360, 640
    gray_proxy = np.full((h_proxy, w_proxy), 100, dtype=np.uint8)
    gray_proxy[150:225, 250:350] = 210

    return FrameData(
        frame_idx=1,
        timestamp_ms=33.3,
        rgb_frame=raw_rgb,
        gray_proxy=gray_proxy,
        fps=30.0,
        total_frames=100,
        is_last_frame=False,
    )


# ============================================================================
# Plan 04-01 Task 1: Pipeline Orchestrator Tests
# ============================================================================


def test_pipeline_end_to_end(sample_frame_data: FrameData):
    """Pipeline processes frame through all 7 stages and outputs complete PipelineResult."""
    pipeline = ForceSightPipeline()
    result = pipeline.process_frame(sample_frame_data)

    assert isinstance(result, PipelineResult)
    assert result.frame_idx == 1
    assert result.timestamp_ms == 33.3
    assert result.blended_frame.shape == (720, 1280, 3)
    assert result.rgba_overlay.shape == (720, 1280, 4)
    assert 0.0 <= result.instantaneous_psi <= 100.0
    assert 0.0 <= result.smoothed_psi <= 100.0
    assert isinstance(result.risk_state, RiskStateResult)
    assert len(result.hotspot_coords) == 2
    assert len(result.hotspot_pixel) == 2


def test_pipeline_reset(sample_frame_data: FrameData):
    """Pipeline reset cleans up previous frame references and state counters."""
    pipeline = ForceSightPipeline()
    _ = pipeline.process_frame(sample_frame_data)
    assert pipeline.tracker.prev_gray is not None

    pipeline.reset()
    assert pipeline.tracker.prev_gray is None
    assert pipeline.risk_machine.current_level == RiskLevel.NOMINAL


# ============================================================================
# Plan 04-01 Task 2: Plotly Components Tests
# ============================================================================


def test_components_radial_gauge():
    """Radial gauge returns a valid Plotly Figure with range 0 to 100 and indicator trace."""
    fig = create_radial_gauge(psi=62.5, risk_level="WARNING")

    assert isinstance(fig, go.Figure)
    assert len(fig.data) == 1
    indicator = fig.data[0]
    assert indicator.type == "indicator"
    assert indicator.value == 62.5
    assert indicator.gauge.axis.range == (0, 100)


def test_components_time_series_chart():
    """Time-series chart returns a valid Plotly Figure with scatter trace and horizontal fences."""
    timestamps = [0.0, 1.0, 2.0, 3.0]
    psi_values = [15.0, 25.0, 55.0, 80.0]
    fig = create_time_series_chart(timestamps, psi_values)

    assert isinstance(fig, go.Figure)
    assert len(fig.data) == 1
    scatter = fig.data[0]
    assert scatter.type == "scatter"
    assert list(scatter.x) == timestamps
    assert list(scatter.y) == psi_values
    # Check that shapes/threshold lines are present
    assert len(fig.layout.shapes) >= 2


def test_components_risk_badge_html():
    """Risk badge HTML contains styled risk level and action."""
    html_nominal = create_risk_badge_html("NOMINAL", "NORMAL_FLOW")
    assert "NOMINAL" in html_nominal
    assert "NORMAL_FLOW" in html_nominal

    html_critical = create_risk_badge_html("CRITICAL", "HALT_INGRESS")
    assert "CRITICAL" in html_critical
    assert "HALT_INGRESS" in html_critical


# ============================================================================
# Plan 04-02 Task 1: Alert Banner Tests
# ============================================================================


def test_alert_banners_content():
    """Alert banners output unambiguous gate-throttling recommendations for all regimes."""
    res_nom = RiskStateResult(
        level=RiskLevel.NOMINAL,
        smoothed_psi=20.0,
        raw_psi=20.0,
        action_recommended="NORMAL_FLOW",
        hold_counter=0,
        in_hysteresis=False,
    )
    banner_nom = create_alert_banner_html(res_nom)
    assert "NOMINAL" in banner_nom
    assert "Standard ingress flow permitted" in banner_nom

    res_warn = RiskStateResult(
        level=RiskLevel.WARNING,
        smoothed_psi=60.0,
        raw_psi=62.0,
        action_recommended="THROTTLE_GATES",
        hold_counter=0,
        in_hysteresis=False,
    )
    banner_warn = create_alert_banner_html(res_warn)
    assert "THROTTLE GATES BY 50%" in banner_warn

    res_crit = RiskStateResult(
        level=RiskLevel.CRITICAL,
        smoothed_psi=88.0,
        raw_psi=90.0,
        action_recommended="HALT_INGRESS",
        hold_counter=0,
        in_hysteresis=False,
    )
    banner_crit = create_alert_banner_html(res_crit)
    assert "HALT INGRESS IMMEDIATELY" in banner_crit
