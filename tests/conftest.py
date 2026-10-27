"""Shared fixtures for ForceSight tests."""

import tempfile
from pathlib import Path
from typing import Generator

import cv2
import numpy as np
import pytest


@pytest.fixture
def dummy_rgb_frame() -> np.ndarray:
    """Generate a synthetic 720x1280 RGB frame containing distinct test shapes."""
    frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    # Background gradient
    for y in range(720):
        frame[y, :, 0] = int((y / 720) * 100)
    # Add identifiable shapes
    cv2.circle(frame, (640, 360), 50, (0, 255, 0), -1)  # Green circle in center
    cv2.rectangle(frame, (200, 200), (350, 450), (255, 0, 0), -1)  # Red box
    cv2.circle(frame, (900, 360), 40, (0, 0, 255), -1)  # Blue circle
    return frame


@pytest.fixture
def dummy_video_file() -> Generator[str, None, None]:
    """Create a temporary 30-frame synthetic MP4 file with moving particles and yield its path."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    width, height = 1280, 720
    fps = 30
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(tmp_path, fourcc, fps, (width, height))

    try:
        for i in range(30):
            frame = np.zeros((height, width, 3), dtype=np.uint8)
            # Draw moving particle (translating rightwards by 5px per frame)
            x_pos = 100 + i * 5
            y_pos = 360
            cv2.circle(frame, (x_pos, y_pos), 25, (255, 255, 255), -1)
            # Static boundary line
            cv2.line(frame, (800, 0), (800, 720), (128, 128, 128), 3)
            out.write(frame)
        out.release()
        yield tmp_path
    finally:
        out.release()
        try:
            Path(tmp_path).unlink(missing_ok=True)
        except Exception:
            pass
