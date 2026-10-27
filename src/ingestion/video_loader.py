"""Stateful video frame stream decoder with proxy downscaling and playback controls."""

from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, Optional, Union

import cv2
import numpy as np

from src.config import VideoConfig


@dataclass
class FrameData:
    """Synchronized frame container carrying full-res RGB and low-res proxy."""

    frame_idx: int
    timestamp_ms: float
    rgb_frame: np.ndarray  # Full-resolution RGB frame for visual display
    gray_proxy: np.ndarray  # (proxy_height, proxy_width) uint8 grayscale frame for optical flow
    fps: float
    total_frames: int
    is_last_frame: bool


class VideoLoader:
    """Video file loader providing frame streaming, proxy generation, and seeking."""

    def __init__(self, video_path: Union[str, Path], config: Optional[VideoConfig] = None) -> None:
        self.path = Path(video_path)
        if not self.path.exists():
            raise FileNotFoundError(f"Video file not found at path: {self.path}")

        self.config = config or VideoConfig()
        self._cap = cv2.VideoCapture(str(self.path))
        if not self._cap.isOpened():
            raise ValueError(f"Failed to open video file with OpenCV: {self.path}")

        self._fps = float(self._cap.get(cv2.CAP_PROP_FPS))
        if self._fps <= 0:
            self._fps = 30.0  # Safe default if container metadata lacks FPS

        self._frame_count = int(self._cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self._width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self._height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self._current_idx = 0

    @property
    def fps(self) -> float:
        return self._fps

    @property
    def frame_count(self) -> int:
        return self._frame_count

    @property
    def width(self) -> int:
        return self._width

    @property
    def height(self) -> int:
        return self._height

    @property
    def is_open(self) -> bool:
        return self._cap.isOpened()

    @property
    def current_frame_idx(self) -> int:
        return self._current_idx

    def read_frame(self) -> Optional[FrameData]:
        """Read the next consecutive frame from the stream."""
        if not self.is_open:
            return None

        ret, bgr_frame = self._cap.read()
        if not ret or bgr_frame is None:
            if self.config.loop and self._frame_count > 0:
                self.seek(0)
                ret, bgr_frame = self._cap.read()
                if not ret or bgr_frame is None:
                    return None
            else:
                return None

        # Convert original frame to RGB for dashboard rendering
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)

        # Generate downscaled grayscale proxy for high-speed optical flow calculation
        resized = cv2.resize(
            bgr_frame,
            (self.config.proxy_width, self.config.proxy_height),
            interpolation=cv2.INTER_AREA,
        )
        gray_proxy = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

        timestamp_ms = (self._current_idx / self._fps) * 1000.0
        is_last = (self._current_idx >= self._frame_count - 1) if self._frame_count > 0 else False

        frame_data = FrameData(
            frame_idx=self._current_idx,
            timestamp_ms=timestamp_ms,
            rgb_frame=rgb_frame,
            gray_proxy=gray_proxy,
            fps=self._fps,
            total_frames=self._frame_count,
            is_last_frame=is_last,
        )

        self._current_idx += 1
        return frame_data

    def stream_frames(self) -> Iterator[FrameData]:
        """Yield frame-by-frame data generator supporting automated loop rewind."""
        while self.is_open:
            frame = self.read_frame()
            if frame is None:
                break
            yield frame

    def seek(self, frame_idx: int) -> bool:
        """Seek stream position to a specific target frame index."""
        if not self.is_open:
            return False

        target = max(0, frame_idx)
        if self._frame_count > 0:
            target = min(target, self._frame_count - 1)

        success = self._cap.set(cv2.CAP_PROP_POS_FRAMES, target)
        if success:
            self._current_idx = target
        return success

    def close(self) -> None:
        """Release underlying OpenCV VideoCapture resources."""
        if self._cap.isOpened():
            self._cap.release()

    def __enter__(self) -> "VideoLoader":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()
