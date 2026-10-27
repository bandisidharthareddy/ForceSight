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
