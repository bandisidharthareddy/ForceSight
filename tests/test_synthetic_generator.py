"""Unit and integration tests for synthetic crowd video generation."""

import tempfile
from pathlib import Path
from scripts.generate_synthetic_crowd import generate_crowd_video
from src.ingestion.video_loader import VideoLoader


def test_synthetic_video_generation() -> None:
    """Verify generator outputs a playable video readable by VideoLoader."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        # Generate short 2-second video at 30 fps (60 frames)
        out_path = generate_crowd_video(
            output_path=tmp_path,
            duration_sec=2.0,
            fps=30,
            width=640,
            height=360,
            num_particles=50,
        )
        assert Path(out_path).exists()
        assert Path(out_path).stat().st_size > 1000

        # Load with VideoLoader and verify frames
        with VideoLoader(out_path) as loader:
            assert loader.is_open
            assert loader.frame_count == 60
            assert loader.width == 640
            assert loader.height == 360

            frames_read = 0
            for frame in loader.stream_frames():
                assert frame.rgb_frame.shape == (360, 640, 3)
                frames_read += 1
                if frames_read >= 10:
                    break
            assert frames_read == 10
    finally:
        try:
            Path(tmp_path).unlink(missing_ok=True)
        except Exception:
            pass
