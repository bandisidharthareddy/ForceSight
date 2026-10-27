"""Spatial grid-based velocity variance, crowd turbulence, and stagnation analysis."""

from dataclasses import dataclass

import numpy as np

from src.vision.tracker import FlowVectors


@dataclass
class FlowResult:
    """Comprehensive motion statistics combining continuous flow and discrete grid metrics."""

    flow: FlowVectors
    grid_variance: np.ndarray  # Shape (rows, cols): local velocity variance per spatial block
    avg_speed: float  # Mean speed across moving pixels
    stagnation_score: float  # Normalized 0.0 to 1.0: measures abrupt deceleration at obstacles
    active_cell_ratio: float  # Proportion of grid cells with active movement


class TurbulenceExtractor:
    """Computes spatial grid turbulence and stagnation indicators from dense optical flow."""

    def __init__(self, grid_size: int = 20, motion_threshold: float = 0.4) -> None:
        self.grid_size = grid_size
        self.motion_threshold = motion_threshold

    def process(self, flow: FlowVectors) -> FlowResult:
        """Analyze flow vectors and extract grid-cell variance and bottleneck stagnation."""
        h, w = flow.magnitude.shape
        grid_rows = h // self.grid_size
        grid_cols = w // self.grid_size

        grid_variance = np.zeros((grid_rows, grid_cols), dtype=np.float32)
        grid_mean_speed = np.zeros((grid_rows, grid_cols), dtype=np.float32)

        active_cells = 0
        total_cells = grid_rows * grid_cols

        for r in range(grid_rows):
            r_start = r * self.grid_size
            r_end = r_start + self.grid_size
            for c in range(grid_cols):
                c_start = c * self.grid_size
                c_end = c_start + self.grid_size

                u_block = flow.u[r_start:r_end, c_start:c_end]
                v_block = flow.v[r_start:r_end, c_start:c_end]
                mag_block = flow.magnitude[r_start:r_end, c_start:c_end]

                mean_mag = float(np.mean(mag_block))
                grid_mean_speed[r, c] = mean_mag

                if mean_mag >= self.motion_threshold:
                    active_cells += 1
                    # Total 2D velocity variance: Var(u) + Var(v)
                    var_u = float(np.var(u_block))
                    var_v = float(np.var(v_block))
                    grid_variance[r, c] = var_u + var_v
                else:
                    grid_variance[r, c] = 0.0

        # Mean crowd speed across active pixels
        active_mask = flow.magnitude > self.motion_threshold
        if np.any(active_mask):
            avg_speed = float(np.mean(flow.magnitude[active_mask]))
        else:
            avg_speed = 0.0

        active_ratio = float(active_cells / max(1, total_cells))

        # Stagnation divergence calculation:
        # Detect sharp drop in forward speed between adjacent columns (flow jamming into a barrier)
        # Gradient along columns (axis 1): negative gradient means flow is decelerating rightwards
        if grid_cols >= 2:
            speed_grad = np.diff(grid_mean_speed, axis=1)
            # Focus on significant negative gradients where incoming speed was substantial
            incoming_active = grid_mean_speed[:, :-1] > (self.motion_threshold * 1.5)
            decel_drops = -speed_grad * incoming_active
            decel_drops = np.clip(decel_drops, 0, None)
            max_possible_drop = max(avg_speed, 1.0) * 2.0
            stagnation_score = float(np.clip(np.mean(decel_drops) / max_possible_drop * 4.0, 0.0, 1.0))
        else:
            stagnation_score = 0.0

        return FlowResult(
            flow=flow,
            grid_variance=grid_variance,
            avg_speed=avg_speed,
            stagnation_score=stagnation_score,
            active_cell_ratio=active_ratio,
        )
