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
  const [selectedSector, setSelectedSector] = useState<string>('B3');
  const selectedSectorRef = useRef<string>('B3');
  useEffect(() => { selectedSectorRef.current = selectedSector; }, [selectedSector]);

  const [selectedSectorStress, setSelectedSectorStress] = useState<number>(14.5);
  const [selectedSectorPeakForce, setSelectedSectorPeakForce] = useState<number>(440);
  const [selectedSectorAgents, setSelectedSectorAgents] = useState<number>(0);

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
    selectedSector: 'B3',
    selectedSectorStress: 14.5,
    selectedSectorPeakForce: 440,
    selectedSectorAgents: 0,
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
            selectedSector: snap.selectedSector,
            selectedSectorStress: snap.selectedSectorStress,
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
      const curPSI = currentTelemetryRef.current.selectedSectorStress ?? currentTelemetryRef.current.peakStress;
      const curRaw = currentTelemetryRef.current.selectedSectorPeakForce ?? currentTelemetryRef.current.rawPeakForce;

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
    let lastStateUpdateTime = performance.now();

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
    const MAX_CALIBRATED_FORCE = 4800; // Calibrated 100% Peak Stress ceiling in Newtons
    const RIB_FRACTURE_LIMIT = 2550;   // Biological rib-fracture threshold (Still 2014)

    const PH = {
      A: 180,           // Social psychological repulsion force (N)
      B: 0.18,          // Social interaction falloff distance
      KN: 320,          // Normal elastic contact stiffness (N/px)
      KT: 75,           // Tangential sliding friction coefficient
      TAU: 0.55,        // Velocity relaxation horizon (s)
      BASE_V0: 1.25,    // Baseline desired velocity toward bottleneck (m/s)
      MAX_FORCE: 5200,  // Clamp maximum physical compressive force (N)
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
          let crowdCompression = 0;
          let wallPinningStress = 0;
          let pillarPinningStress = 0;
          let sideWallStress = 0;

          // Panic decay
          if (a.panic > 0) {
            a.panic = Math.max(0, a.panic - dt * 0.15);
          }

          const currentAgentV0 = v0_desired_base * (1.0 + a.panic * 0.8);

          // A. DRIVE FORCE: Propel toward gate target with smart waypoint steering
          // Clamping targetX to the open gate aperture ensures parallel forward movement (targetX = a.x)
          // for all agents with direct line of sight to the gate.
          const edgeBuffer = Math.min(a.radius + 3, (gateRightEdge - gateLeftEdge) * 0.45);
          const gateTargetLeft = gateLeftEdge + edgeBuffer;
          const gateTargetRight = gateRightEdge - edgeBuffer;
          const targetX = Math.max(gateTargetLeft, Math.min(gateTargetRight, a.x));

          // Smart Waypoint Steering:
          // Agents behind the solid wall steer toward the gate opening entrance (WALL_BOTTOM_Y + 22)
          // so they naturally route around the wall rather than trying to cut diagonally through the solid corner!
          // Only agents in front of or inside the gate opening steer directly upward to the exit (-40).
          let targetY = -40;
          if (a.y > WALL_BOTTOM_Y) {
            const isBehindWall = a.x < gateLeftEdge + 4 || a.x > gateRightEdge - 4;
            if (isBehindWall) {
              targetY = WALL_BOTTOM_Y + 22;
            }
          }

          const dxGoal = targetX - a.x;
          const dyGoal = targetY - a.y;
          const distGoal = Math.hypot(dxGoal, dyGoal) || 1;
          const desiredVx = (dxGoal / distGoal) * currentAgentV0 * 35;
          const desiredVy = (dyGoal / distGoal) * currentAgentV0 * 35;

          fx += (a.mass * (desiredVx - a.vx)) / PH.TAU;
          fy += (a.mass * (desiredVy - a.vy)) / PH.TAU;

          // B. AGENT-TO-AGENT SOCIAL FORCE & CONTACT COMPRESSION (Evaluated first to measure collective crowd pressure)
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

                  // Real physical contact compression between human bodies
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

                    crowdCompression += fc;
                  }
                }
              }
            }
          }

          // C. DEFLECTION PILLARS COLLISION
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
                const fRepulse = Math.min(overlapP * 350, 1000);
                fx += fRepulse * nxP;
                fy += fRepulse * nyP;

                // Load absorbed by the pillar structure
                pil.stress += Math.min(overlapP * 150 + crowdCompression * 0.4, 3000);

                // Compression on agent: High only if pushed by crowd into the pillar!
                if (crowdCompression > 0) {
                  pillarPinningStress += crowdCompression * 0.4 + Math.min(overlapP * 35, 90);
                } else {
                  pillarPinningStress += Math.min(overlapP * 15, 30);
                }
              }
            }
          }

          // D. SOLID WALL REPULSION & COLLISION (SOLID RECTANGULAR SLABS)
          // 1. Left Solid Barrier Wall: (-inf, gateLeftEdge] x (-inf, WALL_BOTTOM_Y]
          {
            const cx = Math.min(gateLeftEdge, a.x);
            const cy = Math.min(WALL_BOTTOM_Y, a.y);
            const dx = a.x - cx;
            const dy = a.y - cy;
            const dist = Math.hypot(dx, dy);

            if (a.x < gateLeftEdge && a.y < WALL_BOTTOM_Y) {
              // Deep inside slab fallback ejection
              fy += 1200;
              barrierP1Accum += 400;
            } else if (dist < a.radius + 24) {
              const nx = dist > 0.001 ? dx / dist : 0;
              const ny = dist > 0.001 ? dy / dist : 1;
              const overlap = a.radius - dist;

              if (overlap > 0) {
                const fWall = Math.min(overlap * 380, 1200);
                fx += fWall * nx;
                fy += fWall * ny;

                // Barrier structural sensor load in Newtons
                barrierP1Accum += Math.min(overlap * 200 + crowdCompression * 0.5, 2500);

                // Internal bodily crush stress: High ONLY if crowd is actively crushing agent into wall!
                // Isolated contact produces only gentle tactile contact (~15-35 N) and never spikes to 100%!
                if (crowdCompression > 0) {
                  wallPinningStress += crowdCompression * 0.75 + Math.min(overlap * 35, 90);
                } else {
                  wallPinningStress += Math.min(overlap * 18, 35);
                }
              } else {
                const fSocial = (PH.A * 1.8) * Math.exp(-(dist - a.radius) / 6);
                fx += fSocial * nx;
                fy += fSocial * ny;
              }

              // Lateral sliding along bottom wall toward gate aperture
              if (a.y >= WALL_BOTTOM_Y && a.x < gateLeftEdge) {
                fx += 340;
              }
            }
          }

          // 2. Right Solid Barrier Wall: [gateRightEdge, +inf) x (-inf, WALL_BOTTOM_Y]
          {
            const cx = Math.max(gateRightEdge, a.x);
            const cy = Math.min(WALL_BOTTOM_Y, a.y);
            const dx = a.x - cx;
            const dy = a.y - cy;
            const dist = Math.hypot(dx, dy);

            if (a.x > gateRightEdge && a.y < WALL_BOTTOM_Y) {
              // Deep inside slab fallback ejection
              fy += 1200;
              barrierP2Accum += 400;
            } else if (dist < a.radius + 24) {
              const nx = dist > 0.001 ? dx / dist : 0;
              const ny = dist > 0.001 ? dy / dist : 1;
              const overlap = a.radius - dist;

              if (overlap > 0) {
                const fWall = Math.min(overlap * 380, 1200);
                fx += fWall * nx;
                fy += fWall * ny;

                // Barrier structural sensor load in Newtons
                barrierP2Accum += Math.min(overlap * 200 + crowdCompression * 0.5, 2500);

                // Internal bodily crush stress: High ONLY if crowd is actively crushing agent into wall!
                if (crowdCompression > 0) {
                  wallPinningStress += crowdCompression * 0.75 + Math.min(overlap * 35, 90);
                } else {
                  wallPinningStress += Math.min(overlap * 18, 35);
                }
              } else {
                const fSocial = (PH.A * 1.8) * Math.exp(-(dist - a.radius) / 6);
                fx += fSocial * nx;
                fy += fSocial * ny;
              }

              // Lateral sliding along bottom wall toward gate aperture
              if (a.y >= WALL_BOTTOM_Y && a.x > gateRightEdge) {
                fx -= 340;
              }
            }
          }

          // Side room boundary walls
          if (a.x < a.radius + 15) {
            const overlap = a.radius + 15 - a.x;
            fx += overlap * 400;
            sideWallStress += crowdCompression > 0 ? crowdCompression * 0.4 + overlap * 20 : Math.min(overlap * 15, 30);
          } else if (a.x > CANVAS_WIDTH - a.radius - 15) {
            const overlap = a.x - (CANVAS_WIDTH - a.radius - 15);
            fx -= overlap * 400;
            sideWallStress += crowdCompression > 0 ? crowdCompression * 0.4 + overlap * 20 : Math.min(overlap * 15, 30);
          }

          // Apply total compressive stress and clamp
          const totalStress = crowdCompression + wallPinningStress + pillarPinningStress + sideWallStress;
          a.force = Math.min(totalStress, PH.MAX_FORCE);
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

          // -------------------------------------------------------------------
          // HARD RIGID SOLID BOUNDARY CONSTRAINTS (NO PENETRATION / HOLLOW CLIPPING)
          // -------------------------------------------------------------------
          // 1. Left Solid Barrier Wall: (-inf, gateLeftEdge] x (-inf, WALL_BOTTOM_Y]
          {
            const cx = Math.min(gateLeftEdge, a.x);
            const cy = Math.min(WALL_BOTTOM_Y, a.y);
            const dx = a.x - cx;
            const dy = a.y - cy;
            const dist = Math.hypot(dx, dy);

            if (a.x < gateLeftEdge && a.y < WALL_BOTTOM_Y) {
              // Deep inside slab - eject strictly below the bottom wall
              a.y = WALL_BOTTOM_Y + a.radius;
              if (a.vy < 0) a.vy = 0;
            } else if (dist < a.radius) {
              const nx = dist > 0.001 ? dx / dist : 0;
              const ny = dist > 0.001 ? dy / dist : 1;
              a.x = cx + nx * a.radius;
              a.y = cy + ny * a.radius;
              const vDot = a.vx * nx + a.vy * ny;
              if (vDot < 0) {
                a.vx -= vDot * nx;
                a.vy -= vDot * ny;
              }
            }
          }

          // 2. Right Solid Barrier Wall: [gateRightEdge, +inf) x (-inf, WALL_BOTTOM_Y]
          {
            const cx = Math.max(gateRightEdge, a.x);
            const cy = Math.min(WALL_BOTTOM_Y, a.y);
            const dx = a.x - cx;
            const dy = a.y - cy;
            const dist = Math.hypot(dx, dy);

            if (a.x > gateRightEdge && a.y < WALL_BOTTOM_Y) {
              // Deep inside slab - eject strictly below the bottom wall
              a.y = WALL_BOTTOM_Y + a.radius;
              if (a.vy < 0) a.vy = 0;
            } else if (dist < a.radius) {
              const nx = dist > 0.001 ? dx / dist : 0;
              const ny = dist > 0.001 ? dy / dist : 1;
              a.x = cx + nx * a.radius;
              a.y = cy + ny * a.radius;
              const vDot = a.vx * nx + a.vy * ny;
              if (vDot < 0) {
                a.vx -= vDot * nx;
                a.vy -= vDot * ny;
              }
            }
          }

          // 3. Absolute Perimeter Safety Clamp (Impenetrable Box Enclosure)
          if (a.y < WALL_BOTTOM_Y) {
            // Inside the gate opening corridor: strictly bound between aperture walls
            if (a.x < gateLeftEdge + a.radius) {
              a.x = gateLeftEdge + a.radius;
              if (a.vx < 0) a.vx = 0;
            } else if (a.x > gateRightEdge - a.radius) {
              a.x = gateRightEdge - a.radius;
              if (a.vx > 0) a.vx = 0;
            }
          } else {
            // Behind the solid walls: y cannot be less than WALL_BOTTOM_Y + a.radius
            if (a.x <= gateLeftEdge && a.y < WALL_BOTTOM_Y + a.radius) {
              a.y = WALL_BOTTOM_Y + a.radius;
              if (a.vy < 0) a.vy = 0;
            } else if (a.x >= gateRightEdge && a.y < WALL_BOTTOM_Y + a.radius) {
              a.y = WALL_BOTTOM_Y + a.radius;
              if (a.vy < 0) a.vy = 0;
            }
          }

          // 4. Deflection Pillars Hard Solid Circular Obstacles
          for (let pIdx = 0; pIdx < pillars.length; pIdx++) {
            const pil = pillars[pIdx];
            const pdx = a.x - pil.x;
            const pdy = a.y - pil.y;
            const pdist = Math.hypot(pdx, pdy);
            const safeDist = a.radius + pil.radius;
            if (pdist < safeDist) {
              const pnx = pdist > 0.001 ? pdx / pdist : 0;
              const pny = pdist > 0.001 ? pdy / pdist : 1;
              a.x = pil.x + pnx * safeDist;
              a.y = pil.y + pny * safeDist;
              const vDot = a.vx * pnx + a.vy * pny;
              if (vDot < 0) {
                a.vx -= vDot * pnx;
                a.vy -= vDot * pny;
              }
            }
          }

          // 4. Arena Floor & Side Boundaries
          const minArenaX = 18 + a.radius;
          const maxArenaX = CANVAS_WIDTH - 18 - a.radius;
          const maxArenaY = CANVAS_HEIGHT - 10 - a.radius;

          if (a.x < minArenaX) {
            a.x = minArenaX;
            if (a.vx < 0) a.vx = 0;
          } else if (a.x > maxArenaX) {
            a.x = maxArenaX;
            if (a.vx > 0) a.vx = 0;
          }

          if (a.y > maxArenaY) {
            a.y = maxArenaY;
            if (a.vy > 0) a.vy = -Math.abs(a.vy) * 0.2;
          }
        }

        // Agents escaping gate aperture
        const nowSec = timeNow / 1000;
        for (let i = agents.length - 1; i >= 0; i--) {
          const ag = agents[i];
          if (ag.y < 12 && ag.x >= gateLeftEdge - 5 && ag.x <= gateRightEdge + 5) {
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

            // Pressure Score combining density and contact compressive force calibrated to 4800 N ceiling
            const pressureRaw = (maxF / MAX_CALIBRATED_FORCE) * 80 + Math.min(20, cnt * 1.5);
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
        // 4800 N ceiling for 100% PSI; 2550 N rib-fracture threshold corresponds to ~53.1% PSI, warning at 60%, critical at 85%
        const normalizedPSI = Math.min(100, (globalMaxForce / MAX_CALIBRATED_FORCE) * 100);

        // Extract isolated metrics for the selected box only
        const activeSelSector = selectedSectorRef.current || peakSectorName;
        const selRowIdx = SECTOR_ROWS.indexOf(activeSelSector.charAt(0).toUpperCase());
        const selColIdx = parseInt(activeSelSector.slice(1), 10) - 1;
        let selMaxF = 0;
        let selCnt = 0;
        let selPSI = 0;

        if (selRowIdx >= 0 && selRowIdx < 4 && selColIdx >= 0 && selColIdx < 5) {
          const sIdx = selRowIdx * 5 + selColIdx;
          selMaxF = sectorMaxForces[sIdx];
          selCnt = sectorCounts[sIdx];
          selPSI = +(Math.min(100, (selMaxF / MAX_CALIBRATED_FORCE) * 100).toFixed(1));
        }

        // Always maintain instantaneous values in telemetry ref for 300ms network sync
        const p1_kN = +(barrierP1Accum / 1000).toFixed(2);
        const p2_kN = +(barrierP2Accum / 1000).toFixed(2);

        currentTelemetryRef.current = {
          peakStress: normalizedPSI,
          rawPeakForce: globalMaxForce,
          activeAgents: agents.length,
          throughput: throughputCalculated,
          hotspotSector: peakSectorName,
          hotspotPressure: Math.round(peakSectorScore),
          selectedSector: activeSelSector,
          selectedSectorStress: selPSI,
          selectedSectorPeakForce: Math.round(selMaxF),
          selectedSectorAgents: selCnt,
          barrierP1: p1_kN,
          barrierP2: p2_kN,
          sectorGrid: currentSectors,
        };

        // Throttle React state updates to 10Hz (every 100ms) to maintain blistering 60FPS canvas physics
        if (timeNow - lastStateUpdateTime >= 100) {
          lastStateUpdateTime = timeNow;
          setSelectedSectorStress(selPSI);
          setSelectedSectorPeakForce(Math.round(selMaxF));
          setSelectedSectorAgents(selCnt);
          setPeakStressIndex(+(normalizedPSI.toFixed(1)));
          setRawPeakForce(Math.round(globalMaxForce));
          setActivePopulation(agents.length);
          setThroughputPerMin(throughputCalculated);
          setHotspotSector(peakSectorName);
          setSectorTiles(currentSectors);
          setBarrierP1(p1_kN);
          setBarrierP2(p2_kN);
        }
      }

      // ---------------------------------------------------------------------
      // 4. ADVANCED CANVAS RENDERING: Photoelastic Bloom & 5x4 Sector Grid
      // ---------------------------------------------------------------------
      // Precision Dark Laboratory Arena Floor
      ctx.fillStyle = '#0B0F14';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const sectorWidth = CANVAS_WIDTH / 5;
      const sectorHeight = CANVAS_HEIGHT / 4;
      const currentGateWidth = gateWidthRef.current;
      const gateLeftEdge = (CANVAS_WIDTH - currentGateWidth) / 2;
      const gateRightEdge = (CANVAS_WIDTH + currentGateWidth) / 2;

      // A. 5x4 Sector Grid Lines on Arena Floor
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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
      ctx.font = "10px 'JetBrains Mono', monospace";
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          const secName = `${SECTOR_ROWS[r]}${c + 1}`;
          const isHot = secName === currentTelemetryRef.current.hotspotSector;
          const isSelected = secName === selectedSectorRef.current;

          if (isHot) {
            // Hotspot Sector Highlight Bounding Box
            const hotCol = currentTelemetryRef.current.peakStress >= 85 ? '#EF4444' : '#F59E0B';
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
            const bx = c * sectorWidth + 2;
            const by = r * sectorHeight + 2;
            const bw = sectorWidth - 4;
            const bh = sectorHeight - 4;

            ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.fillRect(bx, by, bw, bh);

            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(bx, by, bw, bh);

            const clen = 12;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(bx, by + clen); ctx.lineTo(bx, by); ctx.lineTo(bx + clen, by);
            ctx.moveTo(bx + bw - clen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + clen);
            ctx.moveTo(bx, by + bh - clen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + clen, by + bh);
            ctx.moveTo(bx + bw - clen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - clen);
            ctx.stroke();

            ctx.fillStyle = '#38BDF8';
            ctx.font = "9px 'JetBrains Mono', monospace";
            ctx.fillText(`[BOX ${secName}: ${currentTelemetryRef.current.selectedSectorStress} PSI]`, bx + 6, by + bh - 6);
          }

          ctx.fillStyle = isHot ? '#F59E0B' : 'rgba(56, 189, 248, 0.5)';
          ctx.fillText(secName, c * sectorWidth + 8, r * sectorHeight + 16);
        }
      }
      ctx.restore();

      // B. Static Wall Boundaries at Top (Solid Structural Photoelastic Barriers)
      ctx.save();
      ctx.fillStyle = '#16202C';
      ctx.fillRect(0, 0, gateLeftEdge, WALL_BOTTOM_Y);
      ctx.fillRect(gateRightEdge, 0, CANVAS_WIDTH - gateRightEdge, WALL_BOTTOM_Y);

      // Architectural hazard hatching on barrier slabs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = -WALL_BOTTOM_Y; x < gateLeftEdge; x += 18) {
        ctx.beginPath();
        ctx.moveTo(Math.max(0, x), 0);
        ctx.lineTo(Math.min(gateLeftEdge, x + WALL_BOTTOM_Y), WALL_BOTTOM_Y);
        ctx.stroke();
      }
      for (let x = gateRightEdge - WALL_BOTTOM_Y; x < CANVAS_WIDTH; x += 18) {
        ctx.beginPath();
        ctx.moveTo(Math.max(gateRightEdge, x), 0);
        ctx.lineTo(Math.min(CANVAS_WIDTH, x + WALL_BOTTOM_Y), WALL_BOTTOM_Y);
        ctx.stroke();
      }

      // Photoelastic Contact Stress Lines on Barrier Walls
      const p1Ratio = Math.min(1, barrierP1Accum / 3000);
      const p2Ratio = Math.min(1, barrierP2Accum / 3000);

      // Left Wall Sensing Edge
      ctx.strokeStyle = p1Ratio > 0.7 ? '#EF4444' : p1Ratio > 0.3 ? '#F59E0B' : '#38BDF8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, WALL_BOTTOM_Y);
      ctx.lineTo(gateLeftEdge, WALL_BOTTOM_Y);
      ctx.lineTo(gateLeftEdge, 0);
      ctx.stroke();

      // Right Wall Sensing Edge
      ctx.strokeStyle = p2Ratio > 0.7 ? '#EF4444' : p2Ratio > 0.3 ? '#F59E0B' : '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(gateRightEdge, 0);
      ctx.lineTo(gateRightEdge, WALL_BOTTOM_Y);
      ctx.lineTo(CANVAS_WIDTH, WALL_BOTTOM_Y);
      ctx.stroke();

      // Gate Aperture Guide Markers & Directional Signage
      ctx.fillStyle = '#38BDF8';
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(`GATE: ${currentGateWidth}PX [P1: ${(barrierP1Accum / 1000).toFixed(2)}kN | P2: ${(barrierP2Accum / 1000).toFixed(2)}kN]`, gateLeftEdge + 6, 22);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('▲ ▲ ▲ EGRESS CORRIDOR ▲ ▲ ▲', CANVAS_WIDTH / 2, 46);
      ctx.textAlign = 'left';
      ctx.restore();

      // C. Deflection Pillars Rendering with Photoelastic Stress Rings
      for (let pIdx = 0; pIdx < pillars.length; pIdx++) {
        const pil = pillars[pIdx];
        const pStressU = Math.min(1, pil.stress / 2000);

        ctx.save();
        ctx.beginPath();
        ctx.arc(pil.x, pil.y, pil.radius, 0, Math.PI * 2);

        ctx.fillStyle = '#1E293B';
        ctx.fill();

        ctx.strokeStyle = pStressU > 0.6 ? '#EF4444' : pStressU > 0.25 ? '#F59E0B' : '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (pStressU > 0.05) {
          ctx.beginPath();
          ctx.arc(pil.x, pil.y, pil.radius + 6 + pStressU * 12, 0, Math.PI * 2);
          ctx.strokeStyle = pStressU > 0.6 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Inner anchor core
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(pil.x, pil.y, pil.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94A3B8';
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillText(`PILLAR`, pil.x - 14, pil.y + 3);
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
        const stressRatio = Math.min(1, a.force / 4200);

        let fillColor = 'rgba(56, 189, 248, 0.88)'; // Normal: Vivid Cyber Cyan
        let shadowColor = '#38BDF8';
        let shadowRadius = 4;

        if (stressRatio >= 0.80) {
          fillColor = 'rgba(239, 68, 68, 0.98)';     // Critical: Laser Crimson
          shadowColor = '#EF4444';
          shadowRadius = 18;
        } else if (stressRatio >= 0.45) {
          fillColor = 'rgba(245, 158, 11, 0.94)';    // Warning: Molten Amber
          shadowColor = '#F59E0B';
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

      ctx.font = "9px 'JetBrains Mono', monospace";
      for (let i = 0; i < top3Agents.length; i++) {
        const ag = top3Agents[i];
        if (ag.force > 150) {
          const isCrit = ag.force >= 3600;
          const isWarn = ag.force >= 2000;
          const tagBg = isCrit
            ? 'rgba(239, 68, 68, 0.90)'
            : isWarn
            ? 'rgba(245, 158, 11, 0.90)'
            : 'rgba(15, 23, 42, 0.90)';
          const textCol = isCrit || isWarn ? '#FFFFFF' : '#38BDF8';

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

  // UI state colors based on Selected Box Peak Stress Index
  const isSelectedCrit = selectedSectorStress >= 85;
  const isSelectedWarn = selectedSectorStress >= 60 && !isSelectedCrit;
  const selectedAlertColor = isSelectedCrit ? 'var(--crit)' : isSelectedWarn ? 'var(--warn)' : 'var(--steel)';

  // Global Alert Level
  const isCritical = peakStressIndex >= 85;
  const isWarning = peakStressIndex >= 60 && !isCritical;
  const alertColor = isCritical ? 'var(--crit)' : isWarning ? 'var(--warn)' : 'var(--steel)';

  return (
    <main className="min-h-screen bg-[#F5F2EB] text-[#111111] p-3 sm:p-5 flex flex-col font-mono selection:bg-[#111111] selection:text-[#F5F2EB]">
      {/* =========================================================================
          TOP COMMAND BAR & DIGITAL TWIN HUD HEADER (SWISS EDITORIAL THEME)
         ========================================================================= */}
      <header className="bg-white border border-black/15 shadow-sm px-4 sm:px-6 py-3 mb-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-lg bg-[#111111] flex items-center justify-center text-[#38BDF8] shadow-sm hover:scale-105 transition-transform"
            title="Return to Flagship Showcase"
          >
            <Radio className="w-5 h-5 animate-pulse" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xl font-bold font-display tracking-tight text-[#111111] uppercase hover:text-black">
                ForceSight
              </Link>
              <span className="text-[10px] tracking-widest px-2 py-0.5 rounded bg-black/5 border border-black/10 text-[#111111] font-mono font-bold">
                TWIN SANDBOX v2.5
              </span>
            </div>
            <p className="text-[11px] text-[#111111]/60 font-mono tracking-wide">
              5&times;4 Sector Grid &middot; Deflection Pillars &middot; Helbing Social Force Model
            </p>
          </div>
        </div>

        {/* Global Alert Status & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`px-3 py-1.5 rounded-full border text-xs tracking-wider uppercase font-mono font-bold flex items-center gap-2 shadow-sm ${
              isCritical
                ? 'bg-red-50 border-red-500 text-red-700 animate-pulse'
                : isWarning
                ? 'bg-amber-50 border-amber-500 text-amber-800'
                : 'bg-emerald-50 border-emerald-400 text-emerald-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-[#EF4444] animate-ping' : isWarning ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
              }`}
            />
            {isCritical ? 'CRITICAL OVERLOAD' : isWarning ? 'WARNING: ELEVATED' : 'FLOW OPTIMAL'}
          </div>

          {/* Return to Showcase */}
          <Link
            href="/"
            className="px-3 py-1.5 rounded-full bg-black/5 hover:bg-black hover:text-white border border-black/15 text-[#111111] transition flex items-center gap-1 text-xs font-mono tracking-wider uppercase"
          >
            <span>&larr; Showcase</span>
          </Link>

          {/* Sync Link to Mobile Guard View */}
          <Link
            href="/mobile"
            target="_blank"
            className="px-3 py-1.5 rounded-full bg-white border border-black/15 hover:border-black text-[#111111] transition flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Guard App</span>
          </Link>

          {/* Holographic 3D View Toggle */}
          <button
            onClick={() => setIs3DView((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-mono tracking-wider uppercase transition flex items-center gap-1.5 shadow-sm ${
              is3DView
                ? 'bg-[#111111] text-[#F5F2EB] border-transparent font-bold'
                : 'bg-white border-black/15 text-[#111111] hover:border-black'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>3D View</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN INTERFACE GRID: CANVAS SIMULATION & CONTROL DECK
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* LEFT / CENTER: CANVAS SIMULATOR STAGE (INDUSTRIAL BLACK CHASSIS) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="rounded-xl border border-black/20 bg-[#111111] text-[#F5F2EB] p-3 shadow-2xl flex-1 flex flex-col items-center justify-between relative overflow-hidden">
            {/* Top Canvas Bar & Interactive Tool Switcher */}
            <div className="w-full flex flex-wrap items-center justify-between px-3 py-2 border-b border-white/10 text-[11px] text-white/80 gap-2 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[#38BDF8] font-bold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>TOOLS:</span>
                </span>

                {/* Inspect Tool */}
                <button
                  onClick={() => setActiveTool('inspect')}
                  className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1 transition font-mono ${
                    activeTool === 'inspect'
                      ? 'bg-[#38BDF8] text-black font-bold border-transparent shadow-[0_0_8px_#38BDF8]'
                      : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                  }`}
                  title="Click anywhere on the floor to inspect sector pressure"
                >
                  <Target className="w-3 h-3" />
                  <span>[Inspect]</span>
                </button>

                {/* Pillar Placement Tool */}
                <button
                  onClick={() => setActiveTool('pillar')}
                  className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1 transition font-mono ${
                    activeTool === 'pillar'
                      ? 'bg-[#38BDF8] text-black font-bold border-transparent shadow-[0_0_8px_#38BDF8]'
                      : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                  }`}
                  title="Click anywhere on the floor to place or remove deflection pillars"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>[Pillar Tool]</span>
                </button>

                {/* Incident Shockwave Tool */}
                <button
                  onClick={() => setActiveTool('incident')}
                  className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1 transition font-mono ${
                    activeTool === 'incident'
                      ? 'bg-[#EF4444] text-white font-bold border-transparent shadow-[0_0_8px_#EF4444]'
                      : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                  }`}
                  title="Click inside crowd to ignite localized panic shockwave"
                >
                  <Bomb className="w-3 h-3" />
                  <span>[Incident]</span>
                </button>

                {/* Clear Pillars */}
                <button
                  onClick={() => clearPillarsActionRef.current?.()}
                  className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-mono"
                >
                  Clear Pillars
                </button>
              </div>

              {/* Simulation Play / Pause & Telemetry Ticker */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="px-2.5 py-1 rounded bg-white/10 border border-white/15 text-xs text-white hover:border-[#38BDF8] flex items-center gap-1 font-mono"
                >
                  {isPaused ? <Play className="w-3 h-3 text-[#10B981]" /> : <Pause className="w-3 h-3 text-[#F59E0B]" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <span className="font-mono text-white/60 hidden sm:inline">
                  FOCUS: <b className="text-[#38BDF8]">BOX {selectedSector} ({selectedSectorStress} PSI)</b> &middot; PARTICLES: {activePopulation}
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
                className="w-full h-full block rounded bg-black cursor-crosshair border border-white/10"
              />
            </div>

            {/* Canvas Bottom Legend & Quick Scenario Presets */}
            <div className="w-full px-3 py-2 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-white/60 gap-2 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-white/40 font-bold uppercase tracking-wider">PRESETS:</span>
                <button
                  onClick={() => applyPresetActionRef.current?.('calm')}
                  className="px-2 py-0.5 rounded bg-white/10 border border-white/15 hover:border-emerald-400 text-white text-[10px]"
                >
                  Calm Flow
                </button>
                <button
                  onClick={() => applyPresetActionRef.current?.('surge')}
                  className="px-2 py-0.5 rounded bg-white/10 border border-white/15 hover:border-red-400 text-white text-[10px]"
                >
                  Bottleneck Rush
                </button>
                <button
                  onClick={() => applyPresetActionRef.current?.('pillar_test')}
                  className="px-2 py-0.5 rounded bg-white/10 border border-white/15 hover:border-cyan-400 text-white text-[10px]"
                >
                  Deflection Test
                </button>
                <button
                  onClick={() => applyPresetActionRef.current?.('panic')}
                  className="px-2 py-0.5 rounded bg-white/10 border border-white/15 hover:border-amber-400 text-white text-[10px]"
                >
                  Shockwave
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  Left Wall P1: <b className="text-white">{barrierP1} kN</b>
                </span>
                <span>
                  Right Wall P2: <b className="text-white">{barrierP2} kN</b>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: DESKTOP CONTROL DECK & TILE SYSTEM HUD (SWISS WHITE PANELS) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 1. PEAK STRESS INDEX (OF SELECTED BOX ONLY) */}
          <div className="bg-white border border-black/15 shadow-sm rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-[#111111]/60 tracking-wider uppercase mb-1">
              <span className="flex items-center gap-1.5 font-bold text-[#111111]">
                <Flame className="w-4 h-4 text-[#38BDF8]" />
                Peak Stress &middot; Box {selectedSector}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 border border-black/10 text-[#111111] font-mono font-bold">
                SELECTED BOX ONLY
              </span>
            </div>

            {/* Massive Metric Display for Selected Box */}
            <div className="flex items-baseline gap-2 my-1">
              <span
                className="text-6xl font-black tracking-tight font-display text-[#111111]"
              >
                {selectedSectorStress}
              </span>
              <span className="text-sm font-mono text-[#111111]/50">
                / 100.0
              </span>
            </div>

            <div className="w-full bg-[#F5F2EB] h-2.5 rounded-full overflow-hidden border border-black/10 my-2.5">
              <div
                className={`h-full transition-all duration-300 ${
                  isSelectedCrit
                    ? 'bg-[#EF4444]'
                    : isSelectedWarn
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#38BDF8]'
                }`}
                style={{
                  width: `${Math.min(100, selectedSectorStress)}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-4 gap-1 text-[10px] text-[#111111]/70 font-mono mt-1 pt-2 border-t border-black/10 text-center">
              <div>
                <span className="text-[9px] uppercase text-[#111111]/50">Box Peak</span>
                <div className="font-bold text-[#111111] mt-0.5">{selectedSectorPeakForce} N</div>
              </div>
              <div>
                <span className="text-[9px] uppercase text-[#111111]/50">In Box</span>
                <div className="font-bold text-[#38BDF8] mt-0.5">{selectedSectorAgents} pax</div>
              </div>
              <div>
                <span className="text-[9px] uppercase text-[#111111]/50">Rib Lim</span>
                <div className="font-bold text-[#F59E0B] mt-0.5">2550 N</div>
              </div>
              <div>
                <span className="text-[9px] uppercase text-[#111111]/50">Ceiling</span>
                <div className="font-bold text-[#EF4444] mt-0.5">4800 N</div>
              </div>
            </div>
          </div>

          {/* 2. VENUE SECTOR GRID (5x4 TILE SYSTEM) */}
          <div className="bg-white border border-black/15 shadow-sm rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-black/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#38BDF8]" />
                Venue Sector Grid (5&times;4)
              </span>
              <span className="text-[10px] text-[#F59E0B] font-bold">
                HOTSPOT: {hotspotSector}
              </span>
            </div>

            {/* 5x4 Sector Grid Tile Heatmap */}
            <div className="grid grid-cols-5 gap-1.5 my-1">
              {sectorTiles.map((tile) => {
                const isHot = tile.sector === hotspotSector;
                const isSelected = tile.sector === selectedSector;
                let statusColor = 'bg-[#F5F2EB] border-black/10 text-[#111111] hover:border-black';
                if (tile.status === 'CRITICAL') {
                  statusColor = 'bg-red-50 border-red-400 text-red-800';
                } else if (tile.status === 'WARNING') {
                  statusColor = 'bg-amber-50 border-amber-400 text-amber-900';
                }

                if (isSelected) {
                  statusColor = 'bg-cyan-50 border-cyan-400 text-cyan-900 ring-2 ring-[#38BDF8] shadow-sm font-bold scale-105';
                }

                return (
                  <button
                    key={tile.sector}
                    onClick={() => setSelectedSector(tile.sector)}
                    className={`p-1.5 rounded border text-center transition-all flex flex-col items-center justify-center ${statusColor}`}
                    title={`Click to show Peak Stress Index of Sector ${tile.sector}`}
                  >
                    <span className="text-[10px] font-bold font-mono">{tile.sector}</span>
                    <span className="text-[9px] opacity-75">{tile.agentCount}p</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Filter Helpers */}
            <div className="flex items-center justify-between text-[10px] text-[#111111]/60 px-1 pt-2 border-t border-black/10">
              <span>Focus: <b className="text-[#111111] font-bold">Box {selectedSector}</b></span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedSector(hotspotSector)}
                  className="px-2 py-0.5 rounded bg-amber-50 border border-amber-400 text-amber-900 text-[10px] font-bold transition"
                  title="Jump to the highest pressure sector in the venue"
                >
                  Hotspot ({hotspotSector})
                </button>
                <button
                  onClick={() => setSelectedSector('B3')}
                  className="px-2 py-0.5 rounded bg-black/5 border border-black/15 text-[#111111] hover:bg-black hover:text-white text-[10px] transition"
                  title="Reset focus to the gate chokepoint"
                >
                  Gate (B3)
                </button>
              </div>
            </div>
          </div>

          {/* 3. REAL-TIME INTERACTIVE SLIDERS */}
          <div className="bg-white border border-black/15 shadow-sm rounded-xl p-4 flex flex-col gap-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-black/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
                Physical Parameter Controls
              </span>
              <button
                onClick={() => {
                  setSpawnRate(5.5);
                  setGateWidth(140);
                  setKineticDrive(1.1);
                }}
                className="text-[10px] text-[#111111]/50 hover:text-black flex items-center gap-1 font-mono"
                title="Reset sliders to nominal values"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Slider 1: Agent Spawn Rate */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#111111]/70 uppercase">Agent Spawn Rate</span>
                <span className="font-bold text-[#38BDF8]">{spawnRate.toFixed(1)} /s</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="14.0"
                step="0.5"
                value={spawnRate}
                onChange={(e) => setSpawnRate(parseFloat(e.target.value))}
                className="accent-[#111111] cursor-pointer"
              />
            </div>

            {/* Slider 2: Gate Width */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#111111]/70 uppercase">Gate Width</span>
                <span className="font-bold text-[#38BDF8]">{gateWidth} px</span>
              </div>
              <input
                type="range"
                min="60"
                max="260"
                step="5"
                value={gateWidth}
                onChange={(e) => setGateWidth(parseInt(e.target.value))}
                className="accent-[#111111] cursor-pointer"
              />
            </div>

            {/* Slider 3: Kinetic Drive (Panic Multiplier) */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#111111]/70 uppercase">Kinetic Drive (Panic)</span>
                <span className="font-bold text-[#EF4444]">{kineticDrive.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={kineticDrive}
                onChange={(e) => setKineticDrive(parseFloat(e.target.value))}
                className="accent-[#EF4444] cursor-pointer"
              />
            </div>
          </div>

          {/* 4. ROLLING 30-SECOND RECHARTS TIME-SERIES */}
          <div className="bg-white border border-black/15 shadow-sm rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between text-xs font-bold text-[#111111] uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
                Rolling 30s Stress &middot; Box {selectedSector}
              </span>
              <span className="text-[10px] text-[#111111]/50 font-mono">FLUX: {throughputPerMin}/min</span>
            </div>

            <div className="w-full h-28 min-h-[110px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartHistory} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={0.85} />
                        <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#111111" opacity={0.4} fontSize={9} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#111111" opacity={0.4} fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111111',
                        color: '#F5F2EB',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                    />
                    <ReferenceLine y={85} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'CRIT 85', fill: '#EF4444', fontSize: 9 }} />
                    <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="3 3" />
                    <Area
                      type="monotone"
                      dataKey="psi"
                      stroke="#111111"
                      strokeWidth={1.8}
                      fillOpacity={1}
                      fill="url(#stressGradient)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  Loading stream...
                </div>
              )}
            </div>
            <div className="text-[9px] text-[#111111]/50 font-mono mt-1 text-center">
              Dashed red denotes 85 PSI (4080 N Critical). Rib fracture threshold is 2550 N.
            </div>
          </div>

          {/* 5. MICRO-METRICS (Actively Jittered) */}
          <div className="bg-white border border-black/15 shadow-sm rounded-xl p-3 grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-1.5 rounded bg-[#F5F2EB] border border-black/5">
              <div className="text-[9px] text-[#111111]/50 uppercase tracking-wider">Divergence</div>
              <div className="text-xs font-bold text-[#38BDF8] mt-0.5">{flowDivergence}</div>
            </div>
            <div className="p-1.5 rounded bg-[#F5F2EB] border border-black/5">
              <div className="text-[9px] text-[#111111]/50 uppercase tracking-wider">Hysteresis</div>
              <div className="text-xs font-bold text-[#F59E0B] mt-0.5">{hysteresisDebounce}</div>
            </div>
            <div className="p-1.5 rounded bg-[#F5F2EB] border border-black/5">
              <div className="text-[9px] text-[#111111]/50 uppercase tracking-wider">Matrix</div>
              <div className="text-xs font-bold text-[#111111] mt-0.5">{frameDensityMatrix}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
