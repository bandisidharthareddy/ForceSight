"""Farneback dense optical flow calculation and displacement field generation."""

from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

from src.config import OpticalFlowConfig


@dataclass
class FlowVectors:
    """Container for dense 2D velocity vectors and polar motion fields."""

    u: np.ndarray  # Horizontal motion component (shape HxW)
    v: np.ndarray  # Vertical motion component (shape HxW)
    magnitude: np.ndarray  # Displacement speed/magnitude (shape HxW)
    angle: np.ndarray  # Directional angle in radians [0, 2*pi] (shape HxW)


class OpticalFlowTracker:
    """Dense optical flow tracker using OpenCV Farneback algorithm."""

    def __init__(self, config: Optional[OpticalFlowConfig] = None) -> None:
        self.config = config or OpticalFlowConfig()
        self.prev_gray: Optional[np.ndarray] = None

    def process_frame(self, curr_gray: np.ndarray) -> Optional[FlowVectors]:
        """Compute dense optical flow between previous and current grayscale proxy frames.

        Returns None on the first frame to establish the temporal baseline.
        """
        if curr_gray is None:
            return None

        # Apply Gaussian pre-blur to suppress camera sensor noise and compression artifacts
        ksize = self.config.gaussian_blur_size
        if ksize % 2 == 0:
            ksize += 1
        blurred_curr = cv2.GaussianBlur(curr_gray, (ksize, ksize), 0)

        if self.prev_gray is None:
            self.prev_gray = blurred_curr
            return None

        # Compute Farneback dense optical flow field
        flow = cv2.calcOpticalFlowFarneback(
            prev=self.prev_gray,
            next=blurred_curr,
            flow=None,
            pyr_scale=self.config.pyr_scale,
            levels=self.config.levels,
            winsize=self.config.winsize,
            iterations=self.config.iterations,
            poly_n=self.config.poly_n,
            poly_sigma=self.config.poly_sigma,
            flags=self.config.flags,
        )

        u = flow[..., 0]
        v = flow[..., 1]

        # Convert Cartesian displacement vectors (u, v) into polar (magnitude, angle)
        mag, ang = cv2.cartToPolar(u, v, angleInDegrees=False)

        # Update previous frame state
        self.prev_gray = blurred_curr

        return FlowVectors(u=u, v=v, magnitude=mag, angle=ang)

    def reset(self) -> None:
        """Clear previous frame state (e.g., when seeking or looping playback)."""
        self.prev_gray = None
