"""Integrated ForceSight video ingestion, computer vision, physics, and rendering pipeline."""

from dataclasses import dataclass
from typing import Optional, Tuple

import numpy as np

from src.config import (
    DensityConfig,
    OpticalFlowConfig,
    OverlayConfig,
    RiskConfig,
    SmoothingConfig,
    StressConfig,
)
from src.ingestion.video_loader import FrameData
from src.physics.density import SpatialDensityEstimator
from src.physics.risk_state import RiskStateMachine, RiskStateResult
from src.physics.stress_engine import PhotoelasticStressEngine
from src.vision.motion_stats import TurbulenceExtractor
from src.vision.tracker import FlowVectors, OpticalFlowTracker
from src.visualization.overlay import PhotoelasticOverlayRenderer


@dataclass
class PipelineResult:
    """Consolidated telemetry and rendered frame from a single pipeline cycle."""

    frame_idx: int
    timestamp_ms: float
    blended_frame: np.ndarray  # (H, W, 3) BGR image with photoelastic fringes
    rgba_overlay: np.ndarray  # (H, W, 4) RGBA transparent overlay
    instantaneous_psi: float  # 0.0 to 100.0
    smoothed_psi: float  # 0.0 to 100.0 (asymmetric EMA smoothed)
    risk_state: RiskStateResult
    hotspot_coords: Tuple[int, int]  # (row, col) in block grid coordinates
    hotspot_pixel: Tuple[int, int]  # (x, y) in full-frame pixel coordinates


class ForceSightPipeline:
    """End-to-end processing pipeline orchestrating vision, crowd physics, and visual rendering."""

    def __init__(
        self,
        optical_flow_config: Optional[OpticalFlowConfig] = None,
        density_config: Optional[DensityConfig] = None,
        stress_config: Optional[StressConfig] = None,
        smoothing_config: Optional[SmoothingConfig] = None,
        risk_config: Optional[RiskConfig] = None,
        overlay_config: Optional[OverlayConfig] = None,
    ) -> None:
        self.optical_flow_config = optical_flow_config or OpticalFlowConfig()
        self.density_config = density_config or DensityConfig()
        self.stress_config = stress_config or StressConfig()
        self.smoothing_config = smoothing_config or SmoothingConfig()
        self.risk_config = risk_config or RiskConfig()
        self.overlay_config = overlay_config or OverlayConfig()

        # Instantiate modular subsystems
        self.tracker = OpticalFlowTracker(self.optical_flow_config)
        self.turbulence = TurbulenceExtractor(grid_size=self.density_config.block_size)
        self.density_estimator = SpatialDensityEstimator(self.density_config)
        self.stress_engine = PhotoelasticStressEngine(self.stress_config)
        self.risk_machine = RiskStateMachine(self.risk_config, self.smoothing_config)
        self.renderer = PhotoelasticOverlayRenderer(self.overlay_config)

    def process_frame(self, frame_data: FrameData) -> PipelineResult:
        """Execute a complete ForceSight analytics and rendering cycle on a single video frame.

        Args:
            frame_data: FrameData container with raw RGB frame and downsampled grayscale proxy.

        Returns:
            PipelineResult containing blended frames, telemetry metrics, and risk states.
        """
        # 1. Optical Flow Estimation
        flow = self.tracker.process_frame(frame_data.gray_proxy)
        if flow is None:
            # First frame baseline (zero motion)
            h, w = frame_data.gray_proxy.shape
            flow = FlowVectors(
                u=np.zeros((h, w), dtype=np.float32),
                v=np.zeros((h, w), dtype=np.float32),
                magnitude=np.zeros((h, w), dtype=np.float32),
                angle=np.zeros((h, w), dtype=np.float32),
            )

        # 2. Turbulence & Stagnation Analysis
        flow_result = self.turbulence.process(flow)

        # 3. Spatial Density Estimation
        density_result = self.density_estimator.estimate(frame_data.gray_proxy, flow)

        # 4. Coupled Helbing Stress Surface & PSI Engine
        stress_result = self.stress_engine.compute_stress(density_result, flow_result)

        # 5. Temporal Asymmetric EMA Smoothing & Hysteresis State Machine
        risk_result = self.risk_machine.process(stress_result.instantaneous_psi)

        # 6. Photoelastic Chromatic Overlay Rendering
        overlay_result = self.renderer.blend_frame(
            base_frame=frame_data.rgb_frame,
            stress_map=stress_result.stress_map,
            hotspot_coords=stress_result.hotspot_coords,
            peak_psi=risk_result.smoothed_psi,
        )

        return PipelineResult(
            frame_idx=frame_data.frame_idx,
            timestamp_ms=frame_data.timestamp_ms,
            blended_frame=overlay_result.blended_frame,
            rgba_overlay=overlay_result.rgba_overlay,
            instantaneous_psi=stress_result.instantaneous_psi,
            smoothed_psi=risk_result.smoothed_psi,
            risk_state=risk_result,
            hotspot_coords=stress_result.hotspot_coords,
            hotspot_pixel=overlay_result.hotspot_pixel,
        )

    def reset(self) -> None:
        """Reset internal optical flow history, temporal filters, and hysteresis state."""
        self.tracker.prev_gray = None
        self.risk_machine.reset()
