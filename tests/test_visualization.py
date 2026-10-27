"""Unit tests for photoelastic colormap, upsampler, and overlay rendering."""

import numpy as np
import pytest

from src.config import OverlayConfig
from src.visualization.colormap import PhotoelasticColormap, upsample_stress_field


@pytest.fixture
def dummy_stress_grid() -> np.ndarray:
    """Creates a sample 18x32 block stress grid with a central bottleneck hotspot."""
    grid = np.zeros((18, 32), dtype=np.float32)
    # Background nominal stress
    grid[:] = 10.0
    # Central bottleneck compression hotspot
    grid[6:12, 12:20] = 85.0
    return grid


# ============================================================================
# Plan 03-01 Task 1: Colormap Tests
# ============================================================================


def test_colormap_stops():
    """Verify that LUT index 0 maps to Cool Blue, 127 to Amber, and 255 to Crimson."""
    cmap = PhotoelasticColormap()
    lut = cmap.lut.squeeze()  # (256, 3) BGR

    # Index 0: Cool Blue [229, 136, 30]
    np.testing.assert_allclose(lut[0], [229, 136, 30], atol=1)

    # Index 127: Vivid Amber [53, 216, 253]
    np.testing.assert_allclose(lut[127], [53, 216, 253], atol=1)

    # Index 255: Deep Crimson [47, 47, 211]
    np.testing.assert_allclose(lut[255], [47, 47, 211], atol=1)


def test_colormap_smoothness():
    """Adjacent indices in the LUT must transition smoothly without sharp discontinuities."""
    cmap = PhotoelasticColormap()
    lut = cmap.lut.squeeze().astype(np.float32)  # (256, 3)

    diffs = np.abs(np.diff(lut, axis=0))
    # Step difference between adjacent steps should be <= 3.0 in all channels
    assert np.max(diffs) <= 3.0


def test_colormap_apply():
    """Applying colormap to 2D stress array returns valid (H, W, 3) BGR image."""
    cmap = PhotoelasticColormap()
    test_stress = np.array([[0.0, 50.0], [75.0, 100.0]], dtype=np.float32)
    bgr = cmap.apply(test_stress)

    assert bgr.shape == (2, 2, 3)
    assert bgr.dtype == np.uint8
    # Top-left (0.0) should be Cool Blue (high B, low R)
    assert bgr[0, 0, 0] > 200  # Blue channel
    # Bottom-right (100.0) should be Deep Crimson (high R, low B)
    assert bgr[1, 1, 2] > 200  # Red channel


# ============================================================================
# Plan 03-01 Task 2: Field Upsampler Tests
# ============================================================================


def test_upsampling_dimensions(dummy_stress_grid: np.ndarray):
    """Upsampling an 18x32 grid to 360x640 produces exact matching float32 dimensions."""
    upscaled = upsample_stress_field(dummy_stress_grid, target_shape=(360, 640))

    assert upscaled.shape == (360, 640)
    assert upscaled.dtype == np.float32


def test_upsampling_preserves_bounds(dummy_stress_grid: np.ndarray):
    """Upsampled field must strictly remain in [0.0, 100.0]."""
    # Test with boundary conditions
    dummy_stress_grid[0, 0] = 0.0
    dummy_stress_grid[17, 31] = 100.0
    upscaled = upsample_stress_field(dummy_stress_grid, target_shape=(360, 640))

    assert np.all(upscaled >= 0.0)
    assert np.all(upscaled <= 100.0)


def test_upsampling_softens_gradients(dummy_stress_grid: np.ndarray):
    """Bicubic upsampling with Gaussian filter must eliminate sharp stepped block edges."""
    upscaled = upsample_stress_field(dummy_stress_grid, target_shape=(360, 640), blur_ksize=15)

    # Gradient along rows should be smooth, without huge single-pixel jumps
    grad_y = np.abs(np.diff(upscaled, axis=0))
    # Max single-pixel gradient step across 360 pixels should be gentle (< 5.0)
    assert np.max(grad_y) < 5.0


# ============================================================================
# Plan 03-02: Overlay Renderer, Adaptive Alpha, and Hotspot Bloom Tests
# ============================================================================

from src.visualization.overlay import OverlayResult, PhotoelasticOverlayRenderer


@pytest.fixture
def dummy_base_frame() -> np.ndarray:
    """Creates a sample 360x640 3-channel BGR base frame with a grey background."""
    # Grey background [128, 128, 128]
    frame = np.full((360, 640, 3), 128, dtype=np.uint8)
    # Add a mock person silhouette in the corner
    frame[50:150, 50:100] = [50, 50, 50]
    return frame


def test_alpha_blending_transparency(dummy_base_frame: np.ndarray):
    """Low stress uses minimal alpha (preserves base frame); high stress applies strong tint."""
    renderer = PhotoelasticOverlayRenderer(
        config=OverlayConfig(alpha_min=0.15, alpha_max=0.65, alpha_power=1.0)
    )

    # Low stress everywhere (PSI = 5.0)
    low_stress = np.full((18, 32), 5.0, dtype=np.float32)
    res_low = renderer.blend_frame(dummy_base_frame, low_stress, peak_psi=5.0)

    # High stress everywhere (PSI = 95.0)
    high_stress = np.full((18, 32), 95.0, dtype=np.float32)
    res_high = renderer.blend_frame(dummy_base_frame, high_stress, peak_psi=95.0)

    # The background was 128. Under low stress, alpha ~0.175, color is cool blue [229, 136, 30].
    # Difference from base frame should be much smaller than under high stress.
    diff_low = np.mean(np.abs(res_low.blended_frame.astype(float) - dummy_base_frame.astype(float)))
    diff_high = np.mean(np.abs(res_high.blended_frame.astype(float) - dummy_base_frame.astype(float)))

    assert diff_high > diff_low * 2.5


def test_rgba_overlay_dimensions(dummy_base_frame: np.ndarray, dummy_stress_grid: np.ndarray):
    """Standalone RGBA overlay must have 4 channels and match base frame dimensions."""
    renderer = PhotoelasticOverlayRenderer()
    res = renderer.blend_frame(dummy_base_frame, dummy_stress_grid, peak_psi=85.0)

    assert isinstance(res, OverlayResult)
    assert res.rgba_overlay.shape == (360, 640, 4)
    assert res.rgba_overlay.dtype == np.uint8
    # Alpha channel (res.rgba_overlay[:, :, 3]) should be between min and max alpha mapped to 255
    alpha_chan = res.rgba_overlay[:, :, 3]
    assert np.min(alpha_chan) >= int(0.14 * 255)
    assert np.max(alpha_chan) <= int(0.66 * 255)


def test_hotspot_overlay_rendering(dummy_base_frame: np.ndarray, dummy_stress_grid: np.ndarray):
    """Hotspot with peak_psi >= 75 renders radial bloom and iso-stress contours."""
    renderer = PhotoelasticOverlayRenderer()
    hotspot_grid_coord = (9, 16)  # center cell

    # Critical surge
    res_critical = renderer.blend_frame(
        dummy_base_frame,
        dummy_stress_grid,
        hotspot_coords=hotspot_grid_coord,
        peak_psi=85.0,
    )

    # Nominal crowd (peak_psi = 15.0)
    res_nominal = renderer.blend_frame(
        dummy_base_frame,
        dummy_stress_grid,
        hotspot_coords=hotspot_grid_coord,
        peak_psi=15.0,
    )

    # Hotspot pixel coordinates should be scaled to frame center
    expected_x = int((16 + 0.5) * (640 / 32))  # 330
    expected_y = int((9 + 0.5) * (360 / 18))  # 190
    assert abs(res_critical.hotspot_pixel[0] - expected_x) <= 2
    assert abs(res_critical.hotspot_pixel[1] - expected_y) <= 2

    # Under critical stress, bloom adds bright warm colors at the center
    center_y, center_x = res_critical.hotspot_pixel[1], res_critical.hotspot_pixel[0]
    critical_center_val = res_critical.blended_frame[center_y, center_x, 2]  # Red channel
    nominal_center_val = res_nominal.blended_frame[center_y, center_x, 2]
    assert critical_center_val > nominal_center_val


def test_pipeline_visual_render(dummy_base_frame: np.ndarray):
    """End-to-end integration test from frame to blended overlay."""
    renderer = PhotoelasticOverlayRenderer()
    stress_map = np.random.uniform(10.0, 90.0, (18, 32)).astype(np.float32)

    res = renderer.blend_frame(
        dummy_base_frame,
        stress_map,
        hotspot_coords=(5, 10),
        peak_psi=78.5,
    )

    assert res.blended_frame.shape == dummy_base_frame.shape
    assert res.blended_frame.dtype == np.uint8
    assert res.peak_psi == 78.5
    assert not np.array_equal(res.blended_frame, dummy_base_frame)
