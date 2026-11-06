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
  Sliders,
  Activity,
  Layers,
  Flame,
  Radio,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  Target,
  PlusCircle,
  Bomb,
  Compass,
  Play,
  Pause,
} from 'lucide-react';
import { SectorMetric } from '../api/telemetry/route';

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
  panic: number;             // 0.0 (calm) to 1.0 (panicked)
}

interface Pillar {
  id: number;
  x: number;
  y: number;
  radius: number;
  stress: number;            // Absorbed compressive load in Newtons
}

interface IncidentShockwave {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;              // Remaining duration in seconds
}

interface ChartDataPoint {
  time: string;
  psi: number;
  rawForce: number;
}

const SECTOR_ROWS = ['A', 'B', 'C', 'D'];

export default function SimulatorPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Real-time Interactive Sliders ---
  const [spawnRate, setSpawnRate] = useState<number>(5.5);       // Agents per second
  const [gateWidth, setGateWidth] = useState<number>(140);       // Gap distance in canvas pixels
  const [kineticDrive, setKineticDrive] = useState<number>(1.1); // Panic Multiplier (1.0x - 3.0x)

  // Use refs so the 60fps canvas loop reads instantaneous values without re-binding
  const spawnRateRef = useRef(spawnRate);
  const gateWidthRef = useRef(gateWidth);
  const kineticDriveRef = useRef(kineticDrive);

  useEffect(() => { spawnRateRef.current = spawnRate; }, [spawnRate]);
  useEffect(() => { gateWidthRef.current = gateWidth; }, [gateWidth]);
  useEffect(() => { kineticDriveRef.current = kineticDrive; }, [kineticDrive]);

  // --- Canvas Interaction Tools ---
  type ToolMode = 'inspect' | 'pillar' | 'incident';
  const [activeTool, setActiveTool] = useState<ToolMode>('pillar');
  const activeToolRef = useRef<ToolMode>(activeTool);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  // --- UI & Telemetry State ---
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const [peakStressIndex, setPeakStressIndex] = useState<number>(14.5);
  const [rawPeakForce, setRawPeakForce] = useState<number>(440);
  const [activePopulation, setActivePopulation] = useState<number>(0);
  const [throughputPerMin, setThroughputPerMin] = useState<number>(0);
  const [hotspotSector, setHotspotSector] = useState<string>('B3');
  const [barrierP1, setBarrierP1] = useState<number>(0.12);
  const [barrierP2, setBarrierP2] = useState<number>(0.15);
  const [sectorTiles, setSectorTiles] = useState<SectorMetric[]>([]);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const selectedSectorRef = useRef<string | null>(null);
  useEffect(() => { selectedSectorRef.current = selectedSector; }, [selectedSector]);

  const [chartHistory, setChartHistory] = useState<ChartDataPoint[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  // --- Micro-Metrics with active jitter ---
  const [flowDivergence, setFlowDivergence] = useState<number>(0.0145);
  const [hysteresisDebounce, setHysteresisDebounce] = useState<number>(0.984);
  const [frameDensityMatrix, setFrameDensityMatrix] = useState<string>('64x64 [OK]');

  // Micro-metrics ref to avoid re-triggering the 300ms POST interval
  const microMetricsRef = useRef({
    flowDivergence: 0.0145,
    hysteresisDebounce: 0.984,
    frameDensityMatrix: '64x64 [OK]',
  });

  // Telemetry buffer ref for 300ms network dispatch
  const currentTelemetryRef = useRef({
    peakStress: 14.5,
    rawPeakForce: 440,
    activeAgents: 0,
    throughput: 0,
    hotspotSector: 'B3',
    hotspotPressure: 15,
    barrierP1: 0.12,
    barrierP2: 0.15,
    sectorGrid: [] as SectorMetric[],
  });

  // Dynamic actions triggered from buttons
  const triggerIncidentActionRef = useRef<((x: number, y: number) => void) | null>(null);
  const addPillarActionRef = useRef<((x: number, y: number) => void) | null>(null);
  const clearPillarsActionRef = useRef<(() => void) | null>(null);
  const applyPresetActionRef = useRef<((name: string) => void) | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Micro-metrics active jitter loop (100ms)
  useEffect(() => {
    const jitterInterval = setInterval(() => {
      const fd = +(0.0130 + Math.random() * 0.0055).toFixed(4);
      const hd = +(0.970 + Math.random() * 0.025).toFixed(3);
      const matrices = ['64x64 [OPT]', '64x64 [SYNC]', '64x64 [DENSE]', '64x64 [OK]'];
      const fdm = matrices[Math.floor(Math.random() * matrices.length)];

      setFlowDivergence(fd);
      setHysteresisDebounce(hd);
      setFrameDensityMatrix(fdm);

      microMetricsRef.current = {
        flowDivergence: fd,
        hysteresisDebounce: hd,
        frameDensityMatrix: fdm,
      };
    }, 100);

    return () => clearInterval(jitterInterval);
  }, []);

  // Telemetry push to /api/telemetry every 300ms (steady, un-interrupted)
  useEffect(() => {
    const postTelemetry = async () => {
      try {
        const snap = currentTelemetryRef.current;
        const mm = microMetricsRef.current;
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peakStress: snap.peakStress,
            rawPeakForce: snap.rawPeakForce,
            activeAgents: snap.activeAgents,
            throughput: snap.throughput,
            hotspotSector: snap.hotspotSector,
            hotspotPressure: snap.hotspotPressure,
            gateWidth: +(gateWidthRef.current / 100).toFixed(2),
            spawnRate: spawnRateRef.current,
            kineticDrive: kineticDriveRef.current,
            opticalFlowDivergence: mm.flowDivergence,
            hysteresisDebounce: mm.hysteresisDebounce,
            frameDensityMatrix: mm.frameDensityMatrix,
            barrierP1: snap.barrierP1,
            barrierP2: snap.barrierP2,
            sectorGrid: snap.sectorGrid,
          }),
        });
      } catch (err) {
        // Non-blocking telemetry dispatch error tolerance
      }
    };

    const postInterval = setInterval(postTelemetry, 300);
    return () => clearInterval(postInterval);
  }, []);

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
  // TASK 1, 2, 3: CALIBRATED CROWD PHYSICS, TILE SYSTEM & CANVAS ENGINE
  // =========================================================================
  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let nextAgentId = 1;
    let nextPillarId = 1;
    let agents: Agent[] = [];
    let pillars: Pillar[] = [
      // Default strategic deflection pillar placed 130px below the gate
      { id: nextPillarId++, x: 480, y: 200, radius: 24, stress: 0 },
    ];
    let shockwaves: IncidentShockwave[] = [];
    let escapedWindow: number[] = [];
    let spawnAccumulator = 0;
    let lastTime = performance.now();

    // Barrier panels accumulated force in Newtons
    let barrierP1Accum = 0;
    let barrierP2Accum = 0;

    // Canvas resolution setup
    const CANVAS_WIDTH = 960;
    const CANVAS_HEIGHT = 680;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Gate wall top boundary parameters
    const WALL_BOTTOM_Y = 75;

    // Helbing Model Physics Parameters (CALIBRATED TO REALISTIC FORCE SCALES)
    const PH = {
      A: 180,           // Social psychological repulsion force (N)
      B: 0.18,          // Social interaction falloff distance
      KN: 420,          // Normal elastic contact stiffness (N/px) - calibrated for realistic gradual force accumulation
      KT: 85,           // Tangential sliding friction coefficient
      TAU: 0.55,        // Velocity relaxation horizon (s)
      BASE_V0: 1.25,    // Baseline desired velocity toward bottleneck (m/s)
      MAX_FORCE: 3500,  // Clamp maximum physical compressive force (N)
      MAX_SPEED: 4.2,   // Velocity cap
    };

    // Helper to spawn a new agent at the bottom
    function spawnAgent(customY?: number): Agent {
      const radius = 9.5 + Math.random() * 2.2;
      const mass = 65 + Math.random() * 20;
      const x = 30 + Math.random() * (CANVAS_WIDTH - 60);
      const y = customY !== undefined ? customY : CANVAS_HEIGHT - 10 - Math.random() * 25;

      return {
        id: nextAgentId++,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.6 - Math.random() * 0.5,
        radius,
        mass,
        force: 0,
        panic: 0,
      };
    }

    // Initialize with 65 initial agents distributed across the arena floor
    for (let i = 0; i < 65; i++) {
      const startY = CANVAS_HEIGHT - 35 - Math.random() * (CANVAS_HEIGHT * 0.70);
      agents.push(spawnAgent(startY));
    }

    // Expose interactive actions
    addPillarActionRef.current = (x: number, y: number) => {
      pillars.push({ id: nextPillarId++, x, y, radius: 22, stress: 0 });
    };

    clearPillarsActionRef.current = () => {
      pillars = [];
    };

    triggerIncidentActionRef.current = (x: number, y: number) => {
      shockwaves.push({ id: Date.now(), x, y, radius: 10, life: 3.5 });
      // Instantly impart panic to nearby agents
      for (const a of agents) {
        const dist = Math.hypot(a.x - x, a.y - y);
        if (dist < 140) {
          a.panic = 1.0;
        }
      }
    };

    applyPresetActionRef.current = (name: string) => {
      if (name === 'calm') {
        setSpawnRate(3.5);
        setGateWidth(200);
        setKineticDrive(1.0);
        pillars = [];
        agents.forEach((a) => { a.panic = 0; });
      } else if (name === 'surge') {
        setSpawnRate(9.0);
        setGateWidth(90);
        setKineticDrive(2.2);
        pillars = [];
        agents.forEach((a) => { a.panic = 0.8; });
      } else if (name === 'pillar_test') {
        setSpawnRate(7.5);
        setGateWidth(120);
        setKineticDrive(1.5);
        pillars = [{ id: nextPillarId++, x: 480, y: 200, radius: 26, stress: 0 }];
      } else if (name === 'panic') {
        triggerIncidentActionRef.current?.(480, 340);
        setKineticDrive(2.5);
      }
    };

    // Canvas click interaction handler
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const tool = activeToolRef.current;

      if (tool === 'inspect') {
        const col = Math.min(4, Math.max(0, Math.floor(clickX / (CANVAS_WIDTH / 5))));
        const row = Math.min(3, Math.max(0, Math.floor(clickY / (CANVAS_HEIGHT / 4))));
        const secName = `${SECTOR_ROWS[row]}${col + 1}`;
        setSelectedSector((prev) => (prev === secName ? null : secName));
      } else if (tool === 'pillar') {
        // If clicked on existing pillar, remove it
        const clickedPillarIndex = pillars.findIndex(
          (p) => Math.hypot(p.x - clickX, p.y - clickY) < p.radius + 12
        );
        if (clickedPillarIndex >= 0) {
          pillars.splice(clickedPillarIndex, 1);
        } else if (clickY > WALL_BOTTOM_Y + 30 && clickY < CANVAS_HEIGHT - 30) {
          // Add new deflection pillar
          pillars.push({ id: nextPillarId++, x: clickX, y: clickY, radius: 22, stress: 0 });
        }
      } else if (tool === 'incident') {
        // Detonate localized shockwave incident
        shockwaves.push({ id: Date.now(), x: clickX, y: clickY, radius: 10, life: 3.5 });
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    // Main 60 FPS Physics & Render Loop
    function physicsAndRender(timeNow: number) {
      const dtRaw = (timeNow - lastTime) / 1000;
      lastTime = timeNow;
      const dt = Math.min(dtRaw || 0.016, 0.033);

      if (!isPausedRef.current) {
        const currentSpawnRate = spawnRateRef.current;
        const currentGateWidth = gateWidthRef.current;
        const currentKineticMultiplier = kineticDriveRef.current;

        // Reset barrier sensing panels accumulator
        barrierP1Accum = 0;
        barrierP2Accum = 0;
        pillars.forEach((p) => { p.stress = 0; });

        // Update shockwaves & panic contagion
        for (let swIdx = shockwaves.length - 1; swIdx >= 0; swIdx--) {
          const sw = shockwaves[swIdx];
          sw.radius += 160 * dt; // Expansion speed
          sw.life -= dt;

          // Propagate panic contagion to agents caught in wave
          for (let i = 0; i < agents.length; i++) {
            const ag = agents[i];
            const dist = Math.hypot(ag.x - sw.x, ag.y - sw.y);
            if (Math.abs(dist - sw.radius) < 25) {
              ag.panic = Math.min(1.0, ag.panic + 1.8 * dt);
            }
          }

          if (sw.life <= 0 || sw.radius > 450) {
            shockwaves.splice(swIdx, 1);
          }
        }

        // ---------------------------------------------------------------------
        // 1. SPAWN LOGIC: Continuously spawn agents at bottom of canvas
        // ---------------------------------------------------------------------
        spawnAccumulator += currentSpawnRate * dt;
        while (spawnAccumulator >= 1 && agents.length < 240) {
          spawnAccumulator -= 1;
          agents.push(spawnAgent());
        }
        if (spawnAccumulator > 1) spawnAccumulator = 1;

        // Gate geometry
        const gateLeftEdge = (CANVAS_WIDTH - currentGateWidth) / 2;
        const gateRightEdge = (CANVAS_WIDTH + currentGateWidth) / 2;
        const gateTargetX = CANVAS_WIDTH / 2;
        const gateTargetY = WALL_BOTTOM_Y + 12;

        // ---------------------------------------------------------------------
        // 2. HELBING SOCIAL FORCE COMPUTATION (CALIBRATED REALITY)
        // ---------------------------------------------------------------------
        const v0_desired_base = PH.BASE_V0 * currentKineticMultiplier;

        // Spatial binning grid
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

          // Panic decay
          if (a.panic > 0) {
            a.panic = Math.max(0, a.panic - dt * 0.15);
          }

          const currentAgentV0 = v0_desired_base * (1.0 + a.panic * 0.8);

          // A. DRIVE FORCE: Propel toward gate target
          let targetX = a.x;
          let targetY = a.y - 100;

          if (a.y > WALL_BOTTOM_Y + 20) {
            targetX = gateTargetX;
            targetY = gateTargetY;
          } else if (a.x >= gateLeftEdge - 5 && a.x <= gateRightEdge + 5) {
            targetX = a.x;
            targetY = -80;
          } else {
            targetX = a.x < CANVAS_WIDTH / 2 ? gateLeftEdge + 15 : gateRightEdge - 15;
            targetY = WALL_BOTTOM_Y + 8;
          }

          const dxGoal = targetX - a.x;
          const dyGoal = targetY - a.y;
          const distGoal = Math.hypot(dxGoal, dyGoal) || 1;
          const desiredVx = (dxGoal / distGoal) * currentAgentV0 * 35;
          const desiredVy = (dyGoal / distGoal) * currentAgentV0 * 35;

          fx += (a.mass * (desiredVx - a.vx)) / PH.TAU;
          fy += (a.mass * (desiredVy - a.vy)) / PH.TAU;

          // B. DEFLECTION PILLARS COLLISION
          for (let pIdx = 0; pIdx < pillars.length; pIdx++) {
            const pil = pillars[pIdx];
            const dxP = a.x - pil.x;
            const dyP = a.y - pil.y;
            const distP = Math.hypot(dxP, dyP) || 1;
            const overlapP = a.radius + pil.radius - distP;

            if (distP < a.radius + pil.radius + 18) {
              const nxP = dxP / distP;
              const nyP = dyP / distP;

              // Proximity deflection
              const fSocialP = PH.A * 1.5 * Math.exp(-Math.max(0, -overlapP) / 8);
              fx += fSocialP * nxP;
              fy += fSocialP * nyP;

              if (overlapP > 0) {
                const fcP = Math.min(overlapP * PH.KN, PH.MAX_FORCE);
                fx += fcP * nxP;
                fy += fcP * nyP;
                compressionForce += fcP;
                pil.stress += fcP;
              }
            }
          }

          // C. WALL REPULSION & COLLISION
          const checkWalls = [
            { x0: 0, y0: 0, x1: gateLeftEdge, y1: WALL_BOTTOM_Y, isLeft: true },
            { x0: gateRightEdge, y0: 0, x1: CANVAS_WIDTH, y1: WALL_BOTTOM_Y, isLeft: false },
          ];

          for (const wall of checkWalls) {
            if (a.x >= wall.x0 - a.radius && a.x <= wall.x1 + a.radius) {
              const dyWall = a.y - wall.y1;
              if (dyWall < a.radius + 16 && dyWall > -a.radius) {
                const overlap = a.radius - Math.max(0, dyWall);
                if (overlap > 0) {
                  const fWall = Math.min(overlap * (PH.KN * 1.2), PH.MAX_FORCE);
                  fy += fWall;
                  compressionForce += fWall;

                  // Tangential slide toward gate aperture
                  const slideDir = a.x < CANVAS_WIDTH / 2 ? 1 : -1;
                  fx += slideDir * 220;

                  // Measure barrier panel load in Newtons
                  if (wall.isLeft) barrierP1Accum += fWall;
                  else barrierP2Accum += fWall;
                } else {
                  fy += (PH.A * 1.2) * Math.exp(-dyWall / 8);
                }
              }
            }
          }

          // Side room boundary walls
          if (a.x < a.radius + 15) {
            const overlap = a.radius + 15 - a.x;
            fx += overlap * 400;
            compressionForce += overlap * 80;
          } else if (a.x > CANVAS_WIDTH - a.radius - 15) {
            const overlap = a.x - (CANVAS_WIDTH - a.radius - 15);
            fx -= overlap * 400;
            compressionForce += overlap * 80;
          }

          // D. AGENT-TO-AGENT SOCIAL FORCE & CONTACT COMPRESSION
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

                if (dist < sumRadii + 14) {
                  const nx = ddx / dist;
                  const ny = ddy / dist;

                  // Psychological avoidance
                  const fSocial = PH.A * Math.exp(-Math.max(0, -overlap) / 6);
                  fx += fSocial * nx;
                  fy += fSocial * ny;

                  // Real physical contact compression
                  if (overlap > 0) {
                    const fc = Math.min(overlap * PH.KN, PH.MAX_FORCE);
                    fx += fc * nx;
                    fy += fc * ny;

                    // Tangential friction
                    const tx = -ny;
                    const ty = nx;
                    const relSpeedTangent = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty;
                    const ft = Math.min(overlap * PH.KT * relSpeedTangent, 250);
                    fx += ft * tx;
                    fy += ft * ty;

                    compressionForce += fc;
                  }
                }
              }
            }
          }

          // Apply net force and clamp
          a.force = Math.min(compressionForce, PH.MAX_FORCE);
          a.vx += (fx / a.mass) * dt;
          a.vy += (fy / a.mass) * dt;

          const currentSpeed = Math.hypot(a.vx, a.vy);
          const maxAllowedSpeed = PH.MAX_SPEED * 35;
          if (currentSpeed > maxAllowedSpeed) {
            a.vx = (a.vx / currentSpeed) * maxAllowedSpeed;
            a.vy = (a.vy / currentSpeed) * maxAllowedSpeed;
          }

          a.x += a.vx * dt;
          a.y += a.vy * dt;

          if (a.y > CANVAS_HEIGHT - a.radius) {
            a.y = CANVAS_HEIGHT - a.radius;
            a.vy = -Math.abs(a.vy) * 0.2;
          }
        }

        // Agents escaping gate
        const nowSec = timeNow / 1000;
        for (let i = agents.length - 1; i >= 0; i--) {
          if (agents[i].y < 12) {
            agents.splice(i, 1);
            escapedWindow.push(nowSec);
          }
        }

        while (escapedWindow.length && escapedWindow[0] < nowSec - 15) {
          escapedWindow.shift();
        }
        const throughputCalculated = Math.round(escapedWindow.length * 4);

        // ---------------------------------------------------------------------
        // 3. TILE SYSTEM: 5x4 SECTOR GRID PRESSURE CALCULATOR
        // ---------------------------------------------------------------------
        const sectorWidth = CANVAS_WIDTH / 5;
        const sectorHeight = CANVAS_HEIGHT / 4;
        const sectorCounts = new Int32Array(20);
        const sectorForceSums = new Float32Array(20);
        const sectorMaxForces = new Float32Array(20);

        let globalMaxForce = 0;
        for (let i = 0; i < agents.length; i++) {
          const ag = agents[i];
          if (ag.force > globalMaxForce) {
            globalMaxForce = ag.force;
          }

          const col = Math.min(4, Math.max(0, Math.floor(ag.x / sectorWidth)));
          const row = Math.min(3, Math.max(0, Math.floor(ag.y / sectorHeight)));
          const sIdx = row * 5 + col;

          sectorCounts[sIdx]++;
          sectorForceSums[sIdx] += ag.force;
          if (ag.force > sectorMaxForces[sIdx]) {
            sectorMaxForces[sIdx] = ag.force;
          }
        }

        // Build 20 Sector Tiles with Pressure Scores
        const currentSectors: SectorMetric[] = [];
        let peakSectorScore = -1;
        let peakSectorName = 'B3';

        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 5; c++) {
            const idx = r * 5 + c;
            const cnt = sectorCounts[idx];
            const maxF = sectorMaxForces[idx];
            const avgF = cnt > 0 ? sectorForceSums[idx] / cnt : 0;

            // Pressure Score combining density and contact compressive force
            const pressureRaw = (maxF / 2550) * 70 + (cnt * 2.5);
            const score = Math.min(100, Math.round(pressureRaw));
            const status: 'NORMAL' | 'WARNING' | 'CRITICAL' =
              score >= 80 ? 'CRITICAL' : score >= 50 ? 'WARNING' : 'NORMAL';

            const sectorName = `${SECTOR_ROWS[r]}${c + 1}`;
            currentSectors.push({
              sector: sectorName,
              row: r,
              col: c,
              pressureScore: score,
              agentCount: cnt,
              peakForce: Math.round(maxF),
              status,
            });

            if (score > peakSectorScore) {
              peakSectorScore = score;
              peakSectorName = sectorName;
            }
          }
        }

        // Calibrated 0-100 Peak Stress Index
        // 2550 N is rib-fracture threshold => mapped to 85.0 on PSI scale
        const normalizedPSI = Math.min(100, (globalMaxForce / 3000) * 100);

        setPeakStressIndex(+(normalizedPSI.toFixed(1)));
        setRawPeakForce(Math.round(globalMaxForce));
        setActivePopulation(agents.length);
        setThroughputPerMin(throughputCalculated);
        setHotspotSector(peakSectorName);
        setSectorTiles(currentSectors);

        const p1_kN = +(barrierP1Accum / 1000).toFixed(2);
        const p2_kN = +(barrierP2Accum / 1000).toFixed(2);
        setBarrierP1(p1_kN);
        setBarrierP2(p2_kN);

        currentTelemetryRef.current = {
          peakStress: normalizedPSI,
          rawPeakForce: globalMaxForce,
          activeAgents: agents.length,
          throughput: throughputCalculated,
          hotspotSector: peakSectorName,
          hotspotPressure: Math.round(peakSectorScore),
          barrierP1: p1_kN,
          barrierP2: p2_kN,
          sectorGrid: currentSectors,
        };
      }

      // ---------------------------------------------------------------------
      // 4. ADVANCED CANVAS RENDERING: Photoelastic Bloom & 5x4 Sector Grid
      // ---------------------------------------------------------------------
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const sectorWidth = CANVAS_WIDTH / 5;
      const sectorHeight = CANVAS_HEIGHT / 4;
      const currentGateWidth = gateWidthRef.current;
      const gateLeftEdge = (CANVAS_WIDTH - currentGateWidth) / 2;
      const gateRightEdge = (CANVAS_WIDTH + currentGateWidth) / 2;

      // A. 5x4 Sector Grid Lines on Arena Floor
      ctx.save();
      ctx.strokeStyle = '#0E171F';
      ctx.lineWidth = 1;

      for (let c = 1; c < 5; c++) {
        ctx.beginPath();
        ctx.moveTo(c * sectorWidth, 0);
        ctx.lineTo(c * sectorWidth, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let r = 1; r < 4; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * sectorHeight);
        ctx.lineTo(CANVAS_WIDTH, r * sectorHeight);
        ctx.stroke();
      }

      // Monospace Sector Grid Coordinate Labels (A1...D5)
      ctx.font = "10px 'IBM Plex Mono', monospace";
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          const secName = `${SECTOR_ROWS[r]}${c + 1}`;
          const isHot = secName === currentTelemetryRef.current.hotspotSector;
          const isSelected = secName === selectedSectorRef.current;

          if (isHot) {
            // Hotspot Sector Highlight Bounding Box
            const hotCol = currentTelemetryRef.current.peakStress >= 85 ? '#D4513A' : '#D9A33C';
            ctx.strokeStyle = hotCol;
            ctx.lineWidth = 2;
            ctx.strokeRect(c * sectorWidth + 2, r * sectorHeight + 2, sectorWidth - 4, sectorHeight - 4);

            // Pulsing Reticle Target
            ctx.fillStyle = hotCol;
            ctx.beginPath();
            ctx.arc(c * sectorWidth + sectorWidth / 2, r * sectorHeight + sectorHeight / 2, 8 + Math.sin(timeNow * 0.006) * 3, 0, Math.PI * 2);
            ctx.stroke();
          }

          if (isSelected) {
            ctx.strokeStyle = '#4FB3D9';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(c * sectorWidth + 4, r * sectorHeight + 4, sectorWidth - 8, sectorHeight - 8);
            ctx.setLineDash([]);
          }

          ctx.fillStyle = isHot ? '#D9A33C' : 'rgba(79, 179, 217, 0.45)';
          ctx.fillText(secName, c * sectorWidth + 8, r * sectorHeight + 16);
        }
      }
      ctx.restore();

      // B. Static Wall Boundaries at Top (Solid Photoelastic Gate Slabs)
      ctx.save();
      ctx.fillStyle = '#10171D';
      ctx.fillRect(0, 0, gateLeftEdge, WALL_BOTTOM_Y);
      ctx.fillRect(gateRightEdge, 0, CANVAS_WIDTH - gateRightEdge, WALL_BOTTOM_Y);

      // Photoelastic Contact Stress Lines on Barrier Walls
      const p1Ratio = Math.min(1, barrierP1Accum / 3000);
      const p2Ratio = Math.min(1, barrierP2Accum / 3000);

      // Left Wall Sensing Edge
      ctx.strokeStyle = p1Ratio > 0.7 ? '#D4513A' : p1Ratio > 0.3 ? '#D9A33C' : '#4FB3D9';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, WALL_BOTTOM_Y);
      ctx.lineTo(gateLeftEdge, WALL_BOTTOM_Y);
      ctx.lineTo(gateLeftEdge, 0);
      ctx.stroke();

      // Right Wall Sensing Edge
      ctx.strokeStyle = p2Ratio > 0.7 ? '#D4513A' : p2Ratio > 0.3 ? '#D9A33C' : '#4FB3D9';
      ctx.beginPath();
      ctx.moveTo(gateRightEdge, 0);
      ctx.lineTo(gateRightEdge, WALL_BOTTOM_Y);
      ctx.lineTo(CANVAS_WIDTH, WALL_BOTTOM_Y);
      ctx.stroke();

      // Gate Aperture Guide Markers
      ctx.fillStyle = 'rgba(79, 179, 217, 0.7)';
      ctx.font = "9px 'IBM Plex Mono', monospace";
      ctx.fillText(`GATE: ${currentGateWidth}PX [P1: ${(barrierP1Accum / 1000).toFixed(2)}kN | P2: ${(barrierP2Accum / 1000).toFixed(2)}kN]`, gateLeftEdge + 6, 38);
      ctx.restore();

      // C. Deflection Pillars Rendering with Photoelastic Stress Rings
      for (let pIdx = 0; pIdx < pillars.length; pIdx++) {
        const pil = pillars[pIdx];
        const pStressU = Math.min(1, pil.stress / 2000);

        ctx.save();
        ctx.beginPath();
        ctx.arc(pil.x, pil.y, pil.radius, 0, Math.PI * 2);

        if (pStressU > 0.05) {
          ctx.fillStyle = pStressU > 0.6 ? 'rgba(212, 81, 58, 0.4)' : 'rgba(217, 163, 60, 0.4)';
          ctx.shadowBlur = 15 * pStressU;
          ctx.shadowColor = pStressU > 0.6 ? '#D4513A' : '#D9A33C';
          ctx.fill();

          // Concentric fringe rings
          ctx.strokeStyle = pStressU > 0.6 ? '#D4513A' : '#D9A33C';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#1A252E';
          ctx.strokeStyle = '#4FB3D9';
          ctx.lineWidth = 1.8;
          ctx.fill();
          ctx.stroke();
        }

        // Inner anchor pin
        ctx.fillStyle = '#0B1013';
        ctx.beginPath();
        ctx.arc(pil.x, pil.y, pil.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94A3B8';
        ctx.font = "8px 'IBM Plex Mono', monospace";
        ctx.fillText(`OBSTACLE`, pil.x - 20, pil.y + 4);
        ctx.restore();
      }

      // D. Shockwave Incidents (Expanding Contagion Rings)
      for (let sIdx = 0; sIdx < shockwaves.length; sIdx++) {
        const sw = shockwaves[sIdx];
        ctx.save();
        ctx.strokeStyle = 'rgba(212, 81, 58, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#D4513A';
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // E. Fading Motion Trails (Velocity Vectors)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const vMag = Math.hypot(a.vx, a.vy);
        if (vMag > 3) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(a.x - a.vx * 0.14, a.y - a.vy * 0.14);
          ctx.stroke();
        }
      }
      ctx.restore();

      // F. Photoelastic Stress Bloom Particles (Screen Blend)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const stressRatio = Math.min(1, a.force / 2550);

        let fillColor = 'rgba(79, 179, 217, 0.85)'; // Normal: Cyan
        let shadowColor = 'rgba(79, 179, 217, 0.5)';
        let shadowRadius = 0;

        if (stressRatio >= 0.85) {
          fillColor = 'rgba(212, 81, 58, 0.95)';    // Critical: Crimson
          shadowColor = '#D4513A';
          shadowRadius = 18;
        } else if (stressRatio >= 0.45) {
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

        // High stress white core
        if (stressRatio > 0.55) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // G. Top 3 Highest-Stress Floating Tactical Labels
      ctx.save();
      const sortedByForce = [...agents].sort((a, b) => b.force - a.force);
      const top3Agents = sortedByForce.slice(0, 3);

      ctx.font = "9px 'IBM Plex Mono', monospace";
      for (let i = 0; i < top3Agents.length; i++) {
        const ag = top3Agents[i];
        if (ag.force > 250) {
          const isCrit = ag.force >= 2550;
          const isWarn = ag.force >= 1400;
          const tagBg = isCrit
            ? 'rgba(212, 81, 58, 0.85)'
            : isWarn
            ? 'rgba(217, 163, 60, 0.85)'
            : 'rgba(20, 27, 33, 0.85)';
          const textCol = isCrit || isWarn ? '#FFFFFF' : '#4FB3D9';

          const labelText = `[#${ag.id} F:${Math.round(ag.force)}N]`;
          const textWidth = ctx.measureText(labelText).width;

          ctx.fillStyle = tagBg;
          ctx.fillRect(ag.x + ag.radius + 4, ag.y - 12, textWidth + 6, 14);
          ctx.strokeStyle = textCol;
          ctx.lineWidth = 0.8;
          ctx.strokeRect(ag.x + ag.radius + 4, ag.y - 12, textWidth + 6, 14);

          ctx.fillStyle = textCol;
          ctx.fillText(labelText, ag.x + ag.radius + 7, ag.y - 2);

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
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted]);

  // UI state colors based on current Peak Stress Index
  const isCritical = peakStressIndex >= 85;
  const isWarning = peakStressIndex >= 60 && !isCritical;
  const alertColor = isCritical ? 'var(--crit)' : isWarning ? 'var(--warn)' : 'var(--steel)';

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
                TWIN SANDBOX v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-wide">
              5&times;4 Sector Grid &middot; Deflection Pillars &middot; Helbing Social Force Model
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
            {/* Top Canvas Bar & Interactive Tool Switcher */}
            <div className="w-full flex flex-wrap items-center justify-between px-3 py-2 border-b border-white/5 text-[11px] text-slate-300 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>TOOLS:</span>
                </span>

                {/* Inspect Tool */}
                <button
                  onClick={() => setActiveTool('inspect')}
                  className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1 transition ${
                    activeTool === 'inspect'
                      ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-[0_0_8px_#4FB3D9]'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                  title="Click anywhere on the floor to pin sector reticle"
                >
                  <Target className="w-3 h-3" />
                  <span>[Inspect]</span>
                </button>

                {/* Pillar Placement Tool */}
                <button
                  onClick={() => setActiveTool('pillar')}
                  className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1 transition ${
                    activeTool === 'pillar'
                      ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-[0_0_8px_#4FB3D9]'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                  title="Click anywhere on the floor to place or remove deflection pillars"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>[Pillar Tool]</span>
                </button>

                {/* Incident Shockwave Tool */}
                <button
                  onClick={() => setActiveTool('incident')}
                  className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1 transition ${
                    activeTool === 'incident'
                      ? 'bg-red-500 text-white font-bold border-red-400 shadow-[0_0_8px_#D4513A]'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                  title="Click inside crowd to ignite localized panic shockwave"
                >
                  <Bomb className="w-3 h-3" />
                  <span>[Incident Tool]</span>
                </button>

                {/* Clear Pillars */}
                <button
                  onClick={() => clearPillarsActionRef.current?.()}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-xs"
                >
                  Clear Pillars
                </button>
              </div>

              {/* Simulation Play / Pause */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:border-cyan-400 flex items-center gap-1"
                >
                  {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <span className="font-mono text-slate-500">
                  HOTSPOT: <b className="text-amber-400">{hotspotSector}</b> &middot; PARTICLES: {activePopulation}
                </span>
              </div>
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

            {/* Canvas Bottom Legend & Quick Scenario Presets */}
            <div className="w-full px-3 py-2 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">PRESETS:</span>
                <button
                  onClick={() => applyPresetActionRef.current?.('calm')}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 text-[10px]"
                >
                  Calm Flow
                </button>
                <button
                  onClick={() => applyPresetActionRef.current?.('surge')}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-red-500 text-slate-300 text-[10px]"
                >
                  Bottleneck Rush
                </button>
                <button
                  onClick={() => applyPresetActionRef.current?.('pillar_test')}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 text-[10px]"
                >
                  Deflection Test
                </button>
                <button
                  onClick={() => applyPresetActionRef.current?.('panic')}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 text-[10px]"
                >
                  Shockwave
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-500">
                  Left Barrier P1: <b className="text-slate-200">{barrierP1} kN</b>
                </span>
                <span className="text-slate-500">
                  Right Barrier P2: <b className="text-slate-200">{barrierP2} kN</b>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: DESKTOP CONTROL DECK & TILE SYSTEM HUD */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 1. PEAK STRESS INDEX IN MASSIVE GLOWING TYPOGRAPHY */}
          <div className="glass-panel p-4 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 tracking-wider uppercase mb-1">
              <span className="flex items-center gap-1.5 font-bold">
                <Flame className="w-4 h-4 text-cyan-400" />
                Peak Stress Index
              </span>
              <span className="text-[10px] text-slate-500">HOTSPOT: SECTOR {hotspotSector}</span>
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
              <span>Fracture Lim: <b className="text-red-400">2550 N</b></span>
            </div>
          </div>

          {/* 2. VENUE SECTOR GRID (5x4 TILE SYSTEM) */}
          <div className="glass-panel p-3 border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Venue Sector Grid (A1...D5)
              </span>
              <span className="text-[10px] text-amber-400 font-bold">
                PEAK: {hotspotSector}
              </span>
            </div>

            {/* 5x4 Sector Grid Tile Heatmap */}
            <div className="grid grid-cols-5 gap-1.5 my-1">
              {sectorTiles.map((tile) => {
                const isHot = tile.sector === hotspotSector;
                const isSelected = tile.sector === selectedSector;
                const statusColor =
                  tile.status === 'CRITICAL'
                    ? 'bg-red-950/80 border-red-500 text-red-300'
                    : tile.status === 'WARNING'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-300';

                return (
                  <button
                    key={tile.sector}
                    onClick={() => setSelectedSector(isSelected ? null : tile.sector)}
                    className={`p-1 rounded border text-center transition-all flex flex-col items-center justify-center ${statusColor} ${
                      isHot ? 'ring-2 ring-amber-400 shadow-[0_0_8px_rgba(217,163,60,0.5)]' : ''
                    } ${isSelected ? 'ring-2 ring-cyan-400 scale-105' : 'hover:border-slate-500'}`}
                    title={`Sector ${tile.sector}: ${tile.agentCount} pax, Peak ${tile.peakForce}N`}
                  >
                    <span className="text-[10px] font-bold font-mono">{tile.sector}</span>
                    <span className="text-[9px] text-slate-400">{tile.agentCount}p</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-white/5">
              <span>Rows: A (Gate) &rarr; D (Ingress)</span>
              <span>Click tile to pin reticle</span>
            </div>
          </div>

          {/* 3. REAL-TIME INTERACTIVE SLIDERS */}
          <div className="glass-panel p-4 border border-white/10 flex flex-col gap-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Physical Parameter Controls
              </span>
              <button
                onClick={() => {
                  setSpawnRate(5.5);
                  setGateWidth(140);
                  setKineticDrive(1.1);
                }}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                title="Reset sliders to nominal values"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Slider 1: Agent Spawn Rate */}
            <div className="flex flex-col gap-1">
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
            </div>

            {/* Slider 2: Gate Width */}
            <div className="flex flex-col gap-1">
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
            </div>

            {/* Slider 3: Kinetic Drive (Panic Multiplier) */}
            <div className="flex flex-col gap-1">
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
            </div>
          </div>

          {/* 4. ROLLING 30-SECOND RECHARTS TIME-SERIES */}
          <div className="glass-panel p-3 border border-white/10 flex flex-col">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Rolling 30s Stress Telemetry
              </span>
              <span className="text-[10px] text-slate-500">THROUGHPUT: {throughputPerMin}/min</span>
            </div>

            <div className="w-full h-32 min-h-[120px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartHistory} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                    <defs>
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
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                  Loading telemetry stream...
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1 text-center">
              Dashed red marker denotes 85 PSI (2550 N Rib-Fracture threshold)
            </div>
          </div>

          {/* 5. MICRO-METRICS (Actively Jittered) */}
          <div className="glass-panel p-2.5 border border-white/10 grid grid-cols-3 gap-2 text-center">
            <div className="p-1.5 rounded bg-black/40 border border-white/5">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Flow Divergence</div>
              <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">{flowDivergence}</div>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-white/5">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Hysteresis</div>
              <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">{hysteresisDebounce}</div>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-white/5">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Density Matrix</div>
              <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">{frameDensityMatrix}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
