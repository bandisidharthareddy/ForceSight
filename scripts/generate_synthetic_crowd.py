"""Synthetic crowd motion video generator for zero-dependency benchmarking and evaluation."""

import argparse
import math
from pathlib import Path
from typing import List

import cv2
import numpy as np


class Particle:
    """Represents a simulated person in a moving crowd."""

    def __init__(self, x: float, y: float, base_speed: float, direction: float = 1.0) -> None:
        self.x = x
        self.y = y
        self.base_speed = base_speed
        self.direction = direction  # +1.0 for rightward, -1.0 for leftward
        self.vx = 0.0
        self.vy = 0.0
        self.radius = 16


def generate_crowd_video(
    output_path: str,
    scenario: str = "bottleneck",
    duration_sec: float = 4.0,
    fps: int = 30,
    width: int = 1280,
    height: int = 720,
    num_particles: int = 200,
) -> Path:
    """Generate synthetic crowd benchmark video simulating laminar flow, bottleneck jams, or collision surges.

    Args:
        output_path: Destination path for MP4 file.
        scenario: One of 'orderly', 'bottleneck', 'counter_flow'.
        duration_sec: Total length in seconds.
        fps: Frames per second.
        width: Video width.
        height: Video height.
        num_particles: Number of crowd particles.

    Returns:
        Path to generated video file.
    """
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    total_frames = int(duration_sec * fps)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(out_file), fourcc, fps, (width, height))
    if not writer.isOpened():
        raise RuntimeError(f"Could not open VideoWriter for {out_file}")

    np.random.seed(42)
    particles: List[Particle] = []

    # Scenario-specific particle initialization
    if scenario == "orderly":
        # Laminar unidirectional queue: orderly spacing, steady rightward flow
        n_orderly = 100
        for _ in range(n_orderly):
            px = np.random.uniform(50, width - 50)
            py = np.random.uniform(height * 0.28, height * 0.72)
            particles.append(Particle(px, py, base_speed=np.random.uniform(2.8, 3.2), direction=1.0))

    elif scenario == "counter_flow":
        # Two high-speed opposing streams colliding in the middle
        half = num_particles // 2
        for _ in range(half):
            px = np.random.uniform(50, width * 0.42)
            py = np.random.uniform(height * 0.22, height * 0.78)
            particles.append(Particle(px, py, base_speed=np.random.uniform(4.0, 5.0), direction=1.0))
        for _ in range(half):
            px = np.random.uniform(width * 0.58, width - 50)
            py = np.random.uniform(height * 0.22, height * 0.78)
            particles.append(Particle(px, py, base_speed=np.random.uniform(4.0, 5.0), direction=-1.0))

    else:  # "bottleneck"
        # Dense crowd rushing towards narrow chokepoint gate
        n_dense = 240
        for _ in range(n_dense):
            px = np.random.uniform(50, width * 0.55)
            py = np.random.uniform(height * 0.18, height * 0.82)
            particles.append(Particle(px, py, base_speed=np.random.uniform(3.5, 5.0), direction=1.0))

    gate_x = width * 0.75
    gate_y = height * 0.5
    gate_gap = 120

    try:
        for frame_idx in range(total_frames):
            frame = np.full((height, width, 3), 35, dtype=np.uint8)  # Ground surface
            progress = frame_idx / total_frames

            # Draw corridor walls
            wall_color = (90, 90, 90)
            cv2.line(frame, (0, int(height * 0.1)), (width, int(height * 0.1)), wall_color, 4)
            cv2.line(frame, (0, int(height * 0.9)), (width, int(height * 0.9)), wall_color, 4)

            # Scenario specifics:
            if scenario == "orderly":
                # Guide ropes
                cv2.line(frame, (0, int(height * 0.25)), (width, int(height * 0.25)), (60, 60, 120), 2)
                cv2.line(frame, (0, int(height * 0.75)), (width, int(height * 0.75)), (60, 60, 120), 2)
                cv2.putText(frame, "ORDERLY QUEUE (STEADY INGRESS)", (40, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (120, 220, 120), 2)

                for p in particles:
                    p.vx = p.base_speed
                    p.vy = 0.0
                    p.x += p.vx
                    if p.x > width + 20:
                        p.x = -20
                        p.y = np.random.uniform(height * 0.28, height * 0.72)

            elif scenario == "counter_flow":
                cv2.line(frame, (int(width * 0.5), int(height * 0.1)), (int(width * 0.5), int(height * 0.9)), (80, 80, 80), 1)
                cv2.putText(frame, "COUNTER-FLOW PASSAGEWAY (COLLISION ZONE)", (40, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (220, 150, 80), 2)

                for p in particles:
                    p.vx = p.direction * p.base_speed
                    # In central collision zone, opposing velocity fields cause violent turbulence
                    if abs(p.x - width * 0.5) < 160:
                        p.vx += np.random.uniform(-4.5, 4.5)
                        p.vy = np.random.uniform(-4.5, 4.5)
                    else:
                        p.vy = np.random.uniform(-0.2, 0.2)

                    p.x += p.vx
                    p.y += p.vy
                    # Reverse upon reaching borders
                    if p.x < 30:
                        p.direction = 1.0
                    elif p.x > width - 30:
                        p.direction = -1.0

            else:  # "bottleneck"
                # Gate closure at progress >= 0.35 (~1.4 seconds in)
                is_jammed = progress >= 0.35
                barricade_color = (0, 0, 220) if is_jammed else (0, 180, 220)

                # Upper barricade
                cv2.line(frame, (int(gate_x), int(height * 0.1)), (int(gate_x), int(gate_y - (0 if is_jammed else gate_gap / 2))), barricade_color, 8)
                # Lower barricade
                cv2.line(frame, (int(gate_x), int(gate_y + (0 if is_jammed else gate_gap / 2))), (int(gate_x), int(height * 0.9)), barricade_color, 8)

                status_label = "GATE CLOSED - COMPRESSION SURGE" if is_jammed else "GATE OPEN - CROWD APPROACHING"
                label_color = (0, 0, 255) if is_jammed else (0, 255, 255)
                cv2.putText(frame, f"CHOKEPOINT: {status_label}", (40, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, label_color, 2)

                for p in particles:
                    dx = gate_x - p.x
                    dy = gate_y - p.y
                    dist = math.hypot(dx, dy)
                    dir_x = dx / max(1.0, dist)
                    dir_y = dy / max(1.0, dist)

                    if not is_jammed:
                        p.vx = dir_x * p.base_speed
                        p.vy = dir_y * p.base_speed
                    else:
                        if p.x > gate_x - 260:
                            # Severe compression against closed barrier: violent turbulent agitation, surging shear & stagnation
                            p.vx = np.random.uniform(-8.0, 8.0)
                            p.vy = np.random.uniform(-14.0, 14.0)
                        else:
                            # Inflow pushing into the jam with high pressure
                            p.vx = dir_x * p.base_speed * 1.5 + np.random.uniform(-4.0, 4.0)
                            p.vy = dir_y * p.base_speed * 1.5 + np.random.uniform(-4.0, 4.0)

                    p.x += p.vx
                    p.y += p.vy

            # Render particles
            for p in particles:
                p.y = max(height * 0.14, min(height * 0.86, p.y))
                # High-contrast head circle with inner core
                cv2.circle(frame, (int(p.x), int(p.y)), p.radius, (220, 220, 220), -1)
                cv2.circle(frame, (int(p.x), int(p.y)), p.radius, (70, 70, 70), 2)
                cv2.circle(frame, (int(p.x), int(p.y)), 5, (40, 40, 40), -1)

            # Frame info overlay
            cv2.putText(
                frame,
                f"Scenario: {scenario.upper()} | Frame {frame_idx:04d}/{total_frames} | {progress*100:.1f}%",
                (30, height - 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (180, 180, 180),
                1,
            )
            writer.write(frame)

        writer.release()
        return out_file
    except Exception:
        writer.release()
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic crowd benchmark video scenarios.")
    parser.add_argument("--scenario", type=str, default="bottleneck", choices=["orderly", "bottleneck", "counter_flow"], help="Scenario dynamic")
    parser.add_argument("--output", type=str, default=None, help="Output MP4 file path")
    parser.add_argument("--duration", type=float, default=4.0, help="Duration in seconds")
    parser.add_argument("--fps", type=int, default=30, help="Frame rate")
    parser.add_argument("--width", type=int, default=1280, help="Frame width")
    parser.add_argument("--height", type=int, default=720, help="Frame height")
    args = parser.parse_args()

    out_path = args.output or f"data/benchmarks/{args.scenario}.mp4"
    print(f"Generating '{args.scenario}' benchmark video: {out_path} ({args.duration}s @ {args.fps} FPS)...")
    path = generate_crowd_video(
        output_path=out_path,
        scenario=args.scenario,
        duration_sec=args.duration,
        fps=args.fps,
        width=args.width,
        height=args.height,
    )
    print(f"Successfully generated: {path}")


if __name__ == "__main__":
    main()
