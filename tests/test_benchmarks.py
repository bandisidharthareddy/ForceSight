"""Unit and regression tests for benchmark evaluation, latency profiling, and system hardening."""

import json
from pathlib import Path
import cv2
import numpy as np
import pytest

from src.config import OpticalFlowConfig, VideoConfig
from src.ingestion.video_loader import FrameData, VideoLoader
from src.pipeline import ForceSightPipeline
from scripts.generate_synthetic_crowd import generate_crowd_video
from scripts.run_benchmarks import BenchmarkRunner, ScenarioBenchmarkResult


class TestBenchmarkSuite:
    """Validates benchmark generation, runner profiling, and scenario dynamics."""

    def test_benchmark_generation_all_scenarios(self, tmp_path: Path):
        """Verify generation of all three benchmark scenarios."""
        scenarios = ["orderly", "bottleneck", "counter_flow"]
        for scenario in scenarios:
            out_file = tmp_path / f"test_{scenario}.mp4"
            generate_crowd_video(
                scenario=scenario,
                output_path=str(out_file),
                duration_sec=1.0,
                fps=20,
                width=640,
                height=360,
            )
            assert out_file.exists(), f"Scenario {scenario} video file was not generated."
            cap = cv2.VideoCapture(str(out_file))
            assert cap.isOpened(), f"Cannot open {scenario} video with OpenCV."
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cap.release()
            assert frame_count == 20, f"Expected 20 frames, got {frame_count}"

    def test_benchmark_runner_execution(self, tmp_path: Path):
        """Verify BenchmarkRunner executes headless pipeline and produces valid metrics."""
        test_clip = tmp_path / "runner_test.mp4"
        generate_crowd_video(
            scenario="orderly",
            output_path=str(test_clip),
            duration_sec=0.5,
            fps=20,
            width=640,
            height=360,
        )

        runner = BenchmarkRunner()
        result = runner.run_scenario(
            video_path=str(test_clip),
            scenario_name="runner_test",
            output_dir=str(tmp_path / "reports"),
            max_frames=10,
        )

        assert isinstance(result, ScenarioBenchmarkResult)
        assert result.scenario_name == "runner_test"
        assert result.total_frames == 10
        assert 0.0 <= result.peak_psi <= 100.0
        assert result.avg_fps > 0.0
        assert "optical_flow" in result.stage_latencies_ms
        assert "stress_engine" in result.stage_latencies_ms


class TestScenarioDynamics:
    """Validates false-alarm suppression and rapid surge detection."""

    def test_orderly_queue_suppression(self):
        """Confirms orderly laminar flow stays strictly in Nominal regime (zero false alarms)."""
        benchmark_video = "data/benchmarks/orderly_queue.mp4"
        assert Path(benchmark_video).exists(), "Benchmark orderly video missing"

        loader = VideoLoader(benchmark_video, config=VideoConfig(loop=False))
        pipeline = ForceSightPipeline()

        max_psi = 0.0
        for frame in loader.stream_frames():
            res = pipeline.process_frame(frame)
            if res.smoothed_psi > max_psi:
                max_psi = res.smoothed_psi
            assert res.risk_state.level.value == "NOMINAL", f"False alarm triggered: {res.risk_state.level.value} (PSI={res.smoothed_psi})"

        assert max_psi < 45.0, f"Orderly queue peak PSI exceeded 45.0: {max_psi}"

    def test_surge_detection_latency(self):
        """Confirms bottleneck closure triggers Warning/Critical state."""
        benchmark_video = "data/benchmarks/bottleneck_jam.mp4"
        assert Path(benchmark_video).exists(), "Benchmark bottleneck video missing"

        loader = VideoLoader(benchmark_video, config=VideoConfig(loop=False))
        pipeline = ForceSightPipeline()

        critical_frame = None
        warning_frame = None
        for i, frame in enumerate(loader.stream_frames()):
            res = pipeline.process_frame(frame)
            if res.risk_state.level.value == "CRITICAL" and critical_frame is None:
                critical_frame = i
            elif res.risk_state.level.value == "WARNING" and warning_frame is None:
                warning_frame = i

        assert warning_frame is not None or critical_frame is not None, "Bottleneck jam failed to escalate risk"
        assert critical_frame is not None, "Bottleneck jam failed to reach CRITICAL tier"

    def test_counter_flow_turbulence(self):
        """Confirms opposing stream collision triggers CRITICAL tier."""
        benchmark_video = "data/benchmarks/counter_flow.mp4"
        assert Path(benchmark_video).exists(), "Benchmark counter-flow video missing"

        loader = VideoLoader(benchmark_video, config=VideoConfig(loop=False))
        pipeline = ForceSightPipeline()

        critical_detected = False
        for frame in loader.stream_frames():
            res = pipeline.process_frame(frame)
            if res.risk_state.level.value == "CRITICAL":
                critical_detected = True
                break

        assert critical_detected, "Counter-flow collision failed to trigger CRITICAL tier"


class TestSystemHardening:
    """Validates resilience under camera shake, low-light, empty corridors, and scene cuts."""

    def test_hardening_camera_shake(self):
        """Global camera shake / uniform translation must not trigger severe false alarms."""
        pipeline = ForceSightPipeline()
        base_h, base_w = 720, 1280
        proxy_h, proxy_w = 360, 640

        # Create static textured image
        rng = np.random.RandomState(42)
        base_pattern = rng.randint(50, 200, (base_h, base_w, 3), dtype=np.uint8)
        base_gray = cv2.cvtColor(base_pattern, cv2.COLOR_BGR2GRAY)

        max_psi = 0.0
        for i in range(15):
            # Translate frame uniformly by jitter dx, dy
            dx = int(5 * np.sin(i))
            dy = int(3 * np.cos(i))
            M = np.float32([[1, 0, dx], [0, 1, dy]])
            shifted_rgb = cv2.warpAffine(base_pattern, M, (base_w, base_h))
            shifted_gray = cv2.warpAffine(base_gray, M, (base_w, base_h))
            proxy = cv2.resize(shifted_gray, (proxy_w, proxy_h))

            fd = FrameData(
                frame_idx=i,
                timestamp_ms=i * 33.3,
                rgb_frame=shifted_rgb,
                gray_proxy=proxy,
                fps=30.0,
                total_frames=15,
                is_last_frame=(i == 14),
            )
            res = pipeline.process_frame(fd)
            if res.smoothed_psi > max_psi:
                max_psi = res.smoothed_psi

        # Uniform translation has low spatial variance; should remain well below Critical
        assert max_psi < 50.0, f"Camera shake triggered false escalation: {max_psi}"

    def test_hardening_dark_frames(self):
        """Extreme low light (<10 luminance) must not cause exceptions, zero-division, or NaN."""
        pipeline = ForceSightPipeline()
        dark_rgb = np.full((720, 1280, 3), 5, dtype=np.uint8)
        dark_gray = np.full((360, 640), 5, dtype=np.uint8)

        for i in range(10):
            fd = FrameData(
                frame_idx=i,
                timestamp_ms=i * 33.3,
                rgb_frame=dark_rgb,
                gray_proxy=dark_gray,
                fps=30.0,
                total_frames=10,
                is_last_frame=(i == 9),
            )
            res = pipeline.process_frame(fd)
            assert not np.isnan(res.instantaneous_psi), "Instantaneous PSI is NaN on dark frames"
            assert not np.isnan(res.smoothed_psi), "Smoothed PSI is NaN on dark frames"
            assert res.risk_state.level.value == "NOMINAL"

    def test_hardening_empty_corridor(self):
        """Zero motion in an empty corridor must yield PSI = 0 and NOMINAL risk."""
        pipeline = ForceSightPipeline()
        blank_rgb = np.full((720, 1280, 3), 100, dtype=np.uint8)
        blank_gray = np.full((360, 640), 100, dtype=np.uint8)

        for i in range(10):
            fd = FrameData(
                frame_idx=i,
                timestamp_ms=i * 33.3,
                rgb_frame=blank_rgb,
                gray_proxy=blank_gray,
                fps=30.0,
                total_frames=10,
                is_last_frame=(i == 9),
            )
            res = pipeline.process_frame(fd)

        assert res.instantaneous_psi == 0.0
        assert res.risk_state.level.value == "NOMINAL"

    def test_hardening_abrupt_scene_cut(self):
        """Instantaneous drastic scene change must not hang or emit invalid metrics."""
        pipeline = ForceSightPipeline()
        frame1_rgb = np.zeros((720, 1280, 3), dtype=np.uint8)
        frame1_gray = np.zeros((360, 640), dtype=np.uint8)
        frame2_rgb = np.full((720, 1280, 3), 255, dtype=np.uint8)
        frame2_gray = np.full((360, 640), 255, dtype=np.uint8)

        fd1 = FrameData(frame_idx=0, timestamp_ms=0, rgb_frame=frame1_rgb, gray_proxy=frame1_gray, fps=30.0, total_frames=2, is_last_frame=False)
        fd2 = FrameData(frame_idx=1, timestamp_ms=33.3, rgb_frame=frame2_rgb, gray_proxy=frame2_gray, fps=30.0, total_frames=2, is_last_frame=True)

        res1 = pipeline.process_frame(fd1)
        res2 = pipeline.process_frame(fd2)

        assert not np.isnan(res2.smoothed_psi)
        assert 0.0 <= res2.smoothed_psi <= 100.0
