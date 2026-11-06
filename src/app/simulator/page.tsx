'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ShieldAlert,
  Sliders,
  Activity,
  Layers,
  Flame,
  Radio,
  ExternalLink,
  RotateCcw,
  Zap,
} from 'lucide-react';

// Agent definition for Helbing Social Force Model
interface Agent {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  force: number;             // Contact & compressive force in Newtons
  colorRamp: string;         // Precomputed visual hue
}

interface ChartDataPoint {
  time: string;
  psi: number;
  rawForce: number;
}

export default function SimulatorPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Real-time Interactive Sliders ---
  const [spawnRate, setSpawnRate] = useState<number>(6.5);     // Agents per second
  const [gateWidth, setGateWidth] = useState<number>(140);     // Gap distance in canvas pixels
  const [kineticDrive, setKineticDrive] = useState<number>(1.2); // Panic Multiplier (1.0x - 3.0x)

  // Use refs so the 60fps canvas loop reads instantaneous values without re-binding
  const spawnRateRef = useRef(spawnRate);
  const gateWidthRef = useRef(gateWidth);
  const kineticDriveRef = useRef(kineticDrive);

  useEffect(() => { spawnRateRef.current = spawnRate; }, [spawnRate]);
  useEffect(() => { gateWidthRef.current = gateWidth; }, [gateWidth]);
  useEffect(() => { kineticDriveRef.current = kineticDrive; }, [kineticDrive]);

  // --- UI & Telemetry State ---
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [peakStressIndex, setPeakStressIndex] = useState<number>(18.5);
  const [rawPeakForce, setRawPeakForce] = useState<number>(550);
  const [activePopulation, setActivePopulation] = useState<number>(0);
  const [throughputPerMin, setThroughputPerMin] = useState<number>(0);
  const [chartHistory, setChartHistory] = useState<ChartDataPoint[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  // --- Micro-Metrics with active jitter ---
  const [flowDivergence, setFlowDivergence] = useState<number>(0.0145);
  const [hysteresisDebounce, setHysteresisDebounce] = useState<number>(0.984);
  const [frameDensityMatrix, setFrameDensityMatrix] = useState<string>('64x64 [OK]');

  // Telemetry buffer ref for 300ms network dispatch
  const currentTelemetryRef = useRef({
    peakStress: 18.5,
    rawPeakForce: 550,
    activeAgents: 0,
    throughput: 0,
    hotspotSector: 'B3',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Micro-metrics active jitter loop (100ms)
  useEffect(() => {
    const jitterInterval = setInterval(() => {
      setFlowDivergence(+(0.0130 + Math.random() * 0.0055).toFixed(4));
      setHysteresisDebounce(+(0.970 + Math.random() * 0.025).toFixed(3));
      const matrices = ['64x64 [OPT]', '64x64 [SYNC]', '64x64 [DENSE]', '64x64 [OK]'];
      setFrameDensityMatrix(matrices[Math.floor(Math.random() * matrices.length)]);
    }, 100);

    return () => clearInterval(jitterInterval);
  }, []);

  // Telemetry push to /api/telemetry every 300ms
  useEffect(() => {
    const postInterval = setInterval(async () => {
      try {
        const snap = currentTelemetryRef.current;
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peakStress: snap.peakStress,
            rawPeakForce: snap.rawPeakForce,
            activeAgents: snap.activeAgents,
            throughput: snap.throughput,
            hotspotSector: snap.hotspotSector,
            gateWidth: +(gateWidthRef.current / 100).toFixed(2),
            spawnRate: spawnRateRef.current,
            kineticDrive: kineticDriveRef.current,
            opticalFlowDivergence: flowDivergence,
            hysteresisDebounce: hysteresisDebounce,
            frameDensityMatrix: frameDensityMatrix,
          }),
        });
      } catch (err) {
        // Non-blocking telemetry dispatch error tolerance
      }
    }, 300);

    return () => clearInterval(postInterval);
  }, [flowDivergence, hysteresisDebounce, frameDensityMatrix]);

  // Rolling chart history update (1000ms intervals, 30s window)
  useEffect(() => {
    const chartInterval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const curPSI = currentTelemetryRef.current.peakStress;
      const curRaw = currentTelemetryRef.current.rawPeakForce;

      setChartHistory((prev) => {
        const next = [...prev, { time: timeStr, psi: Math.round(curPSI), rawForce: Math.round(curRaw) }];
        if (next.length > 30) {
          return next.slice(next.length - 30);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(chartInterval);
  }, []);

  // =========================================================================
  // TASK 1 & TASK 2: HELBING SOCIAL FORCE MODEL & PHOTOELASTIC CANVAS ENGINE
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let nextAgentId = 1;
    let agents: Agent[] = [];
    let escapedWindow: number[] = [];
    let spawnAccumulator = 0;
    let lastTime = performance.now();

    // Canvas resolution setup
    const CANVAS_WIDTH = 960;
    const CANVAS_HEIGHT = 680;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Gate wall top boundary parameters
    const WALL_TOP_Y = 0;
    const WALL_BOTTOM_Y = 70;

    // Helbing Model Physics Parameters
    const PH = {
      A: 2100,          // Social force strength (N)
      B: 0.12,          // Social interaction falloff distance
      KN: 1.2e5,        // Normal elastic contact stiffness (N/m)
      KT: 2.4e5,        // Tangential sliding friction coefficient (kg/s^2)
      TAU: 0.5,         // Velocity relaxation horizon (s)
      BASE_V0: 1.35,     // Baseline desired velocity toward bottleneck (m/s)
      MAX_FORCE: 6000,  // Clamp maximum physical compressive force (N)
      MAX_SPEED: 4.8,   // Velocity cap
    };

    // Helper to spawn a new agent at the bottom
    function spawnAgent(): Agent {
      const radius = 9 + Math.random() * 2.8;
      const mass = 65 + Math.random() * 22;
      const x = 30 + Math.random() * (CANVAS_WIDTH - 60);
      const y = CANVAS_HEIGHT - 10 - Math.random() * 25;

      return {
        id: nextAgentId++,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.5 - Math.random() * 0.5,
        radius,
        mass,
        force: 0,
        colorRamp: '#4FB3D9',
      };
    }

    // Initialize with 45 agents
    for (let i = 0; i < 45; i++) {
      const a = spawnAgent();
      a.y = CANVAS_HEIGHT - 40 - Math.random() * (CANVAS_HEIGHT * 0.55);
      agents.push(a);
    }

    // Main 60 FPS Physics & Render Loop
    function physicsAndRender(timeNow: number) {
      const dtRaw = (timeNow - lastTime) / 1000;
      lastTime = timeNow;
      const dt = Math.min(dtRaw || 0.016, 0.033);

      const currentSpawnRate = spawnRateRef.current;
      const currentGateWidth = gateWidthRef.current;
      const currentKineticMultiplier = kineticDriveRef.current;

      // ---------------------------------------------------------------------
      // 1. SPAWN LOGIC: Continuously spawn agents at bottom of canvas
      // ---------------------------------------------------------------------
      spawnAccumulator += currentSpawnRate * dt;
      while (spawnAccumulator >= 1 && agents.length < 240) {
        spawnAccumulator -= 1;
        agents.push(spawnAgent());
      }
      if (spawnAccumulator > 1) spawnAccumulator = 1;

      // Gate geometry: central opening flanked by two static walls at the top
      const gateLeftEdge = (CANVAS_WIDTH - currentGateWidth) / 2;
      const gateRightEdge = (CANVAS_WIDTH + currentGateWidth) / 2;
      const gateTargetX = CANVAS_WIDTH / 2;
      const gateTargetY = WALL_BOTTOM_Y + 12;

      // ---------------------------------------------------------------------
      // 2. HELBING SOCIAL FORCE COMPUTATION
      // ---------------------------------------------------------------------
      const v0_desired = PH.BASE_V0 * currentKineticMultiplier;

      // Spatial binning grid for O(N) neighbor contact lookups
      const cellSize = 32;
      const cols = Math.ceil(CANVAS_WIDTH / cellSize) + 1;
      const rows = Math.ceil(CANVAS_HEIGHT / cellSize) + 1;
      const grid: number[][] = Array.from({ length: cols * rows }, () => []);

      for (let i = 0; i < agents.length; i++) {
        const ag = agents[i];
        const gx = Math.min(cols - 1, Math.max(0, Math.floor(ag.x / cellSize)));
        const gy = Math.min(rows - 1, Math.max(0, Math.floor(ag.y / cellSize)));
        grid[gx * rows + gy].push(i);
      }

      // Physics integration step for each agent
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        let fx = 0;
        let fy = 0;
        let compressionForce = 0;

        // A. DRIVE FORCE: Propel toward gate target
        let targetX = a.x;
        let targetY = a.y - 100;

        if (a.y > WALL_BOTTOM_Y + 25) {
          // If below the wall, steer toward the bottleneck aperture
          targetX = gateTargetX;
          targetY = gateTargetY;
        } else if (a.x >= gateLeftEdge - 5 && a.x <= gateRightEdge + 5) {
          // Inside or through the gate: advance upward into safe concourse
          targetX = a.x;
          targetY = -80;
        } else {
          // Cornered behind wall: slide toward the opening
          targetX = a.x < CANVAS_WIDTH / 2 ? gateLeftEdge + 15 : gateRightEdge - 15;
          targetY = WALL_BOTTOM_Y + 8;
        }

        const dxGoal = targetX - a.x;
        const dyGoal = targetY - a.y;
        const distGoal = Math.hypot(dxGoal, dyGoal) || 1;
        const desiredVx = (dxGoal / distGoal) * v0_desired * 35; // scaled to canvas px/s
        const desiredVy = (dyGoal / distGoal) * v0_desired * 35;

        // Drive force towards goal: m * (v0 - v) / tau
        fx += (a.mass * (desiredVx - a.vx)) / PH.TAU;
        fy += (a.mass * (desiredVy - a.vy)) / PH.TAU;

        // B. WALL REPULSION & COLLISION: Static barriers at the top
        // Left Wall: [0, 0] to [gateLeftEdge, WALL_BOTTOM_Y]
        // Right Wall: [gateRightEdge, 0] to [CANVAS_WIDTH, WALL_BOTTOM_Y]
        const checkWalls = [
          { x0: 0, y0: 0, x1: gateLeftEdge, y1: WALL_BOTTOM_Y },
          { x0: gateRightEdge, y0: 0, x1: CANVAS_WIDTH, y1: WALL_BOTTOM_Y },
        ];

        for (const wall of checkWalls) {
          // Check collision with the wall bottom face
          if (a.x >= wall.x0 - a.radius && a.x <= wall.x1 + a.radius) {
            const dyWall = a.y - wall.y1;
            if (dyWall < a.radius + 20 && dyWall > -a.radius) {
              const overlap = a.radius - Math.max(0, dyWall);
              if (overlap > 0) {
                const fWall = Math.min(overlap * 3500 + 400, PH.MAX_FORCE);
                fy += fWall;
                compressionForce += fWall;

                // Tangential slide toward gate aperture
                const slideDir = a.x < CANVAS_WIDTH / 2 ? 1 : -1;
                fx += slideDir * 800;
              } else {
                // Psychological wall proximity repulsion
                fy += 350 * Math.exp(-dyWall / 8);
              }
            }
          }

          // Check collision with the inner vertical edge posts of the gate
          if (wall.x0 === 0 && Math.abs(a.x - gateLeftEdge) < a.radius + 8 && a.y < WALL_BOTTOM_Y + 8) {
            const dxPost = a.x - gateLeftEdge;
            const overlap = a.radius - Math.abs(dxPost);
            if (overlap > 0) {
              const fPost = overlap * 2500;
              fx += (dxPost > 0 ? 1 : -1) * fPost;
              compressionForce += fPost;
            }
          } else if (wall.x1 === CANVAS_WIDTH && Math.abs(a.x - gateRightEdge) < a.radius + 8 && a.y < WALL_BOTTOM_Y + 8) {
            const dxPost = a.x - gateRightEdge;
            const overlap = a.radius - Math.abs(dxPost);
            if (overlap > 0) {
              const fPost = overlap * 2500;
              fx += (dxPost > 0 ? 1 : -1) * fPost;
              compressionForce += fPost;
            }
          }
        }

        // Side boundary wall repulsion (left and right room edges)
        if (a.x < a.radius + 15) {
          const overlap = a.radius + 15 - a.x;
          fx += overlap * 2000;
          compressionForce += overlap * 400;
        } else if (a.x > CANVAS_WIDTH - a.radius - 15) {
          const overlap = a.x - (CANVAS_WIDTH - a.radius - 15);
          fx -= overlap * 2000;
          compressionForce += overlap * 400;
        }

        // C. AGENT REPULSION (SOCIAL FORCE & CONTACT OVERLAP COMPRESSION)
        const agCellX = Math.min(cols - 1, Math.max(0, Math.floor(a.x / cellSize)));
        const agCellY = Math.min(rows - 1, Math.max(0, Math.floor(a.y / cellSize)));

        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const nCellX = agCellX + ox;
            const nCellY = agCellY + oy;
            if (nCellX < 0 || nCellX >= cols || nCellY < 0 || nCellY >= rows) continue;
            const neighborList = grid[nCellX * rows + nCellY];

            for (let q = 0; q < neighborList.length; q++) {
              const j = neighborList[q];
              if (j === i) continue;
              const b = agents[j];

              const ddx = a.x - b.x;
              const ddy = a.y - b.y;
              const dist = Math.hypot(ddx, ddy) || 0.001;
              const sumRadii = a.radius + b.radius;
              const overlap = sumRadii - dist;

              if (dist < sumRadii + 18) {
                const nx = ddx / dist;
                const ny = ddy / dist;

                // Social psychological repulsion
                const fSocial = 250 * Math.exp(-Math.max(0, -overlap) / 6);
                fx += fSocial * nx;
                fy += fSocial * ny;

                // Physical hard contact compression force
                if (overlap > 0) {
                  const fc = Math.min(overlap * 2400 + 350, PH.MAX_FORCE);
                  fx += fc * nx;
                  fy += fc * ny;

                  // Tangential sliding friction
                  const tx = -ny;
                  const ty = nx;
                  const relSpeedTangent = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
                  const ft = Math.min(overlap * 120 * relSpeedTangent, 800);
                  fx += ft * tx;
                  fy += ft * ty;

                  compressionForce += fc;
                }
              }
            }
          }
        }

        // Apply net force to accelerate the agent
        a.force = Math.min(compressionForce, PH.MAX_FORCE);
        a.vx += (fx / a.mass) * dt;
        a.vy += (fy / a.mass) * dt;

        // Clamp speed
        const currentSpeed = Math.hypot(a.vx, a.vy);
        const maxAllowedSpeed = PH.MAX_SPEED * 35;
        if (currentSpeed > maxAllowedSpeed) {
          a.vx = (a.vx / currentSpeed) * maxAllowedSpeed;
          a.vy = (a.vy / currentSpeed) * maxAllowedSpeed;
        }

        // Integrate position
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        // Canvas bottom boundary restraint
        if (a.y > CANVAS_HEIGHT - a.radius) {
          a.y = CANVAS_HEIGHT - a.radius;
          a.vy = -Math.abs(a.vy) * 0.2;
        }
      }

      // Check for agents escaping through the gate (y < 10)
      const nowSec = timeNow / 1000;
      for (let i = agents.length - 1; i >= 0; i--) {
        if (agents[i].y < 12) {
          agents.splice(i, 1);
          escapedWindow.push(nowSec);
        }
      }

      // Calculate rolling throughput (escaped per minute over last 15s)
      while (escapedWindow.length && escapedWindow[0] < nowSec - 15) {
        escapedWindow.shift();
      }
      const throughputCalculated = Math.round(escapedWindow.length * 4);

      // Compute Global Metric: Peak Stress Index (0-100 normalized)
      let maxForce = 0;
      for (let i = 0; i < agents.length; i++) {
        if (agents[i].force > maxForce) {
          maxForce = agents[i].force;
        }
      }

      // 2550 N is rib-fracture threshold => mapped to 85.0 on PSI scale
      const normalizedPSI = Math.min(100, (maxForce / 3000) * 100);

      // Synchronize component telemetry state
      setPeakStressIndex(+(normalizedPSI.toFixed(1)));
      setRawPeakForce(Math.round(maxForce));
      setActivePopulation(agents.length);
      setThroughputPerMin(throughputCalculated);

      currentTelemetryRef.current = {
        peakStress: normalizedPSI,
        rawPeakForce: maxForce,
        activeAgents: agents.length,
        throughput: throughputCalculated,
        hotspotSector: maxForce > 1800 ? 'B2' : 'C3',
      };

      // ---------------------------------------------------------------------
      // 3. ADVANCED CANVAS RENDERING: "Physics & Flow" Photoelastic Aesthetic
      // ---------------------------------------------------------------------
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // A. Tactical/Isometric Grid Background (#0A1A24)
      ctx.save();
      ctx.strokeStyle = '#0A1A24';
      ctx.lineWidth = 1;
      const gridGap = 32;

      for (let gx = 0; gx <= CANVAS_WIDTH; gx += gridGap) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let gy = 0; gy <= CANVAS_HEIGHT; gy += gridGap) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(CANVAS_WIDTH, gy);
        ctx.stroke();
      }

      // Sub-grid coordinate tags
      ctx.fillStyle = 'rgba(79, 179, 217, 0.18)';
      ctx.font = "8px 'IBM Plex Mono', monospace";
      for (let col = 1; col < 5; col++) {
        ctx.fillText(`SEC-B${col}`, col * (CANVAS_WIDTH / 5) - 40, CANVAS_HEIGHT - 12);
      }
      ctx.restore();

      // B. Static Wall Boundaries at Top (Solid Photoelastic Gate Slabs)
      ctx.save();
      // Left Wall
      ctx.fillStyle = '#10171D';
      ctx.fillRect(0, 0, gateLeftEdge, WALL_BOTTOM_Y);
      // Right Wall
      ctx.fillRect(gateRightEdge, 0, CANVAS_WIDTH - gateRightEdge, WALL_BOTTOM_Y);

      // Wall Edge photoelastic contact stress lines
      const wallStressIntensity = Math.min(1, maxForce / 2400);
      const wallEdgeColor =
        wallStressIntensity > 0.8
          ? '#D4513A'
          : wallStressIntensity > 0.4
          ? '#D9A33C'
          : '#4FB3D9';

      ctx.strokeStyle = wallEdgeColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Left Wall Face
      ctx.moveTo(0, WALL_BOTTOM_Y);
      ctx.lineTo(gateLeftEdge, WALL_BOTTOM_Y);
      ctx.lineTo(gateLeftEdge, 0);
      // Right Wall Face
      ctx.moveTo(gateRightEdge, 0);
      ctx.lineTo(gateRightEdge, WALL_BOTTOM_Y);
      ctx.lineTo(CANVAS_WIDTH, WALL_BOTTOM_Y);
      ctx.stroke();

      // Warning Chevron Striping along wall edges
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let cx = 10; cx < gateLeftEdge - 10; cx += 24) {
        ctx.beginPath();
        ctx.moveTo(cx, WALL_BOTTOM_Y - 4);
        ctx.lineTo(cx + 12, WALL_BOTTOM_Y - 20);
        ctx.stroke();
      }
      for (let cx = gateRightEdge + 10; cx < CANVAS_WIDTH - 10; cx += 24) {
        ctx.beginPath();
        ctx.moveTo(cx, WALL_BOTTOM_Y - 4);
        ctx.lineTo(cx + 12, WALL_BOTTOM_Y - 20);
        ctx.stroke();
      }

      // Gate Aperture Guide Markers
      ctx.fillStyle = 'rgba(79, 179, 217, 0.4)';
      ctx.font = "9px 'IBM Plex Mono', monospace";
      ctx.fillText(`GATE APERTURE: ${currentGateWidth}PX`, gateLeftEdge + 8, 38);
      ctx.restore();

      // C. Fading Motion Trails (Velocity Vectors)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const vMag = Math.hypot(a.vx, a.vy);
        if (vMag > 4) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          // Trail drawn in opposite direction of current velocity
          ctx.lineTo(a.x - a.vx * 0.14, a.y - a.vy * 0.14);
          ctx.stroke();
        }
      }
      ctx.restore();

      // D. Photoelastic Stress Bloom Particles (Screen / Lighter Blending)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const stressRatio = Math.min(1, a.force / 2600);

        let fillColor = 'rgba(79, 179, 217, 0.85)'; // Normal: Cyan
        let shadowColor = 'rgba(79, 179, 217, 0.5)';
        let shadowRadius = 0;

        if (stressRatio >= 0.85) {
          fillColor = 'rgba(212, 81, 58, 0.95)';    // Critical: Crimson
          shadowColor = '#D4513A';
          shadowRadius = 18;
        } else if (stressRatio >= 0.55) {
          fillColor = 'rgba(217, 163, 60, 0.92)';   // Warning: Amber
          shadowColor = '#D9A33C';
          shadowRadius = 14;
        }

        ctx.shadowBlur = shadowRadius;
        ctx.shadowColor = shadowColor;
        ctx.fillStyle = fillColor;

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner core spark for high stress particles
        if (stressRatio > 0.6) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore(); // Restores source-over and clears shadowBlur

      // E. Top 3 Highest-Stress Floating Tactical Labels
      ctx.save();
      const sortedByForce = [...agents].sort((a, b) => b.force - a.force);
      const top3Agents = sortedByForce.slice(0, 3);

      ctx.font = "9px 'IBM Plex Mono', monospace";
      for (let i = 0; i < top3Agents.length; i++) {
        const ag = top3Agents[i];
        if (ag.force > 250) {
          const isCritical = ag.force >= 2550;
          const isWarning = ag.force >= 1650;
          const tagBg = isCritical
            ? 'rgba(212, 81, 58, 0.85)'
            : isWarning
            ? 'rgba(217, 163, 60, 0.85)'
            : 'rgba(20, 27, 33, 0.85)';
          const textCol = isCritical || isWarning ? '#FFFFFF' : '#4FB3D9';

          // Floating bounding bracket
          const labelText = `[#${ag.id} F:${Math.round(ag.force)}N]`;
          const textWidth = ctx.measureText(labelText).width;

          ctx.fillStyle = tagBg;
          ctx.fillRect(ag.x + ag.radius + 4, ag.y - 12, textWidth + 6, 14);
          ctx.strokeStyle = textCol;
          ctx.lineWidth = 0.8;
          ctx.strokeRect(ag.x + ag.radius + 4, ag.y - 12, textWidth + 6, 14);

          ctx.fillStyle = textCol;
          ctx.fillText(labelText, ag.x + ag.radius + 7, ag.y - 2);

          // Indicator tick line to agent
          ctx.beginPath();
          ctx.moveTo(ag.x + ag.radius, ag.y);
          ctx.lineTo(ag.x + ag.radius + 4, ag.y - 5);
          ctx.stroke();
        }
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(physicsAndRender);
    }

    animationFrameId = requestAnimationFrame(physicsAndRender);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // UI state colors based on current Peak Stress Index
  const isCritical = peakStressIndex >= 85;
  const isWarning = peakStressIndex >= 60 && !isCritical;
  const alertColor = isCritical ? 'var(--crit)' : isWarning ? 'var(--warn)' : 'var(--steel)';

  if (!mounted) {
    return <div className="min-h-screen bg-black text-slate-400 p-8">Initializing ForceSight Console...</div>;
  }

  return (
    <main className="min-h-screen bg-black text-slate-100 p-3 sm:p-5 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      {/* =========================================================================
          TOP COMMAND BAR & DIGITAL TWIN HUD HEADER
         ========================================================================= */}
      <header className="glass-panel glass-panel-glow px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-cyan-950/80 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(79,179,217,0.3)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-slate-100 font-sans uppercase">
                ForceSight
              </h1>
              <span className="text-[10px] tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                TWIN SANDBOX v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-wide">
              Helbing Social-Force Engine &middot; Photoelastic Birefringence Simulation
            </p>
          </div>
        </div>

        {/* Global Alert Status Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded border text-xs tracking-wider uppercase font-semibold flex items-center gap-2 ${
              isCritical
                ? 'bg-red-950/70 border-red-500 text-red-300 shadow-[0_0_15px_rgba(212,81,58,0.5)] animate-pulse'
                : isWarning
                ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(217,163,60,0.4)]'
                : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-red-500 animate-ping' : isWarning ? 'bg-amber-500' : 'bg-cyan-400'
              }`}
            />
            {isCritical ? 'CRITICAL OVERLOAD' : isWarning ? 'WARNING: ELEVATED' : 'FLOW OPTIMAL'}
          </div>

          {/* Sync Link to Mobile Guard View */}
          <Link
            href="/mobile"
            target="_blank"
            className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs tracking-wider uppercase"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Mobile Guard</span>
          </Link>

          {/* Holographic 3D View Toggle */}
          <button
            onClick={() => setIs3DView((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded border text-xs tracking-wider uppercase transition flex items-center gap-1.5 ${
              is3DView
                ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-[0_0_18px_rgba(79,179,217,0.6)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-cyan-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>[3D Tactical View]</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN INTERFACE GRID: CANVAS SIMULATION & CONTROL DECK
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* LEFT / CENTER: CANVAS SIMULATOR STAGE */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="glass-panel p-2 flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black/90">
            {/* Top Canvas Bar */}
            <div className="w-full flex items-center justify-between px-3 py-1.5 border-b border-white/5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Activity className="w-3.5 h-3.5" />
                <span>CHOKEPOINT KINEMATICS &middot; 60 FPS</span>
              </span>
              <span className="font-mono text-slate-500">
                RESOLUTION: 960x680 &middot; ACTIVE PARTICLES: {activePopulation}
              </span>
            </div>

            {/* 3D Transform Canvas Container */}
            <div
              className={`w-full max-w-[960px] aspect-[960/680] relative my-auto ${
                is3DView ? 'holographic-3d' : 'flat-view'
              }`}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full block rounded bg-black cursor-crosshair border border-slate-800"
              />
            </div>

            {/* Footer Canvas Status Hint */}
            <div className="w-full px-3 py-1.5 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_#4FB3D9]" />
                  <span>Normal (&lt;60)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_#D9A33C]" />
                  <span>Warning (60-85)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-[0_0_6px_#D4513A]" />
                  <span>Critical (&gt;85)</span>
                </span>
              </div>
              <span className="text-slate-500">
                Michel-L&eacute;vy Isochromatic Stress Bloom enabled via &apos;screen&apos; blend
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: DESKTOP CONTROL DECK & TELEMETRY RAIL */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 1. PEAK STRESS INDEX IN MASSIVE GLOWING TYPOGRAPHY */}
          <div className="glass-panel p-4 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 tracking-wider uppercase mb-1">
              <span className="flex items-center gap-1.5 font-bold">
                <Flame className="w-4 h-4 text-cyan-400" />
                Peak Stress Index
              </span>
              <span className="text-[10px] text-slate-500">SCALE 0 - 100</span>
            </div>

            {/* Massive Metric Display */}
            <div className="flex items-baseline gap-3 my-1">
              <span
                className="text-6xl font-black tracking-tight font-sans"
                style={{
                  color: alertColor,
                  textShadow: `0 0 32px ${alertColor}80`,
                }}
              >
                {peakStressIndex}
              </span>
              <span className="text-sm font-mono text-slate-400">
                / 100.0
              </span>
            </div>

            <div className="w-full bg-slate-900 h-2 rounded overflow-hidden border border-white/10 my-2">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, peakStressIndex)}%`,
                  backgroundColor: alertColor,
                  boxShadow: `0 0 12px ${alertColor}`,
                }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mt-1">
              <span>Peak Force: <b className="text-slate-200">{rawPeakForce} N</b></span>
              <span>Rib Fracture Lim: <b className="text-red-400">2550 N</b></span>
            </div>
          </div>

          {/* 2. REAL-TIME INTERACTIVE SLIDERS */}
          <div className="glass-panel p-4 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Physical Parameter Controls
              </span>
              <button
                onClick={() => {
                  setSpawnRate(6.5);
                  setGateWidth(140);
                  setKineticDrive(1.2);
                }}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                title="Reset sliders to nominal values"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Slider 1: Agent Spawn Rate */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 uppercase">Agent Spawn Rate</span>
                <span className="font-mono text-cyan-400">{spawnRate.toFixed(1)} /s</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="14.0"
                step="0.5"
                value={spawnRate}
                onChange={(e) => setSpawnRate(parseFloat(e.target.value))}
              />
              <span className="text-[10px] text-slate-500">Controls inflow volume entering the chokepoint queue.</span>
            </div>

            {/* Slider 2: Gate Width */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 uppercase">Gate Width</span>
                <span className="font-mono text-cyan-400">{gateWidth} px</span>
              </div>
              <input
                type="range"
                min="60"
                max="260"
                step="5"
                value={gateWidth}
                onChange={(e) => setGateWidth(parseInt(e.target.value))}
              />
              <span className="text-[10px] text-slate-500">Dynamically narrows or widens the static wall aperture.</span>
            </div>

            {/* Slider 3: Kinetic Drive (Panic Multiplier) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 uppercase">Kinetic Drive (Panic)</span>
                <span className="font-mono text-red-400">{kineticDrive.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={kineticDrive}
                onChange={(e) => setKineticDrive(parseFloat(e.target.value))}
              />
              <span className="text-[10px] text-slate-500">Desired velocity multiplier v0 (1.0x calm &rarr; 3.0x stampede).</span>
            </div>
          </div>

          {/* 3. ROLLING 30-SECOND RECHARTS TIME-SERIES */}
          <div className="glass-panel p-4 border border-white/10 flex-1 flex flex-col">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Rolling 30s Stress Telemetry
              </span>
              <span className="text-[10px] text-slate-500">PEAK: {Math.round(rawPeakForce)}N</span>
            </div>

            <div className="w-full h-36 flex-1 min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartHistory} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    {/* SVG LinearGradient: Crimson (Top) -> Amber (Middle) -> Cyan (Bottom) */}
                    <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4513A" stopOpacity={0.85} />
                      <stop offset="50%" stopColor="#D9A33C" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#4FB3D9" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#41525F" fontSize={9} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#41525F" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(13, 17, 20, 0.95)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                  />
                  <ReferenceLine y={85} stroke="#D4513A" strokeDasharray="3 3" label={{ value: 'CRIT 85', fill: '#D4513A', fontSize: 9 }} />
                  <ReferenceLine y={60} stroke="#D9A33C" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="psi"
                    stroke="#4FB3D9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#stressGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1 text-center">
              Dashed red marker denotes 85 PSI (2550 N Rib-Fracture threshold)
            </div>
          </div>

          {/* 4. MICRO-METRICS (Actively Jittered) */}
          <div className="glass-panel p-3 border border-white/10 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Flow Divergence</div>
              <div className="text-sm font-mono font-bold text-cyan-300 mt-0.5">{flowDivergence}</div>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Hysteresis</div>
              <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">{hysteresisDebounce}</div>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Density Matrix</div>
              <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">{frameDensityMatrix}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
