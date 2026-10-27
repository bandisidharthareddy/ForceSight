"""Unit tests for VideoLoader and FrameData."""

from pathlib import Path
import pytest
from src.config import VideoConfig
from src.ingestion.video_loader import FrameData, VideoLoader


def test_invalid_path() -> None:
    """Verify FileNotFoundError is raised when pointing to a non-existent file."""
    with pytest.raises(FileNotFoundError):
        VideoLoader("non_existent_video_path_xyz.mp4")


def test_frame_stream(dummy_video_file: str) -> None:
    """Verify VideoLoader streams frames with dual full-res RGB and 640x360 proxy."""
    config = VideoConfig(proxy_width=640, proxy_height=360, loop=False)
    with VideoLoader(dummy_video_file, config=config) as loader:
        assert loader.is_open
        assert loader.frame_count == 30
        assert loader.fps > 0

        frames = []
        for frame in loader.stream_frames():
            frames.append(frame)
            assert isinstance(frame, FrameData)
            assert frame.rgb_frame.shape == (720, 1280, 3)
            assert frame.gray_proxy.shape == (360, 640)
            assert frame.gray_proxy.dtype == "uint8"
            if len(frames) >= 5:
                break

        assert len(frames) == 5
        assert frames[0].frame_idx == 0
        assert frames[4].frame_idx == 4


def test_looping(dummy_video_file: str) -> None:
    """Verify VideoLoader rewinds to frame 0 after reaching the end when loop=True."""
    config = VideoConfig(proxy_width=640, proxy_height=360, loop=True)
    with VideoLoader(dummy_video_file, config=config) as loader:
        # Seek near the end
        loader.seek(28)
        f28 = loader.read_frame()
        assert f28 is not None
        assert f28.frame_idx == 28

        f29 = loader.read_frame()
        assert f29 is not None
        assert f29.frame_idx == 29
        assert f29.is_last_frame is True

        # Next read should loop back to 0
        f_loop = loader.read_frame()
        assert f_loop is not None
        assert f_loop.frame_idx == 0


def test_seek(dummy_video_file: str) -> None:
    """Verify seeking to a specific frame works as expected."""
    with VideoLoader(dummy_video_file) as loader:
        success = loader.seek(15)
        assert success is True
        frame = loader.read_frame()
        assert frame is not None
        assert frame.frame_idx == 15
