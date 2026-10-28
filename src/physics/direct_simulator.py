"""Pure mathematical and physical particle-level crowd stress simulator.

Runs real-time Helbing social-force crowd dynamics without requiring an external video feed.
Directly generates density fields, velocity variance tensors, photoelastic birefringence fringes,
and instant Peak Stress Index (PSI) analytics at high framerates (60+ FPS).
"""

from dataclasses import dataclass
from typing import Optional, Tuple
import cv2
import numpy as np


@dataclass
class DirectSimulationResult:
    """Telemetry and rendered frame from one step of direct crowd physics simulation."""

    frame_idx: int
    rendered_frame_bgr: np.ndarray  # (H, W, 3) frame with photoelastic field & crowd particles
    rendered_frame_rgb: np.ndarray  # (H, W, 3) RGB frame ready for web canvas
    instantaneous_psi: float  # 0.0 to 100.0
    smoothed_psi: float  # 0.0 to 100.0 (debounced)
    risk_level: str  # NOMINAL, WARNING, CRITICAL
    action_text: str  # Marshal guidance
    num_particles: int
    gate_open: bool
    hotspot_xy: Tuple[int, int]
    density_map: np.ndarray  # Coarse grid
    variance_map: np.ndarray  # Coarse grid


class DirectCrowdSimulator:
    """Direct agent-based social force and physical stress simulator."""

    def __init__(
        self,
        width: int = 800,
        height: int = 450,
        num_particles: int = 160,
        block_size: int = 20,
    ) -> None:
        self.width = width
        self.height = height
        self.num_particles = num_particles
        self.block_size = block_size
        self.grid_rows = height // block_size
        self.grid_cols = width // block_size

        # Barrier & gate setup
        self.gate_x = int(width * 0.72)
        self.gate_y = int(height * 0.50)
        self.gate_width = 85
        self.gate_open = True

        # Particle states (x, y, vx, vy, desired_speed, radius)
        self.reset()

        # Build physical photoelastic birefringence LUT (Michel-Levy chromatic orders)
        self.lut = self._build_photoelastic_lut()

        # Temporal smoothing
        self.smoothed_psi = 15.0
        self.frame_idx = 0

    def reset(self) -> None:
        """Reset crowd particles to initial states."""
        self.frame_idx = 0
        self.smoothed_psi = 15.0
        self.x = np.random.uniform(30, self.gate_x * 0.7, self.num_particles).astype(np.float32)
        self.y = np.random.uniform(self.height * 0.22, self.height * 0.78, self.num_particles).astype(np.float32)
        self.base_speed = np.random.uniform(2.2, 3.4, self.num_particles).astype(np.float32)
        self.vx = self.base_speed.copy()
        self.vy = np.zeros(self.num_particles, dtype=np.float32)
        self.radii = np.random.uniform(8.0, 10.0, self.num_particles).astype(np.float32)

    def _build_photoelastic_lut(self) -> np.ndarray:
        """Build realistic Michel-Levy isochromatic fringe transmission lookup table.

        In transmission photoelasticity under crossed circular polarizers, the transmitted intensity
        is I = I_0 * sin^2(pi * delta / lambda), where optical retardation delta is proportional to
        principal stress difference (sigma_1 - sigma_2).
        As stress rises, white light decomposes into distinct isochromatic color bands:
        Dark polarized extinction -> Steel Gray -> Pale Yellow -> Orange -> Crimson ->
        Indigo (1st order tint) -> Vibrant Green -> 2nd Order Pink / Deep Carmine.
        """
        lut = np.zeros((256, 1, 3), dtype=np.uint8)
        s = np.linspace(0.0, 1.0, 256)

        # Retardation delta across ~2 fringe orders
        delta = s * 3.4 * np.pi

        # Characteristic RGB wavelengths: Blue (460nm), Green (535nm), Red (640nm)
        I_b = np.sin(delta * (550.0 / 460.0)) ** 2
        I_g = np.sin(delta * (550.0 / 535.0)) ** 2
        I_r = np.sin(delta * (550.0 / 640.0)) ** 2

        # In polariscope: low stress is dark/deep indigo polarized ground
        # High stress flares into intense chromatic fringe rings
        base_intensity = np.clip(s * 1.8, 0.12, 1.0)

        # Modulate to ensure clear distinct photoelastic fringes:
        b = np.clip(I_b * 255 * base_intensity, 15, 255).astype(np.uint8)
        g = np.clip(I_g * 240 * base_intensity, 10, 255).astype(np.uint8)
        r = np.clip(I_r * 255 * base_intensity, 15, 255).astype(np.uint8)

        # Under highest stress (>80%), saturate red and carmine
        high_stress_mask = s > 0.78
        r[high_stress_mask] = np.clip(r[high_stress_mask] * 1.3, 180, 255).astype(np.uint8)
        g[high_stress_mask] = (g[high_stress_mask] * 0.4).astype(np.uint8)

        # Format as BGR for OpenCV
        lut[:, 0, 0] = b
        lut[:, 0, 1] = g
        lut[:, 0, 2] = r
        return lut

    def step(
        self,
        gate_open: bool = True,
        surge_inflow: float = 1.0,
        bottleneck_severity: float = 1.0,
    ) -> DirectSimulationResult:
        """Advance physical simulation by one time step and evaluate photoelastic field."""
        self.frame_idx += 1
        self.gate_open = gate_open

        # 1. Social forces and navigation towards chokepoint gate
        dx = self.gate_x - self.x
        dy = self.gate_y - self.y
        dist = np.hypot(dx, dy) + 1e-4

        desired_vx = (dx / dist) * self.base_speed * surge_inflow
        desired_vy = (dy / dist) * self.base_speed * surge_inflow

        # Natural relaxation towards desired velocity
        self.vx += 0.25 * (desired_vx - self.vx)
        self.vy += 0.25 * (desired_vy - self.vy)

        # Gate barrier mechanics
        half_gap = (self.gate_width / 2.0) if gate_open else 10.0
        wall_upper = self.gate_y - half_gap
        wall_lower = self.gate_y + half_gap

        # Collision with barrier wall
        approaching_gate = (self.x >= self.gate_x - 140) & (self.x <= self.gate_x + 15)
        outside_slot = (self.y < wall_upper) | (self.y > wall_lower)
        blocked_mask = approaching_gate & outside_slot

        # Compressional push and turbulent lateral shear when jammed
        if np.any(blocked_mask):
            self.vx[blocked_mask] *= 0.15
            # Push backward from the gate
            self.x[blocked_mask] = np.minimum(self.x[blocked_mask], self.gate_x - 4.0)

            # High turbulent agitation and crushing pressure
            lateral_churn = 4.2 * bottleneck_severity
            self.vy[blocked_mask] += np.random.normal(0, lateral_churn, np.sum(blocked_mask)).astype(np.float32)

        if not gate_open:
            # Gate completely locked: all particles in compression funnel stall and crush
            in_compression_funnel = (self.x >= self.gate_x - 240) & (self.x <= self.gate_x + 10)
            if np.any(in_compression_funnel):
                self.vx[in_compression_funnel] *= 0.20
                jitter = 5.5 * bottleneck_severity
                self.vy[in_compression_funnel] += np.random.normal(0, jitter, np.sum(in_compression_funnel)).astype(np.float32)

        # Particle-particle hard-core repulsion (avoid total overlap)
        # Fast vectorized grid cell or localized repulsion
        sub_sample = np.random.choice(self.num_particles, min(60, self.num_particles), replace=False)
        for i in sub_sample:
            rx = self.x - self.x[i]
            ry = self.y - self.y[i]
            r = np.hypot(rx, ry) + 1e-4
            too_close = (r < 18.0) & (r > 0.01)
            if np.any(too_close):
                push = (18.0 - r[too_close]) / 18.0
                self.vx[too_close] += (rx[too_close] / r[too_close]) * push * 0.8
                self.vy[too_close] += (ry[too_close] / r[too_close]) * push * 0.8

        # Position integration
        self.x += self.vx
        self.y += self.vy

        # Corridor boundaries
        min_y, max_y = self.height * 0.14, self.height * 0.86
        self.y = np.clip(self.y, min_y, max_y)

        # Re-inject particles that pass through the gate back to entrance
        passed = self.x > self.width + 10
        if np.any(passed):
            self.x[passed] = np.random.uniform(-40, 0, np.sum(passed))
            self.y[passed] = np.random.uniform(self.height * 0.25, self.height * 0.75, np.sum(passed))
            self.vx[passed] = np.random.uniform(2.0, 3.5, np.sum(passed))
            self.vy[passed] = 0.0

        # 2. Compute Spatial Density & Velocity Variance Surfaces
        grid_r = self.grid_rows
        grid_c = self.grid_cols

        # Bin particles into spatial grid
        col_indices = np.clip((self.x / self.block_size).astype(int), 0, grid_c - 1)
        row_indices = np.clip((self.y / self.block_size).astype(int), 0, grid_r - 1)

        density_grid = np.zeros((grid_r, grid_c), dtype=np.float32)
        vel_x_grid = np.zeros((grid_r, grid_c), dtype=np.float32)
        vel_y_grid = np.zeros((grid_r, grid_c), dtype=np.float32)
        counts = np.zeros((grid_r, grid_c), dtype=np.float32)

        for p_idx in range(self.num_particles):
            r_i = row_indices[p_idx]
            c_i = col_indices[p_idx]
            counts[r_i, c_i] += 1.0
            vel_x_grid[r_i, c_i] += self.vx[p_idx]
            vel_y_grid[r_i, c_i] += self.vy[p_idx]

        # Normalized density (0 to 1)
        density_grid = np.clip(counts / 4.0, 0.0, 1.0)

        # Mean velocity per cell
        mask_active = counts > 0
        vel_x_grid[mask_active] /= counts[mask_active]
        vel_y_grid[mask_active] /= counts[mask_active]

        # Grid velocity variance
        variance_grid = np.zeros((grid_r, grid_c), dtype=np.float32)
        for p_idx in range(self.num_particles):
            r_i = row_indices[p_idx]
            c_i = col_indices[p_idx]
            diff_x = self.vx[p_idx] - vel_x_grid[r_i, c_i]
            diff_y = self.vy[p_idx] - vel_y_grid[r_i, c_i]
            variance_grid[r_i, c_i] += (diff_x**2 + diff_y**2)

        variance_grid[mask_active] /= counts[mask_active]
        variance_norm = np.clip(variance_grid / 12.0, 0.0, 1.0)

        # Forward stagnation score near gate chokepoint
        chokepoint_col = int(self.gate_x / self.block_size)
        chokepoint_zone = np.clip(counts[:, max(0, chokepoint_col - 4):chokepoint_col + 1], 0, 10)
        mean_approach_vx = np.mean(vel_x_grid[:, max(0, chokepoint_col - 4):chokepoint_col + 1])
        stagnation = max(0.0, (2.5 - mean_approach_vx) / 2.5) if not gate_open else 0.1

        # 3. Formulate Photoelastic Stress Field (0–100)
        # Coupled Helbing formulation: Density + Variance + Compressive Interaction + Chokepoint Stagnation
        coupled = density_grid * variance_norm
        raw_stress = (
            30.0 * density_grid
            + 25.0 * variance_norm
            + 35.0 * coupled
            + 15.0 * (density_grid * stagnation)
        )
        stress_map = np.clip(raw_stress * (100.0 / 105.0), 0.0, 100.0)

        # Extract Peak Stress Index
        active_cells = stress_map[stress_map > 2.0]
        if active_cells.size > 0:
            instantaneous_psi = float(np.percentile(active_cells, 95))
        else:
            instantaneous_psi = float(np.max(stress_map)) if stress_map.size > 0 else 0.0

        # Asymmetric EMA smoothing (Fast-attack, slow-decay)
        if instantaneous_psi > self.smoothed_psi:
            alpha = 0.35
        else:
            alpha = 0.10
        self.smoothed_psi = float(alpha * instantaneous_psi + (1.0 - alpha) * self.smoothed_psi)

        # Risk classification
        if self.smoothed_psi >= 75.0:
            risk_level = "CRITICAL"
            action_text = "HALT INGRESS IMMEDIATELY — DIVERSE CROWD TO OVERFLOW GATES"
        elif self.smoothed_psi >= 50.0:
            risk_level = "WARNING"
            action_text = "THROTTLE GATE CAPACITY BY 50% — PULSE ENTRY INTERVALS"
        else:
            risk_level = "NOMINAL"
            action_text = "NORMAL INGRESS RATE — MAINTAIN REGULAR MONITORING"

        # Hotspot location
        max_idx = np.unravel_index(np.argmax(stress_map), stress_map.shape)
        hotspot_xy = (int((max_idx[1] + 0.5) * self.block_size), int((max_idx[0] + 0.5) * self.block_size))

        # 4. Photoelastic Heatmap Rendering with Michel-Levy Fringes
        # Upsample stress field to full canvas resolution
        upscaled_stress = cv2.resize(stress_map, (self.width, self.height), interpolation=cv2.INTER_CUBIC)
        upscaled_stress = cv2.GaussianBlur(upscaled_stress, (25, 25), 0)

        # Apply Photoelastic Michel-Levy LUT
        stress_indices = np.clip(upscaled_stress * 2.55, 0, 255).astype(np.uint8)
        photoelastic_fringes_bgr = cv2.applyColorMap(stress_indices, self.lut)

        # Base physical darkfield background (simulating circular polariscope viewing field)
        base_canvas = np.full((self.height, self.width, 3), 20, dtype=np.uint8)

        # Draw structural corridor geometry
        cv2.line(base_canvas, (0, int(self.height * 0.14)), (self.width, int(self.height * 0.14)), (70, 70, 85), 3)
        cv2.line(base_canvas, (0, int(self.height * 0.86)), (self.width, int(self.height * 0.86)), (70, 70, 85), 3)

        # Draw barrier barricades
        barrier_color = (40, 40, 220) if not gate_open else (50, 180, 220)
        cv2.line(base_canvas, (self.gate_x, int(self.height * 0.14)), (self.gate_x, int(wall_upper)), barrier_color, 7)
        cv2.line(base_canvas, (self.gate_x, int(wall_lower)), (self.gate_x, int(self.height * 0.86)), barrier_color, 7)

        # Blend photoelastic fringe field
        # Adaptive transparency: higher stress is more opaque and intensely glowing
        norm_s = np.clip(upscaled_stress / 100.0, 0.0, 1.0)
        alpha = np.clip(0.18 + 0.72 * (norm_s ** 1.3), 0.15, 0.90)[:, :, np.newaxis]

        blended = (1.0 - alpha) * base_canvas.astype(np.float32) + alpha * photoelastic_fringes_bgr.astype(np.float32)
        blended = np.clip(blended, 0, 255).astype(np.uint8)

        # Iso-stress contour rings for critical fringes
        if self.smoothed_psi > 45.0:
            contour_thresh = 65.0 if self.smoothed_psi < 75.0 else 78.0
            contours, _ = cv2.findContours(
                (upscaled_stress >= contour_thresh).astype(np.uint8),
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE,
            )
            cv2.drawContours(blended, contours, -1, (255, 255, 255), 1, cv2.LINE_AA)

        # Render crowd particles with translucent luminous heads
        for p_idx in range(self.num_particles):
            px = int(self.x[p_idx])
            py = int(self.y[p_idx])
            rad = int(self.radii[p_idx])

            # Local stress at particle position
            local_s = upscaled_stress[np.clip(py, 0, self.height - 1), np.clip(px, 0, self.width - 1)]

            # High stress particles illuminate with red-gold inner core
            if local_s > 65.0:
                core_color = (60, 60, 255)
            elif local_s > 40.0:
                core_color = (60, 220, 255)
            else:
                core_color = (220, 220, 220)

            cv2.circle(blended, (px, py), rad, core_color, -1, cv2.LINE_AA)
            cv2.circle(blended, (px, py), rad, (30, 30, 30), 1, cv2.LINE_AA)
            cv2.circle(blended, (px, py), max(2, rad // 3), (255, 255, 255), -1, cv2.LINE_AA)

        # Hotspot pulse marker
        if self.smoothed_psi > 50.0:
            pulse_rad = int(22 + 8 * np.sin(self.frame_idx * 0.3))
            cv2.circle(blended, hotspot_xy, pulse_rad, (0, 0, 255), 2, cv2.LINE_AA)
            cv2.drawMarker(blended, hotspot_xy, (255, 255, 255), cv2.MARKER_CROSS, 14, 2)

        # BGR to RGB conversion for web render
        rendered_rgb = cv2.cvtColor(blended, cv2.COLOR_BGR2RGB)

        return DirectSimulationResult(
            frame_idx=self.frame_idx,
            rendered_frame_bgr=blended,
            rendered_frame_rgb=rendered_rgb,
            instantaneous_psi=instantaneous_psi,
            smoothed_psi=self.smoothed_psi,
            risk_level=risk_level,
            action_text=action_text,
            num_particles=self.num_particles,
            gate_open=gate_open,
            hotspot_xy=hotspot_xy,
            density_map=density_grid,
            variance_map=variance_norm,
        )
