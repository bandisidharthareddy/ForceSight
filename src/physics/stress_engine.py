"""Coupled Helbing crowd stress field computation and instantaneous Peak Stress Index (PSI)."""

from dataclasses import dataclass
from typing import Optional, Tuple

import numpy as np

from src.config import StressConfig
from src.physics.density import DensityResult
from src.vision.motion_stats import FlowResult


@dataclass
class StressResult:
    """Stress surface results and localized peak index metrics."""

    stress_map: np.ndarray  # Shape (grid_rows, grid_cols): 2D float32 stress field [0.0, 100.0]
    instantaneous_psi: float  # Scalar Peak Stress Index strictly in [0.0, 100.0]
    mean_stress: float  # Mean stress across active zones [0.0, 100.0]
    hotspot_coords: Tuple[int, int]  # (row, col) grid coordinates of maximum stress concentration


class PhotoelasticStressEngine:
    """Computes continuous 2D photoelastic stress surface and scalar Peak Stress Index (0–100)."""

    def __init__(self, config: Optional[StressConfig] = None) -> None:
        self.config = config or StressConfig()

    def compute_stress(
        self,
        density_result: DensityResult,
        flow_result: FlowResult,
    ) -> StressResult:
        """Calculate the 2D stress field and instantaneous Peak Stress Index (PSI).

        Combines spatial density, velocity variance, the coupled interaction term, and
        stagnation divergence via Helbing's crowd pressure formulation.

        Args:
            density_result: DensityResult from SpatialDensityEstimator.
            flow_result: FlowResult from TurbulenceExtractor.

        Returns:
            StressResult with 2D stress map, instantaneous PSI, mean stress, and hotspot coords.
        """
        rho = density_result.density_map
        var_grid = flow_result.grid_variance

        # Align dimensions if slight mismatch occurs
        if rho.shape != var_grid.shape:
            min_r = min(rho.shape[0], var_grid.shape[0])
            min_c = min(rho.shape[1], var_grid.shape[1])
            rho = rho[:min_r, :min_c]
            var_grid = var_grid[:min_r, :min_c]

        # 1. Normalize components
        var_norm = np.clip(
            var_grid / max(1e-5, self.config.max_expected_variance),
            0.0,
            1.0,
        )

        interaction = rho * var_norm  # Compressive turbulence
        stagnation_term = rho * flow_result.stagnation_score  # Packed crowd blocked at boundary

        # 2. Coupled Helbing 2D stress surface calculation
        w_sum = (
            self.config.w_density
            + self.config.w_variance
            + self.config.w_interaction
            + self.config.w_stagnation
        )
        if w_sum <= 0:
            w_sum = 100.0

        raw_stress = (
            self.config.w_density * rho
            + self.config.w_variance * var_norm
            + self.config.w_interaction * interaction
            + self.config.w_stagnation * stagnation_term
        ) * (100.0 / w_sum)

        stress_map = np.clip(raw_stress * self.config.scale_factor, 0.0, 100.0).astype(np.float32)

        # 3. Peak Stress Index (PSI) extraction
        # Use percentile across active cells to resist isolated single-cell artifacts
        active_cells = stress_map[stress_map > 1.0]
        if active_cells.size > 0:
            psi = float(np.percentile(active_cells, self.config.percentile_psi))
            mean_stress = float(np.mean(active_cells))
        else:
            psi = float(np.max(stress_map)) if stress_map.size > 0 else 0.0
            mean_stress = float(np.mean(stress_map)) if stress_map.size > 0 else 0.0

        instantaneous_psi = float(np.clip(psi, 0.0, 100.0))
        mean_stress = float(np.clip(mean_stress, 0.0, 100.0))

        # 4. Find peak hotspot coordinates
        if stress_map.size > 0:
            max_idx = np.unravel_index(np.argmax(stress_map), stress_map.shape)
            hotspot_coords = (int(max_idx[0]), int(max_idx[1]))
        else:
            hotspot_coords = (0, 0)

        return StressResult(
            stress_map=stress_map,
            instantaneous_psi=instantaneous_psi,
            mean_stress=mean_stress,
            hotspot_coords=hotspot_coords,
        )
