"""Photoelastic chromatic overlay rendering, adaptive alpha blending, and hotspot bloom contours."""

from dataclasses import dataclass
from typing import Optional, Tuple

import cv2
import numpy as np

from src.config import OverlayConfig
from src.visualization.colormap import PhotoelasticColormap, upsample_stress_field


@dataclass
class OverlayResult:
    """Rendered visual frames and localized hotspot coordinates."""

    blended_frame: np.ndarray  # 3-channel BGR uint8 image blended with photoelastic fringes
    rgba_overlay: np.ndarray  # 4-channel RGBA uint8 transparent overlay for Web / Streamlit canvas
    hotspot_pixel: Tuple[int, int]  # (x, y) coordinates of primary stress peak in target frame
    peak_psi: float  # Evaluated peak stress index


class PhotoelasticOverlayRenderer:
    """Renders photoelastic stress fringes over raw video footage with adaptive alpha blending.

    Provides high-contrast visual early warning in surge zones while preserving scene and
    facial recognition in nominal zones through stress-weighted alpha transparency.
    """

    def __init__(
        self,
        config: Optional[OverlayConfig] = None,
        colormap: Optional[PhotoelasticColormap] = None,
    ) -> None:
        self.config = config or OverlayConfig()
        self.colormap = colormap or PhotoelasticColormap()

    def blend_frame(
        self,
        base_frame: np.ndarray,
        stress_map: np.ndarray,
        hotspot_coords: Optional[Tuple[int, int]] = None,
        peak_psi: float = 0.0,
    ) -> OverlayResult:
        """Blend continuous photoelastic fringes and hotspot contours over raw crowd video.

        Args:
            base_frame: Native BGR video frame of shape (H, W, 3).
            stress_map: 2D float stress array in [0.0, 100.0] (coarse grid or proxy resolution).
            hotspot_coords: Optional (row, col) grid coordinates of maximum stress concentration.
            peak_psi: Instantaneous or smoothed Peak Stress Index (0–100).

        Returns:
            OverlayResult containing blended BGR frame, standalone RGBA overlay, and hotspot pixels.
        """
        if base_frame.ndim != 3 or base_frame.shape[2] != 3:
            raise ValueError(f"Expected 3-channel BGR base frame, got shape {base_frame.shape}")

        h, w = base_frame.shape[:2]

        # 1. Continuous Field Upsampling & Colorization
        # Performance optimization: if base_frame is high resolution (> 640px wide),
        # upsample stress to 360x640 proxy first for softening and colormapping,
        # then scale the resulting uint8 colored heatmap to (H, W).
        if w > 640:
            proxy_h, proxy_w = 360, 640
            upsampled_stress = upsample_stress_field(
                stress_map,
                target_shape=(proxy_h, proxy_w),
                blur_ksize=self.config.upsample_blur_ksize,
            )
            color_proxy = self.colormap.apply(upsampled_stress)  # (360, 640, 3) BGR uint8
            color_heatmap = cv2.resize(color_proxy, (w, h), interpolation=cv2.INTER_LINEAR)
            stress_full = cv2.resize(upsampled_stress, (w, h), interpolation=cv2.INTER_LINEAR)
        else:
            if stress_map.shape[:2] != (h, w):
                upsampled_stress = upsample_stress_field(
                    stress_map,
                    target_shape=(h, w),
                    blur_ksize=self.config.upsample_blur_ksize,
                )
            else:
                upsampled_stress = np.clip(stress_map, 0.0, 100.0).astype(np.float32)
            color_heatmap = self.colormap.apply(upsampled_stress)
            stress_full = upsampled_stress

        # 2. Stress-Weighted Adaptive Alpha Map
        # alpha(S) = alpha_min + (alpha_max - alpha_min) * (S / 100)^p
        norm_stress = np.clip(stress_full / 100.0, 0.0, 1.0)
        power_term = np.power(norm_stress, self.config.alpha_power)
        alpha_map = self.config.alpha_min + (self.config.alpha_max - self.config.alpha_min) * power_term
        alpha_map = np.clip(alpha_map, self.config.alpha_min, self.config.alpha_max).astype(np.float32)

        # 3. Vectorized Memory-Efficient Alpha Blending
        alpha_broadcast = alpha_map[:, :, None]  # Shape (H, W, 1) broadcast across channels
        blended = (
            base_frame.astype(np.float32) * (1.0 - alpha_broadcast)
            + color_heatmap.astype(np.float32) * alpha_broadcast
        )

        # 4. Hotspot Radial Bloom & Iso-Stress Contours
        grid_rows, grid_cols = stress_map.shape[:2]
        if hotspot_coords is not None and grid_rows > 0 and grid_cols > 0:
            cx = int((hotspot_coords[1] + 0.5) * (w / float(grid_cols)))
            cy = int((hotspot_coords[0] + 0.5) * (h / float(grid_rows)))
            cx = int(np.clip(cx, 0, w - 1))
            cy = int(np.clip(cy, 0, h - 1))
            hotspot_pixel = (cx, cy)
        else:
            hotspot_pixel = (w // 2, h // 2)

        if peak_psi >= 50.0 and hotspot_coords is not None:
            # 4a. Concentric Iso-Stress Contour Rings
            for ratio in self.config.contour_levels:
                thresh_val = peak_psi * ratio
                if thresh_val > 10.0:
                    mask = (stress_full >= thresh_val).astype(np.uint8) * 255
                    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    if contours:
                        contour_color = (255, 255, 255) if ratio >= 0.75 else (200, 240, 255)
                        cv2.polylines(blended, contours, isClosed=True, color=contour_color, thickness=1, lineType=cv2.LINE_AA)

            # 4b. Luminous Radial Bloom Glow around primary hotspot
            r_bloom = self.config.hotspot_bloom_radius
            y1 = max(0, cy - r_bloom)
            y2 = min(h, cy + r_bloom)
            x1 = max(0, cx - r_bloom)
            x2 = min(w, cx + r_bloom)

            if y2 > y1 and x2 > x1:
                yy, xx = np.ogrid[y1:y2, x1:x2]
                dist_sq = (xx - cx) ** 2 + (yy - cy) ** 2
                sigma_sq = (r_bloom / 2.0) ** 2
                bloom_kernel = np.exp(-dist_sq / (2.0 * max(1.0, sigma_sq))) * self.config.hotspot_bloom_intensity

                if peak_psi >= 75.0:
                    bloom_bgr = np.array([47, 47, 211], dtype=np.float32)  # Deep Crimson
                else:
                    bloom_bgr = np.array([53, 216, 253], dtype=np.float32)  # Vivid Amber

                bloom_patch = bloom_bgr * bloom_kernel[:, :, np.newaxis]
                blended[y1:y2, x1:x2] += bloom_patch

        # Final bounds clamp for blended frame
        blended_uint8 = np.clip(np.round(blended), 0, 255).astype(np.uint8)

        # 5. Generate Standalone 4-channel RGBA Overlay
        rgb_heatmap = self.colormap.to_rgb(color_heatmap)
        alpha_channel = np.clip(np.round(alpha_map * 255.0), 0, 255).astype(np.uint8)
        rgba_overlay = np.dstack([rgb_heatmap, alpha_channel])

        return OverlayResult(
            blended_frame=blended_uint8,
            rgba_overlay=rgba_overlay,
            hotspot_pixel=hotspot_pixel,
            peak_psi=peak_psi,
        )
