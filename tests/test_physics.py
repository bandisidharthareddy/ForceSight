"""Unit tests for spatial density estimation and coupled Helbing stress engine."""

import numpy as np
import pytest

from src.config import DensityConfig, StressConfig
from src.physics.density import DensityResult, SpatialDensityEstimator
from src.physics.stress_engine import PhotoelasticStressEngine, StressResult
from src.vision.motion_stats import FlowResult
from src.vision.tracker import FlowVectors


@pytest.fixture
def blank_frame() -> np.ndarray:
    """Creates a blank grayscale 360x640 proxy frame."""
    return np.zeros((360, 640), dtype=np.uint8)


@pytest.fixture
def textured_frame() -> np.ndarray:
    """Creates a 360x640 frame with high-frequency contours in the central region."""
    frame = np.zeros((360, 640), dtype=np.uint8)
    # Simulate a dense crowd in the center (100:260, 200:440)
    rng = np.random.default_rng(42)
    noise_patch = rng.integers(0, 256, (160, 240), dtype=np.uint8)
    frame[100:260, 200:440] = noise_patch
    return frame


@pytest.fixture
def dummy_flow() -> FlowVectors:
    """Creates a dummy 360x640 FlowVectors instance."""
    h, w = 360, 640
    u = np.zeros((h, w), dtype=np.float32)
    v = np.zeros((h, w), dtype=np.float32)
    mag = np.zeros((h, w), dtype=np.float32)
    ang = np.zeros((h, w), dtype=np.float32)
    return FlowVectors(u=u, v=v, magnitude=mag, angle=ang)


# ============================================================================
# Plan 02-01 Task 1: Density Estimator Tests
# ============================================================================


def test_density_blank_frame(blank_frame: np.ndarray, dummy_flow: FlowVectors):
    """Uniform black frame should produce near-zero edge density."""
    estimator = SpatialDensityEstimator()
    res = estimator.estimate(blank_frame, dummy_flow)

    assert isinstance(res, DensityResult)
    assert res.density_map.shape == (18, 32)  # 360/20, 640/20
    assert res.mean_density == pytest.approx(0.0, abs=1e-3)
    assert res.peak_density == pytest.approx(0.0, abs=1e-3)


def test_density_textured_patch(textured_frame: np.ndarray, dummy_flow: FlowVectors):
    """High-contrast textured region should produce significantly elevated density."""
    estimator = SpatialDensityEstimator()
    res = estimator.estimate(textured_frame, dummy_flow)

    assert res.peak_density > 0.6  # High density in noise patch
    assert res.mean_density > 0.05
    # Center grid cells (rows 5-13, cols 10-22) should have much higher density than borders
    center_density = res.density_map[5:13, 10:22]
    border_density = res.density_map[0:2, 0:5]
    assert np.mean(center_density) > np.mean(border_density) + 0.3


def test_density_bounds(textured_frame: np.ndarray, dummy_flow: FlowVectors):
    """All density values must remain strictly bounded in [0.0, 1.0]."""
    # Create extreme flow to test flow occupancy component
    dummy_flow.magnitude[:] = 50.0
    estimator = SpatialDensityEstimator()
    res = estimator.estimate(textured_frame, dummy_flow)

    assert np.all(res.density_map >= 0.0)
    assert np.all(res.density_map <= 1.0)
    assert 0.0 <= res.mean_density <= 1.0
    assert 0.0 <= res.peak_density <= 1.0


# ============================================================================
# Plan 02-01 Task 2: Coupled Helbing Stress Surface & PSI Tests
# ============================================================================


def test_stress_formula_zero_inputs(dummy_flow: FlowVectors):
    """Zero density and zero turbulence must yield zero PSI."""
    grid_shape = (18, 32)
    zero_density = DensityResult(
        density_map=np.zeros(grid_shape, dtype=np.float32),
        mean_density=0.0,
        peak_density=0.0,
    )
    zero_flow = FlowResult(
        flow=dummy_flow,
        grid_variance=np.zeros(grid_shape, dtype=np.float32),
        avg_speed=0.0,
        stagnation_score=0.0,
        active_cell_ratio=0.0,
    )

    engine = PhotoelasticStressEngine()
    result = engine.compute_stress(zero_density, zero_flow)

    assert isinstance(result, StressResult)
    assert result.stress_map.shape == grid_shape
    assert result.instantaneous_psi == pytest.approx(0.0, abs=1e-3)
    assert result.mean_stress == pytest.approx(0.0, abs=1e-3)


def test_stress_formula_max_inputs(dummy_flow: FlowVectors):
    """Max density and maximum velocity variance must yield PSI approaching 100."""
    grid_shape = (18, 32)
    max_density = DensityResult(
        density_map=np.ones(grid_shape, dtype=np.float32),
        mean_density=1.0,
        peak_density=1.0,
    )
    # Variance at or above max_expected_variance (15.0)
    max_flow = FlowResult(
        flow=dummy_flow,
        grid_variance=np.full(grid_shape, 25.0, dtype=np.float32),
        avg_speed=10.0,
        stagnation_score=1.0,
        active_cell_ratio=1.0,
    )

    engine = PhotoelasticStressEngine()
    result = engine.compute_stress(max_density, max_flow)

    assert result.instantaneous_psi >= 95.0
    assert result.mean_stress >= 95.0


def test_stress_formula_bounds(textured_frame: np.ndarray, dummy_flow: FlowVectors):
    """Stress field and PSI must be strictly bounded in [0.0, 100.0] even under extreme values."""
    grid_shape = (18, 32)
    density = DensityResult(
        density_map=np.full(grid_shape, 2.5, dtype=np.float32),  # intentionally elevated
        mean_density=2.5,
        peak_density=2.5,
    )
    flow = FlowResult(
        flow=dummy_flow,
        grid_variance=np.full(grid_shape, 500.0, dtype=np.float32),
        avg_speed=50.0,
        stagnation_score=2.0,
        active_cell_ratio=1.0,
    )

    engine = PhotoelasticStressEngine(config=StressConfig(scale_factor=2.0))
    result = engine.compute_stress(density, flow)

    assert np.all(result.stress_map >= 0.0)
    assert np.all(result.stress_map <= 100.0)
    assert 0.0 <= result.instantaneous_psi <= 100.0
    assert 0.0 <= result.mean_stress <= 100.0


def test_stress_stagnation_elevates_packed_crowd(dummy_flow: FlowVectors):
    """Dense packed crowd with zero speed variance but high stagnation divergence maintains elevated stress."""
    grid_shape = (18, 32)
    dense_pack = DensityResult(
        density_map=np.full(grid_shape, 0.8, dtype=np.float32),
        mean_density=0.8,
        peak_density=0.8,
    )
    # Crowd has stopped moving (var=0) but high stagnation score
    stagnant_flow = FlowResult(
        flow=dummy_flow,
        grid_variance=np.zeros(grid_shape, dtype=np.float32),
        avg_speed=0.0,
        stagnation_score=0.9,
        active_cell_ratio=0.0,
    )

    engine = PhotoelasticStressEngine()
    result = engine.compute_stress(dense_pack, stagnant_flow)

    # w_density (30) * 0.8 + w_stagnation (10) * 0.9 * 0.8 = 24 + 7.2 = 31.2
    assert result.instantaneous_psi >= 30.0


# ============================================================================
# Plan 02-02 Task 1 & 2: Asymmetric EMA and Hysteresis State Machine Tests
# ============================================================================

from src.config import RiskConfig, SmoothingConfig
from src.physics.risk_state import AsymmetricEMA, RiskLevel, RiskStateMachine, RiskStateResult


def test_asymmetric_ema_attack_vs_decay():
    """EMA must rise rapidly (alpha=0.35) and cool down slowly (alpha=0.10)."""
    ema = AsymmetricEMA(SmoothingConfig(alpha_rise=0.35, alpha_fall=0.10))

    # Initial state
    assert ema.update(0.0) == 0.0

    # Step up from 0 to 100: fast attack
    # After 5 steps of 100 with alpha=0.35:
    # step 1: 35.0
    # step 2: 0.35*100 + 0.65*35 = 57.75
    # step 3: 0.35*100 + 0.65*57.75 = 72.54
    # step 4: 82.15
    # step 5: 88.40
    val = 0.0
    for _ in range(5):
        val = ema.update(100.0)
    assert val > 80.0, f"Expected fast attack > 80.0 within 5 steps, got {val}"

    # Now step down to 0: slow decay
    # With alpha=0.10, decay is much slower (1 - 0.10)^5 = 0.59 (still ~50+)
    for _ in range(5):
        val = ema.update(0.0)
    assert val > 45.0, f"Expected slow decay to hold > 45.0 after 5 steps, got {val}"

    # Even after 10 steps, should still be > 25.0
    for _ in range(5):
        val = ema.update(0.0)
    assert val > 25.0, f"Expected slow decay to hold > 25.0 after 10 steps, got {val}"


def test_asymmetric_ema_map_smoothing():
    """EMA map smoothing must preserve 2D shapes and smooth arrays asymmetrically."""
    ema = AsymmetricEMA()
    initial_map = np.zeros((10, 10), dtype=np.float32)
    s1 = ema.update_map(initial_map)
    assert s1.shape == (10, 10)
    assert np.all(s1 == 0.0)

    target_map = np.full((10, 10), 100.0, dtype=np.float32)
    s2 = ema.update_map(target_map)
    # Fast attack should bring it to 35.0
    assert np.allclose(s2, 35.0, atol=1e-3)


def test_hysteresis_immediate_escalation():
    """Jumping PSI above thresholds must immediately escalate without delay."""
    sm = RiskStateMachine()

    # Nominal baseline
    res = sm.process(10.0)
    assert res.level == RiskLevel.NOMINAL
    assert res.action_recommended == "NORMAL_FLOW"

    # Sudden surge to 80 (smoothed will be 0.35*80 + 0.65*10 = 34.5 on first step, then climbs)
    # Let's push high enough so smoothed exceeds 50 then 75
    for _ in range(4):
        res = sm.process(95.0)

    assert res.smoothed_psi >= 75.0
    assert res.level == RiskLevel.CRITICAL
    assert res.action_recommended == "HALT_INGRESS"


def test_hysteresis_debouncing_prevents_premature_deescalation():
    """State machine must not drop from CRITICAL to WARNING without sustained recovery."""
    sm = RiskStateMachine(
        risk_config=RiskConfig(
            warning_threshold=50.0,
            critical_threshold=75.0,
            hysteresis_buffer=5.0,
            deescalation_frames=15,
        ),
        smoothing_config=SmoothingConfig(alpha_rise=1.0, alpha_fall=1.0),  # passthrough for exact testing
    )

    # Force into CRITICAL
    res = sm.process(80.0)
    assert res.level == RiskLevel.CRITICAL

    # PSI drops to 68.0 (below 70.0 recovery threshold) for 10 frames
    for _ in range(10):
        res = sm.process(68.0)
        assert res.level == RiskLevel.CRITICAL
        assert res.in_hysteresis is True
        assert res.hold_counter > 0

    # A single spike back above 70.0 resets the counter
    res = sm.process(72.0)
    assert res.level == RiskLevel.CRITICAL
    assert res.hold_counter == 0

    # Now drop below 70.0 for 15 consecutive frames
    for _ in range(15):
        res = sm.process(68.0)

    assert res.level == RiskLevel.WARNING
    assert res.action_recommended == "THROTTLE_GATES"


def test_hysteresis_warning_to_nominal_buffer():
    """Oscillation in buffer range [45.0, 50.0) keeps WARNING until sustained drop below 45.0."""
    sm = RiskStateMachine(
        risk_config=RiskConfig(
            warning_threshold=50.0,
            critical_threshold=75.0,
            hysteresis_buffer=5.0,
            deescalation_frames=15,
        ),
        smoothing_config=SmoothingConfig(alpha_rise=1.0, alpha_fall=1.0),
    )

    # Enter Warning
    res = sm.process(55.0)
    assert res.level == RiskLevel.WARNING

    # Hover at 47.0 (below warning 50.0, but NOT below recovery 45.0)
    for _ in range(30):
        res = sm.process(47.0)
        assert res.level == RiskLevel.WARNING
        assert res.in_hysteresis is True
        assert res.hold_counter == 0  # not below recovery target

    # Drop to 40.0 (below 45.0 recovery target) for 15 frames
    for _ in range(15):
        res = sm.process(40.0)

    assert res.level == RiskLevel.NOMINAL
    assert res.action_recommended == "NORMAL_FLOW"
