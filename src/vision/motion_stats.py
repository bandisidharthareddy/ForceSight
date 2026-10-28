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
        """Analyze flow vectors and extract grid-cell variance and bottleneck stagnation using vectorized pooling."""
        h, w = flow.magnitude.shape
        grid_rows = h // self.grid_size
        grid_cols = w // self.grid_size

        if grid_rows == 0 or grid_cols == 0:
            return FlowResult(
                flow=flow,
                grid_variance=np.zeros((1, 1), dtype=np.float32),
                avg_speed=0.0,
                stagnation_score=0.0,
                active_cell_ratio=0.0,
            )

        crop_h = grid_rows * self.grid_size
        crop_w = grid_cols * self.grid_size

        u_cropped = flow.u[:crop_h, :crop_w]
        v_cropped = flow.v[:crop_h, :crop_w]
        mag_cropped = flow.magnitude[:crop_h, :crop_w]

        # Vectorized block reshaping: (grid_rows, grid_cols, cells_per_block)
        u_blocks = u_cropped.reshape(grid_rows, self.grid_size, grid_cols, self.grid_size).swapaxes(1, 2).reshape(grid_rows, grid_cols, -1)
        v_blocks = v_cropped.reshape(grid_rows, self.grid_size, grid_cols, self.grid_size).swapaxes(1, 2).reshape(grid_rows, grid_cols, -1)
        mag_blocks = mag_cropped.reshape(grid_rows, self.grid_size, grid_cols, self.grid_size).swapaxes(1, 2).reshape(grid_rows, grid_cols, -1)

        grid_mean_speed = np.mean(mag_blocks, axis=-1).astype(np.float32)
        var_u = np.var(u_blocks, axis=-1).astype(np.float32)
        var_v = np.var(v_blocks, axis=-1).astype(np.float32)

        # Active cells mask
        active_mask = grid_mean_speed >= self.motion_threshold
        grid_variance = np.where(active_mask, var_u + var_v, 0.0).astype(np.float32)

        active_cells = int(np.count_nonzero(active_mask))
        total_cells = grid_rows * grid_cols
        active_ratio = float(active_cells / max(1, total_cells))

        # Overall average speed across active pixels
        pixel_active = flow.magnitude > self.motion_threshold
        if np.any(pixel_active):
            avg_speed = float(np.mean(flow.magnitude[pixel_active]))
        else:
            avg_speed = 0.0

        # Stagnation divergence calculation:
        # Detect sharp drop in forward speed between adjacent columns (flow jamming into a barrier)
        if grid_cols >= 2:
            speed_grad = np.diff(grid_mean_speed, axis=1)
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
