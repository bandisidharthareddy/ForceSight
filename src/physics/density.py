"""Spatial crowd density estimation from edge-gradient energy and flow occupancy."""

from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

from src.config import DensityConfig
from src.vision.tracker import FlowVectors


@dataclass
class DensityResult:
    """Estimated crowd density metrics and 2D spatial distribution."""

    density_map: np.ndarray  # Shape (grid_rows, grid_cols): normalized density [0.0, 1.0]
    mean_density: float  # Mean density across all grid cells [0.0, 1.0]
    peak_density: float  # Maximum density observed in any grid cell [0.0, 1.0]


class SpatialDensityEstimator:
    """Estimates localized crowd density by combining edge contours and motion occupancy."""

    def __init__(self, config: Optional[DensityConfig] = None) -> None:
        self.config = config or DensityConfig()

    def estimate(
        self,
        gray_proxy: np.ndarray,
        flow_vectors: Optional[FlowVectors] = None,
    ) -> DensityResult:
        """Estimate 2D crowd density grid from grayscale frame and optional optical flow vectors.

        Args:
            gray_proxy: Grayscale image proxy of shape (H, W).
            flow_vectors: Optional dense optical flow vectors matching (H, W).

        Returns:
            DensityResult containing normalized grid density map, mean, and peak.
        """
        if gray_proxy.ndim != 2:
            raise ValueError(f"Expected 2D grayscale image, got shape {gray_proxy.shape}")

        h, w = gray_proxy.shape
        block_size = self.config.block_size
        grid_rows = h // block_size
        grid_cols = w // block_size

        if grid_rows == 0 or grid_cols == 0:
            raise ValueError(f"Image dimensions ({h}, {w}) too small for block size {block_size}")

        # 1. Edge Contour Extraction
        ksize = self.config.blur_ksize
        if ksize > 1 and ksize % 2 == 1:
            blurred = cv2.GaussianBlur(gray_proxy, (ksize, ksize), 0)
        else:
            blurred = gray_proxy

        edges = cv2.Canny(
            blurred,
            threshold1=self.config.edge_threshold_low,
            threshold2=self.config.edge_threshold_high,
        )

        # 2. Vectorized Block Pooling
        crop_h = grid_rows * block_size
        crop_w = grid_cols * block_size
        cropped_edges = edges[:crop_h, :crop_w]

        # Reshape to (grid_rows, grid_cols, block_size * block_size)
        edge_blocks = cropped_edges.reshape(grid_rows, block_size, grid_cols, block_size).swapaxes(1, 2).reshape(grid_rows, grid_cols, -1)
        pixels_per_cell = float(block_size * block_size)
        edge_counts = np.count_nonzero(edge_blocks, axis=-1).astype(np.float32)

        sat_thresh = max(1e-4, self.config.edge_saturation_threshold)
        norm_edge_grid = np.clip((edge_counts / pixels_per_cell) / sat_thresh, 0.0, 1.0)

        # Flow occupancy calculation (if flow vectors provided)
        if flow_vectors is not None:
            cropped_mag = flow_vectors.magnitude[:crop_h, :crop_w]
            mag_blocks = cropped_mag.reshape(grid_rows, block_size, grid_cols, block_size).swapaxes(1, 2).reshape(grid_rows, grid_cols, -1)
            moving_counts = np.count_nonzero(mag_blocks >= self.config.min_flow_thresh, axis=-1).astype(np.float32)
            norm_flow_grid = np.clip(moving_counts / pixels_per_cell, 0.0, 1.0)

            total_weight = self.config.edge_weight + self.config.flow_weight
            edge_w = self.config.edge_weight / max(1e-5, total_weight)
            flow_w = self.config.flow_weight / max(1e-5, total_weight)
            density_map = (edge_w * norm_edge_grid) + (flow_w * norm_flow_grid)
        else:
            density_map = norm_edge_grid

        # Ensure strict boundedness
        density_map = np.clip(density_map, 0.0, 1.0).astype(np.float32)

        mean_density = float(np.mean(density_map))
        peak_density = float(np.max(density_map)) if density_map.size > 0 else 0.0

        return DensityResult(
            density_map=density_map,
            mean_density=mean_density,
            peak_density=peak_density,
        )
