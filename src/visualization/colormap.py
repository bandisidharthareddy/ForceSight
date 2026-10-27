"""Photoelastic 3-stop chromatic colormap generator and continuous field upsampler."""

from typing import Tuple

import cv2
import numpy as np


class PhotoelasticColormap:
    """Generates continuous 256-level chromatic lookup tables mimicking photoelastic stress fringes.

    Gradient stops:
    - 0% (Nominal): Cool Steel Blue (BGR: 229, 136, 30 / RGB: 30, 136, 229)
    - 50% (Warning): Vivid Amber (BGR: 53, 216, 253 / RGB: 253, 216, 53)
    - 100% (Critical): Deep Crimson (BGR: 47, 47, 211 / RGB: 211, 47, 47)
    """

    def __init__(self) -> None:
        self.stop0_bgr = np.array([229, 136, 30], dtype=np.float32)  # Cool Steel Blue
        self.stop1_bgr = np.array([53, 216, 253], dtype=np.float32)  # Vivid Amber
        self.stop2_bgr = np.array([47, 47, 211], dtype=np.float32)  # Deep Crimson

        self.lut = self._build_lut()

    def _build_lut(self) -> np.ndarray:
        """Construct a 256x1x3 uint8 OpenCV color lookup table with smooth linear interpolation."""
        lut = np.zeros((256, 1, 3), dtype=np.uint8)

        # 0 to 127: Stop 0 to Stop 1 (Nominal to Warning)
        for i in range(128):
            t = float(i) / 127.0
            color = (1.0 - t) * self.stop0_bgr + t * self.stop1_bgr
            lut[i, 0] = np.clip(np.round(color), 0, 255).astype(np.uint8)

        # 128 to 255: Stop 1 to Stop 2 (Warning to Critical)
        for i in range(128, 256):
            t = float(i - 128) / 127.0
            color = (1.0 - t) * self.stop1_bgr + t * self.stop2_bgr
            lut[i, 0] = np.clip(np.round(color), 0, 255).astype(np.uint8)

        return lut

    def apply(self, stress_map: np.ndarray) -> np.ndarray:
        """Map 2D float stress array in [0.0, 100.0] to a 3-channel BGR photoelastic heatmap."""
        if stress_map.ndim != 2:
            raise ValueError(f"Expected 2D stress map, got shape {stress_map.shape}")

        clipped = np.clip(stress_map, 0.0, 100.0)
        indices = np.round(clipped / 100.0 * 255.0).astype(np.uint8)
        color_bgr = cv2.applyColorMap(indices, self.lut)
        return color_bgr

    @staticmethod
    def to_rgb(bgr_image: np.ndarray) -> np.ndarray:
        """Convert BGR image to RGB format for web UI / Matplotlib display."""
        return cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)


def upsample_stress_field(
    stress_grid: np.ndarray,
    target_shape: Tuple[int, int],
    blur_ksize: int = 15,
) -> np.ndarray:
    """Upsample coarse block stress grid to target frame resolution with edge softening.

    Args:
        stress_grid: Coarse 2D stress array (e.g. 18x32) with values in [0.0, 100.0].
        target_shape: Desired (target_height, target_width) tuple.
        blur_ksize: Kernel size for post-interpolation Gaussian softening (must be odd).

    Returns:
        Continuous upsampled 2D float32 stress surface of shape target_shape bounded in [0.0, 100.0].
    """
    target_h, target_w = target_shape[0], target_shape[1]
    if target_h <= 0 or target_w <= 0:
        raise ValueError(f"Invalid target shape ({target_h}, {target_w})")

    # Bicubic interpolation
    upscaled = cv2.resize(
        stress_grid.astype(np.float32),
        (target_w, target_h),
        interpolation=cv2.INTER_CUBIC,
    )

    # Edge-softening Gaussian filter to remove blockiness
    if blur_ksize > 1:
        if blur_ksize % 2 == 0:
            blur_ksize += 1
        upscaled = cv2.GaussianBlur(upscaled, (blur_ksize, blur_ksize), 0)

    return np.clip(upscaled, 0.0, 100.0).astype(np.float32)
