"""Synthetic crowd motion video generator for zero-dependency benchmarking and evaluation."""

import argparse
import math
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np


class Particle:
    """Represents a simulated person in a moving crowd."""

    def __init__(self, x: float, y: float, base_speed: float) -> None:
        self.x = x
        self.y = y
        self.base_speed = base_speed
        self.vx = 0.0
        self.vy = 0.0
        self.radius = 16


def generate_crowd_video(
    output_path: str,
    duration_sec: float = 10.0,
    fps: int = 30,
    width: int = 1280,
    height: int = 720,
    num_particles: int = 120,
) -> Path:
    """Generate a synthetic crowd bottleneck video simulating laminar flow, compression, and turbulence."""
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    total_frames = int(duration_sec * fps)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(out_file), fourcc, fps, (width, height))
    if not writer.isOpened():
        raise RuntimeError(f"Could not open VideoWriter for {out_file}")

    # Bottleneck location (gate situated at x=0.75*W, y=0.5*H)
    gate_x = width * 0.75
    gate_y = height * 0.5
    gate_gap = 120  # Narrow opening

    # Initialize crowd particles on the left side
    np.random.seed(42)
    particles: List[Particle] = []
    for _ in range(num_particles):
        px = np.random.uniform(50, width * 0.45)
        py = np.random.uniform(height * 0.15, height * 0.85)
        speed = np.random.uniform(2.5, 4.0)
        particles.append(Particle(px, py, speed))

    try:
        for frame_idx in range(total_frames):
            frame = np.full((height, width, 3), 35, dtype=np.uint8)  # Dark ground surface

            # Draw corridor walls and bottleneck gate
            wall_color = (90, 90, 90)
            cv2.line(frame, (0, int(height * 0.1)), (int(gate_x), int(height * 0.1)), wall_color, 4)
            cv2.line(frame, (0, int(height * 0.9)), (int(gate_x), int(height * 0.9)), wall_color, 4)
            # Upper barricade
            cv2.line(frame, (int(gate_x), int(height * 0.1)), (int(gate_x), int(gate_y - gate_gap / 2)), (0, 0, 180), 8)
            # Lower barricade
            cv2.line(frame, (int(gate_x), int(gate_y + gate_gap / 2)), (int(gate_x), int(height * 0.9)), (0, 0, 180), 8)
            # Gate opening label
            cv2.putText(frame, "CHOKEPOINT GATE", (int(gate_x - 140), int(height * 0.07)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)

            progress = frame_idx / total_frames

            # Simulate particles
            for p in particles:
                # Vector toward gate center
                dx = gate_x - p.x
                dy = gate_y - p.y
                dist = math.hypot(dx, dy)

                if dist > 5:
                    dir_x = dx / dist
                    dir_y = dy / dist
                else:
                    dir_x = 1.0
                    dir_y = 0.0

                # Phase dynamics:
                # 0 - 30%: Smooth laminar motion
                # 30% - 70%: Compression build-up (slowdown near gate)
                # 70% - 100%: Heavy bottleneck stagnation and turbulence
                if progress < 0.3:
                    p.vx = dir_x * p.base_speed
                    p.vy = dir_y * p.base_speed
                elif progress < 0.7:
                    # Slow down sharply as approaching gate
                    slowdown = max(0.2, min(1.0, dist / (width * 0.3)))
                    p.vx = dir_x * p.base_speed * slowdown
                    p.vy = dir_y * p.base_speed * slowdown
                else:
                    # Stagnation + turbulence (chaotic lateral movement near barricade)
                    if p.x > gate_x - 100:
                        # Pinned at barricade: high agitation, zero forward velocity
                        p.vx = np.random.uniform(-0.5, 0.5)
                        p.vy = np.random.uniform(-2.5, 2.5)
                    else:
                        p.vx = dir_x * p.base_speed * 0.4 + np.random.uniform(-0.8, 0.8)
                        p.vy = dir_y * p.base_speed * 0.4 + np.random.uniform(-0.8, 0.8)

                # Update position
                p.x += p.vx
                p.y += p.vy

                # Keep within corridor bounds
                p.y = max(height * 0.12, min(height * 0.88, p.y))

                # Render person head (circle) and shoulders
                cv2.circle(frame, (int(p.x), int(p.y)), p.radius, (210, 210, 210), -1)
                cv2.circle(frame, (int(p.x), int(p.y)), p.radius, (100, 100, 100), 2)  # border
                cv2.circle(frame, (int(p.x), int(p.y)), 6, (60, 60, 60), -1)  # center marker

            # Timestamp HUD
            cv2.putText(
                frame,
                f"Synthetic Crowd Sim | Frame {frame_idx:04d} / {total_frames} | Progress: {progress*100:.1f}%",
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
    parser = argparse.ArgumentParser(description="Generate synthetic crowd bottleneck motion video.")
    parser.add_argument("--output", type=str, default="data/benchmarks/synthetic_surge.mp4", help="Output MP4 file path")
    parser.add_argument("--duration", type=float, default=10.0, help="Duration in seconds")
    parser.add_argument("--fps", type=int, default=30, help="Frame rate")
    parser.add_argument("--width", type=int, default=1280, help="Frame width")
    parser.add_argument("--height", type=int, default=720, help="Frame height")
    args = parser.parse_args()

    print(f"Generating synthetic crowd video: {args.output} ({args.duration}s @ {args.fps} FPS)...")
    path = generate_crowd_video(
        output_path=args.output,
        duration_sec=args.duration,
        fps=args.fps,
        width=args.width,
        height=args.height,
    )
    print(f"Synthetic video successfully created at: {path}")


if __name__ == "__main__":
    main()
