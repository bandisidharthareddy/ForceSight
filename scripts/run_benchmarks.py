"""Benchmark evaluation runner, latency profiler, and accuracy report generator for ForceSight."""

import json
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import cv2
import numpy as np

from src.config import VideoConfig
from src.ingestion.video_loader import FrameData, VideoLoader
from src.pipeline import ForceSightPipeline, PipelineResult
from src.vision.tracker import FlowVectors


@dataclass
class ScenarioBenchmarkResult:
    """Benchmark telemetry, latency breakdown, and evaluation outcome for a crowd scenario."""

    scenario_name: str
    video_path: str
    total_frames: int
    peak_psi: float
    mean_psi: float
    highest_risk_level: str
    warning_frame_idx: Optional[int]
    critical_frame_idx: Optional[int]
    avg_fps: float
    stage_latencies_ms: Dict[str, float]


class BenchmarkRunner:
    """Orchestrates headless benchmark evaluation runs across video scenarios."""

    def __init__(self) -> None:
        pass

    def run_scenario(
        self,
        video_path: str,
        scenario_name: str,
        output_dir: str = "data/reports",
        max_frames: Optional[int] = None,
    ) -> ScenarioBenchmarkResult:
        """Execute ForceSight pipeline on benchmark video, profile latencies, and export proof."""
        v_path = Path(video_path)
        if not v_path.exists():
            raise FileNotFoundError(f"Benchmark video not found: {video_path}")

        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        loader = VideoLoader(video_path, config=VideoConfig(loop=False))
        pipeline = ForceSightPipeline()

        total_frames = 0
        psi_history: List[float] = []
        highest_risk = "NOMINAL"
        warning_frame = None
        critical_frame = None

        peak_psi = 0.0
        peak_frame_bgr: Optional[np.ndarray] = None

        # Latency breakdown accumulators (ns)
        latencies_ns = {
            "optical_flow": 0,
            "turbulence_stagnation": 0,
            "density_estimation": 0,
            "stress_engine": 0,
            "temporal_risk_machine": 0,
            "overlay_rendering": 0,
        }

        total_start = time.perf_counter()

        for frame_data in loader.stream_frames():
            total_frames += 1

            # Granular profiling of each pipeline stage:
            # Stage 1: Optical Flow
            t0 = time.perf_counter_ns()
            flow = pipeline.tracker.process_frame(frame_data.gray_proxy)
            if flow is None:
                h, w = frame_data.gray_proxy.shape
                flow = pipeline.tracker.process_frame(frame_data.gray_proxy) or FlowVectors(
                    u=np.zeros((h, w), dtype=np.float32),
                    v=np.zeros((h, w), dtype=np.float32),
                    magnitude=np.zeros((h, w), dtype=np.float32),
                    angle=np.zeros((h, w), dtype=np.float32),
                )
            t1 = time.perf_counter_ns()
            latencies_ns["optical_flow"] += (t1 - t0)

            # Stage 2: Turbulence & Stagnation
            t0 = time.perf_counter_ns()
            flow_result = pipeline.turbulence.process(flow)
            t1 = time.perf_counter_ns()
            latencies_ns["turbulence_stagnation"] += (t1 - t0)

            # Stage 3: Spatial Density Estimation
            t0 = time.perf_counter_ns()
            density_result = pipeline.density_estimator.estimate(frame_data.gray_proxy, flow)
            t1 = time.perf_counter_ns()
            latencies_ns["density_estimation"] += (t1 - t0)

            # Stage 4: Helbing Stress Engine
            t0 = time.perf_counter_ns()
            stress_result = pipeline.stress_engine.compute_stress(density_result, flow_result)
            t1 = time.perf_counter_ns()
            latencies_ns["stress_engine"] += (t1 - t0)

            # Stage 5: Temporal Risk State Machine
            t0 = time.perf_counter_ns()
            risk_result = pipeline.risk_machine.process(stress_result.instantaneous_psi)
            t1 = time.perf_counter_ns()
            latencies_ns["temporal_risk_machine"] += (t1 - t0)

            # Stage 6: Photoelastic Overlay Rendering
            t0 = time.perf_counter_ns()
            overlay_result = pipeline.renderer.blend_frame(
                base_frame=frame_data.rgb_frame,
                stress_map=stress_result.stress_map,
                hotspot_coords=stress_result.hotspot_coords,
                peak_psi=risk_result.smoothed_psi,
            )
            t1 = time.perf_counter_ns()
            latencies_ns["overlay_rendering"] += (t1 - t0)

            # Record metrics
            current_psi = risk_result.smoothed_psi
            psi_history.append(current_psi)

            if current_psi > peak_psi:
                peak_psi = current_psi
                peak_frame_bgr = overlay_result.blended_frame.copy()

            level = risk_result.level.value
            if level == "CRITICAL":
                highest_risk = "CRITICAL"
                if critical_frame is None:
                    critical_frame = total_frames
            elif level == "WARNING" and highest_risk != "CRITICAL":
                highest_risk = "WARNING"
                if warning_frame is None:
                    warning_frame = total_frames

            if max_frames and total_frames >= max_frames:
                break

        total_elapsed = time.perf_counter() - total_start
        avg_fps = float(total_frames / max(1e-5, total_elapsed))

        stage_latencies_ms = {
            stage: round((total_ns / max(1, total_frames)) / 1e6, 2)
            for stage, total_ns in latencies_ns.items()
        }

        # Save peak proof frame
        if peak_frame_bgr is not None:
            proof_path = out_path / f"{scenario_name}_peak.jpg"
            cv2.imwrite(str(proof_path), peak_frame_bgr)

        mean_psi = float(np.mean(psi_history)) if psi_history else 0.0

        return ScenarioBenchmarkResult(
            scenario_name=scenario_name,
            video_path=video_path,
            total_frames=total_frames,
            peak_psi=round(peak_psi, 1),
            mean_psi=round(mean_psi, 1),
            highest_risk_level=highest_risk,
            warning_frame_idx=warning_frame,
            critical_frame_idx=critical_frame,
            avg_fps=round(avg_fps, 1),
            stage_latencies_ms=stage_latencies_ms,
        )

    def run_all(
        self,
        benchmarks: Optional[List[Tuple[str, str]]] = None,
        output_dir: str = "data/reports",
    ) -> List[ScenarioBenchmarkResult]:
        """Run standard benchmark suite across all crowd scenarios."""
        if benchmarks is None:
            benchmarks = [
                ("orderly_queue", "data/benchmarks/orderly_queue.mp4"),
                ("bottleneck_jam", "data/benchmarks/bottleneck_jam.mp4"),
                ("counter_flow", "data/benchmarks/counter_flow.mp4"),
            ]

        results = []
        print("\n" + "=" * 80)
        print("[INFO] ForceSight - Automated Benchmark Evaluation & Latency Profiling")
        print("=" * 80)

        for name, path in benchmarks:
            print(f">> Evaluating scenario '{name}' ({path})...")
            res = self.run_scenario(path, name, output_dir=output_dir)
            results.append(res)

        # Print Formatted Markdown Table
        print("\n" + "-" * 80)
        print(f"{'Scenario':<18} | {'Peak PSI':<10} | {'Risk Regime':<12} | {'FPS':<8} | {'Latency':<14} | {'Status'}")
        print("-" * 80)
        for r in results:
            latency_str = f"Frame {r.critical_frame_idx}" if r.critical_frame_idx else "None"
            status = "[PASS]" if (r.scenario_name == "orderly_queue" and r.peak_psi < 45) or (r.scenario_name != "orderly_queue" and r.peak_psi >= 75) else "[REVIEW]"
            print(f"{r.scenario_name:<18} | {r.peak_psi:<10.1f} | {r.highest_risk_level:<12} | {r.avg_fps:<8.1f} | {latency_str:<14} | {status}")
        print("-" * 80)

        # Save JSON Report
        report_data = [asdict(r) for r in results]
        json_path = Path(output_dir) / "benchmark_report.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
        print(f"\n[REPORT] Quantitative benchmark report saved to: {json_path}")

        return results


def main() -> None:
    runner = BenchmarkRunner()
    runner.run_all()


if __name__ == "__main__":
    main()
