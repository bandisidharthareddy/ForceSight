'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Radio,
  Flame,
  AlertTriangle,
  Shield,
  ArrowUpRight,
  Monitor,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Sliders,
} from 'lucide-react';

interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  type: 'flame' | 'smoke' | 'spark';
}

interface DemoAgent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  force: number;
  panic: number;
  colorType: 'normal' | 'warn' | 'crit';
}

export default function IncidentDemoPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0); // 0 to 30 seconds
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'split' | 'cctv' | 'forcesight'>('split');

  // Real-time HUD telemetry values
  const [currentPSI, setCurrentPSI] = useState<number>(14.2);
  const [incidentPhase, setIncidentPhase] = useState<string>('PHASE 1: NOMINAL CONCERT FLOW');
  const [alertStatus, setAlertStatus] = useState<'NORMAL' | 'WARNING' | 'CRITICAL'>('NORMAL');

  const isPlayingRef = useRef<boolean>(true);
  const currentTimeRef = useRef<number>(0);
  const playbackSpeedRef = useRef<number>(1.0);
  const viewModeRef = useRef<'split' | 'cctv' | 'forcesight'>('split');
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  // Audio Siren / Alarm Synthesizer
  const triggerAlarmTone = (frequency: number) => {
    if (isAudioMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio policy catch
    }
  };

  // Main Canvas Incident Engine (Procedural Fire, Crowd Panic, Photoelastic Split-Screen)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const W = 960;
    const H = 540;
    canvas.width = W;
    canvas.height = H;

    // Simulation constants
    const STAGE_Y = 100;
    const EXIT_Y = H - 35;
    const EXIT_X1 = W / 2 - 120;
    const EXIT_X2 = W / 2 + 120;

    // 180 Crowd Agents
    const agents: DemoAgent[] = [];
    for (let i = 0; i < 180; i++) {
      const rx = 100 + Math.random() * (W - 200);
      const ry = STAGE_Y + 30 + Math.random() * (H - STAGE_Y - 100);
      agents.push({
        x: rx,
        y: ry,
        vx: 0,
        vy: 0,
        baseX: rx,
        baseY: ry,
        radius: 6.5 + Math.random() * 2,
        force: 0,
        panic: 0,
        colorType: 'normal',
      });
    }

    // Procedural Fire & Smoke Particles
    let fireParticles: FireParticle[] = [];
    let lastTime = performance.now();
    let alarmTick = 0;

    function renderLoop(timeNow: number) {
      const dtRaw = (timeNow - lastTime) / 1000;
      lastTime = timeNow;
      const dt = Math.min(dtRaw || 0.016, 0.033) * playbackSpeedRef.current;

      if (isPlayingRef.current) {
        currentTimeRef.current = Math.min(30, currentTimeRef.current + dt);
        setCurrentTime(+currentTimeRef.current.toFixed(1));
        if (currentTimeRef.current >= 30) {
          setIsPlaying(false);
        }
      }

      const t = currentTimeRef.current;
      const isFireActive = t >= 5.0;
      const isPanicActive = t >= 9.0;
      const isIntervention = t >= 22.0;

      // Update Phase readouts
      if (t < 5.0) {
        setIncidentPhase('PHASE 1: NOMINAL CONCERT PERFORMANCE [STAGE ACTIVE]');
        setAlertStatus('NORMAL');
        setCurrentPSI(+(12.0 + Math.sin(t * 2) * 2.5).toFixed(1));
      } else if (t < 9.0) {
        setIncidentPhase('PHASE 2: PYROTECHNIC FAULT & STAGE FIRE IGNITION');
        setAlertStatus('WARNING');
        setCurrentPSI(+(28.0 + (t - 5.0) * 8.5).toFixed(1));
      } else if (t < 22.0) {
        setIncidentPhase('PHASE 3: UNREST & REVERSE CROWD SURGE (RUSH AWAY FROM STAGE)');
        setAlertStatus('CRITICAL');
        setCurrentPSI(+(62.0 + Math.min(30, (t - 9.0) * 2.8)).toFixed(1));
      } else {
        setIncidentPhase('PHASE 4: FORCESIGHT EARLY WARNING & VOMITORY THROTTLE ACTIVE');
        setAlertStatus('CRITICAL');
        setCurrentPSI(+(92.4 - (t - 22.0) * 1.5).toFixed(1));
      }

      // Audio Alarm Pings during fire
      if (isFireActive && !isAudioMuted && isPlayingRef.current) {
        alarmTick += dt;
        if (alarmTick > (isPanicActive ? 0.35 : 0.8)) {
          alarmTick = 0;
          triggerAlarmTone(isPanicActive ? 940 : 620);
        }
      }

      // ---------------------------------------------------------------------
      // 1. UPDATE FIRE & SMOKE PARTICLES AT STAGE AMPLIFIER RIG
      // ---------------------------------------------------------------------
      const fireOriginX = 280;
      const fireOriginY = STAGE_Y - 12;

      if (isFireActive) {
        const spawnCount = Math.floor(Math.min(18, (t - 5.0) * 4) + 6);
        for (let k = 0; k < spawnCount; k++) {
          // Flame tongues
          fireParticles.push({
            x: fireOriginX + (Math.random() - 0.5) * 45,
            y: fireOriginY + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 25,
            vy: -40 - Math.random() * 85,
            size: 8 + Math.random() * 14,
            life: 0,
            maxLife: 0.6 + Math.random() * 0.5,
            type: 'flame',
          });

          // Rising volumetric smoke billows
          if (Math.random() < 0.45) {
            fireParticles.push({
              x: fireOriginX + (Math.random() - 0.5) * 35,
              y: fireOriginY - 20,
              vx: -15 + (Math.random() - 0.5) * 30,
              vy: -25 - Math.random() * 45,
              size: 16 + Math.random() * 22,
              life: 0,
              maxLife: 1.8 + Math.random() * 1.2,
              type: 'smoke',
            });
          }

          // Flying ember sparks
          if (Math.random() < 0.35) {
            fireParticles.push({
              x: fireOriginX + (Math.random() - 0.5) * 20,
              y: fireOriginY,
              vx: (Math.random() - 0.5) * 120,
              vy: -60 - Math.random() * 90,
              size: 2.5 + Math.random() * 2,
              life: 0,
              maxLife: 0.8 + Math.random() * 0.7,
              type: 'spark',
            });
          }
        }
      }

      // Physics update on fire particles
      for (let p = fireParticles.length - 1; p >= 0; p--) {
        const pt = fireParticles[p];
        pt.life += dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (pt.type === 'smoke') {
          pt.size += dt * 14;
        }

        if (pt.life >= pt.maxLife) {
          fireParticles.splice(p, 1);
        }
      }

      // ---------------------------------------------------------------------
      // 2. UPDATE AGENT CROWD KINETICS (RUSH OPPOSITE FROM STAGE DURING FIRE)
      // ---------------------------------------------------------------------
      for (let i = 0; i < agents.length; i++) {
        const ag = agents[i];

        if (!isFireActive) {
          // Normal concert: agents sway rhythmically toward the stage
          const sway = Math.sin(t * 3 + i) * 6;
          ag.x += (ag.baseX + sway - ag.x) * dt * 2.5;
          ag.y += (ag.baseY - ag.y) * dt * 2.5;
          ag.force = 120 + Math.sin(t * 2 + i) * 80;
          ag.colorType = 'normal';
        } else if (!isPanicActive) {
          // Fire ignites: Front agents stop, point, and start backing away
          const distToFire = Math.hypot(ag.x - fireOriginX, ag.y - fireOriginY);
          if (distToFire < 220) {
            ag.panic = Math.min(1.0, ag.panic + dt * 1.2);
            ag.y += dt * 35; // Back away from stage
            ag.force = 450 + (1 - distToFire / 220) * 900;
            ag.colorType = ag.force > 800 ? 'warn' : 'normal';
          }
        } else {
          // MASS PANIC SURGE: Entire crowd rushes OPPOSITE from stage toward North Exit at bottom!
          ag.panic = 1.0;

          // Target aperture at the bottom exits
          const targetX = Math.max(EXIT_X1 + 20, Math.min(EXIT_X2 - 20, ag.x));
          const targetY = EXIT_Y;
          const dx = targetX - ag.x;
          const dy = targetY - ag.y;
          const dist = Math.hypot(dx, dy) || 1;

          // Frantic sprint velocity away from fire
          const sprintSpeed = isIntervention ? 95 : 135;
          ag.vx += (dx / dist * sprintSpeed - ag.vx) * dt * 3.5;
          ag.vy += (dy / dist * sprintSpeed - ag.vy) * dt * 3.5;

          ag.x += ag.vx * dt;
          ag.y += ag.vy * dt;

          // Repulsion & compression against neighbors (Helbing Contact)
          let neighborPressure = 0;
          for (let j = 0; j < agents.length; j++) {
            if (i === j) continue;
            const b = agents[j];
            const ddx = ag.x - b.x;
            const ddy = ag.y - b.y;
            const d = Math.hypot(ddx, ddy) || 0.1;
            const overlap = ag.radius + b.radius - d;
            if (overlap > 0) {
              const nx = ddx / d;
              const ny = ddy / d;
              ag.x += nx * overlap * 0.45;
              ag.y += ny * overlap * 0.45;
              neighborPressure += overlap * 220;
            }
          }

          // Wall clamping at bottom egress corridor
          if (ag.y > EXIT_Y - 20) {
            if (ag.x < EXIT_X1 || ag.x > EXIT_X2) {
              ag.y = EXIT_Y - 20;
              ag.vy = 0;
              neighborPressure += 450;
            }
          }

          ag.force = Math.min(4800, 600 + neighborPressure);

          if (ag.force >= 3200) {
            ag.colorType = 'crit';
          } else if (ag.force >= 1800) {
            ag.colorType = 'warn';
          } else {
            ag.colorType = 'normal';
          }
        }
      }

      // ---------------------------------------------------------------------
      // 3. RENDER CINEMATIC CANVAS FRAME
      // ---------------------------------------------------------------------
      ctx.clearRect(0, 0, W, H);

      const mode = viewModeRef.current;

      // BACKGROUND & ARENA FLOOR
      ctx.fillStyle = '#080C12';
      ctx.fillRect(0, 0, W, H);

      // Arena Architectural Floor Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 48) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // ---------------------------------------------------------------------
      // A. HEADLINER STAGE (TOP OF SCREEN)
      // ---------------------------------------------------------------------
      ctx.save();
      // Elevated Stage Platform
      ctx.fillStyle = '#141A24';
      ctx.fillRect(60, 10, W - 120, STAGE_Y - 10);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(60, 10, W - 120, STAGE_Y - 10);

      // Stage LED Backdrop
      const ledGrad = ctx.createLinearGradient(0, 10, 0, STAGE_Y);
      ledGrad.addColorStop(0, isFireActive ? 'rgba(239, 68, 68, 0.45)' : 'rgba(56, 189, 248, 0.25)');
      ledGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = ledGrad;
      ctx.fillRect(64, 14, W - 128, STAGE_Y - 18);

      // Sound Amplifiers & Lighting Rigs
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(68, 20, 52, 65);
      ctx.fillRect(W - 120, 20, 52, 65);

      // Faulty Amp Stack (Origin of fire)
      ctx.fillStyle = isFireActive ? '#EF4444' : '#334155';
      ctx.fillRect(fireOriginX - 25, fireOriginY - 20, 50, 40);
      ctx.strokeStyle = isFireActive ? '#F59E0B' : '#64748B';
      ctx.strokeRect(fireOriginX - 25, fireOriginY - 20, 50, 40);

      // Stage Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = "bold 12px 'Space Grotesk', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('⚡ ARENA HEADLINER STAGE // LIVE CONCERT RIG [CAM-04] ⚡', W / 2, 34);

      ctx.fillStyle = isFireActive ? '#EF4444' : '#38BDF8';
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(
        isFireActive
          ? '⚠️ CRITICAL: PYROTECHNIC IGNITION FAILURE · FLAMES SPREADING ACROSS STAGE'
          : 'AUDIO OUTPUT: 108 dB · PYROTECHNICS ARMED · NOMINAL ARENA STATUS',
        W / 2,
        50
      );
      ctx.textAlign = 'left';

      // Front Stage Security Crash Barrier
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(60, STAGE_Y);
      ctx.lineTo(W - 60, STAGE_Y);
      ctx.stroke();

      // Front Barrier Hazard Stripes
      for (let x = 60; x < W - 60; x += 18) {
        ctx.beginPath(); ctx.moveTo(x, STAGE_Y - 6); ctx.lineTo(x + 10, STAGE_Y); ctx.stroke();
      }
      ctx.restore();

      // ---------------------------------------------------------------------
      // B. NORTH ARENA EGRESS CHUTE & EXIT GATES (BOTTOM OF SCREEN)
      // ---------------------------------------------------------------------
      ctx.save();
      // Solid concrete boundary slabs on left and right of exit
      ctx.fillStyle = '#16202C';
      ctx.fillRect(0, EXIT_Y - 14, EXIT_X1, H - (EXIT_Y - 14));
      ctx.fillRect(EXIT_X2, EXIT_Y - 14, W - EXIT_X2, H - (EXIT_Y - 14));

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, EXIT_Y - 14);
      ctx.lineTo(EXIT_X1, EXIT_Y - 14);
      ctx.lineTo(EXIT_X1, H);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(W, EXIT_Y - 14);
      ctx.lineTo(EXIT_X2, EXIT_Y - 14);
      ctx.lineTo(EXIT_X2, H);
      ctx.stroke();

      // Exit Directional Signage
      ctx.fillStyle = '#10B981';
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('🏃 NORTH VOMITORY EGRESS GATES // CONCOURSE ACCESS 🏃', W / 2, H - 12);

      // Warning when bottleneck is overloaded
      if (isPanicActive) {
        ctx.fillStyle = '#EF4444';
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText('▼ SEVERE COMPRESSION BOTTLENECK: 4.8 kN PINNING THRESHOLD ▼', W / 2, EXIT_Y - 22);
      }
      ctx.textAlign = 'left';
      ctx.restore();

      // ---------------------------------------------------------------------
      // C. RENDER PROCEDURAL FIRE, SMOKE & EMBERS (IF FIRE ACTIVE)
      // ---------------------------------------------------------------------
      if (isFireActive) {
        ctx.save();
        // Flashing Emergency Strobe Beacon Reflection across arena floor
        const strobe = Math.sin(t * 18);
        if (strobe > 0.3) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
          ctx.fillRect(0, 0, W, H);
        }

        // 1. Volumetric Smoke Clouds
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < fireParticles.length; i++) {
          const pt = fireParticles[i];
          if (pt.type === 'smoke') {
            const alpha = Math.max(0, 1 - pt.life / pt.maxLife) * 0.45;
            ctx.fillStyle = `rgba(28, 33, 43, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 2. Fiery Flame Tongues (Additive Screen Blend)
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < fireParticles.length; i++) {
          const pt = fireParticles[i];
          if (pt.type === 'flame') {
            const progress = pt.life / pt.maxLife;
            const alpha = Math.max(0, 1 - progress);
            const r = 255;
            const g = Math.floor(180 * (1 - progress * 0.8));
            const b = Math.floor(40 * (1 - progress));

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * (1 - progress * 0.5), 0, Math.PI * 2);
            ctx.fill();
          } else if (pt.type === 'spark') {
            const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
            ctx.fillStyle = `rgba(255, 230, 120, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // ---------------------------------------------------------------------
      // D. RENDER CROWD PARTICLES (CCTV VS FORCESIGHT PHOTOELASTIC MODES)
      // ---------------------------------------------------------------------
      ctx.save();
      for (let i = 0; i < agents.length; i++) {
        const ag = agents[i];

        if (mode === 'cctv') {
          // Standard security camera: Human bodies look like plain dots (blind to pressure)
          ctx.fillStyle = '#CBD5E1';
          ctx.beginPath();
          ctx.arc(ag.x, ag.y, ag.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // ForceSight Photoelastic Simulation Mode (Vivid Chromatic Stress Fringes)
          let col = '#38BDF8';
          if (ag.colorType === 'crit') col = '#EF4444';
          else if (ag.colorType === 'warn') col = '#F59E0B';

          // Outer photoelastic fringe bloom
          ctx.fillStyle = col;
          ctx.globalAlpha = ag.colorType === 'crit' ? 0.95 : 0.75;
          ctx.beginPath();
          ctx.arc(ag.x, ag.y, ag.radius + (ag.colorType === 'crit' ? 3 : 1), 0, Math.PI * 2);
          ctx.fill();

          // High stress white core
          if (ag.colorType === 'crit') {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(ag.x, ag.y, ag.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // ---------------------------------------------------------------------
      // E. SPLIT-SCREEN DIVIDER (WHEN IN SPLIT MODE)
      // ---------------------------------------------------------------------
      if (mode === 'split') {
        const splitX = W / 2;
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, H);
        ctx.stroke();
        ctx.setLineDash([]);

        // Left Label
        ctx.fillStyle = '#111827';
        ctx.fillRect(16, H - 42, 195, 24);
        ctx.strokeStyle = '#64748B';
        ctx.strokeRect(16, H - 42, 195, 24);
        ctx.fillStyle = '#E2E8F0';
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText('CAM-04: STANDARD CCTV (BLIND TO STRESS)', 24, H - 26);

        // Right Label
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(splitX + 16, H - 42, 220, 24);
        ctx.strokeStyle = '#38BDF8';
        ctx.strokeRect(splitX + 16, H - 42, 220, 24);
        ctx.fillStyle = '#38BDF8';
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText('FORCESIGHT: PHOTOELASTIC STRESS SENSOR', splitX + 24, H - 26);
        ctx.restore();
      }

      // ---------------------------------------------------------------------
      // F. TOP CCTV HUD OVERLAY & WATERMARK
      // ---------------------------------------------------------------------
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(12, 12, 310, 48);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(12, 12, 310, 48);

      // Recording dot
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(26, 28, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText('REC 60FPS // CAM-04 [HEADLINER STAGE]', 38, 31);

      ctx.fillStyle = '#94A3B8';
      ctx.font = "9px 'JetBrains Mono', monospace";
      const mm = String(Math.floor(t / 60)).padStart(2, '0');
      const ss = String(Math.floor(t % 60)).padStart(2, '0');
      const ms = String(Math.floor((t * 100) % 100)).padStart(2, '0');
      ctx.fillText(`TIMECODE: 00:${mm}:${ss}.${ms} · REPLAY INCIDENT`, 26, 48);

      // Top Right ForceSight Live Telemetry Badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(W - 250, 12, 238, 48);
      ctx.strokeStyle = isPanicActive ? '#EF4444' : '#38BDF8';
      ctx.strokeRect(W - 250, 12, 238, 48);

      ctx.fillStyle = isPanicActive ? '#EF4444' : '#38BDF8';
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText(
        isPanicActive ? '⚠️ CRITICAL OVERLOAD PINNING' : '● SENSOR STATUS: MONITORING',
        W - 238,
        31
      );

      ctx.fillStyle = '#FFFFFF';
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(`PEAK STRESS: ${currentPSI} PSI · FLUX: 42/MIN`, W - 238, 48);
      ctx.restore();

      animId = requestAnimationFrame(renderLoop);
    }

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isAudioMuted]);

  const handleSeek = (seconds: number) => {
    currentTimeRef.current = seconds;
    setCurrentTime(seconds);
  };

  const handleRestart = () => {
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);
  };

  return (
    <main className="min-h-screen bg-[#F5F2EB] text-[#111111] p-3 sm:p-6 font-mono flex flex-col justify-between selection:bg-[#111111] selection:text-[#F5F2EB]">
      {/* =========================================================================
          TOP COMMAND BAR & NAVIGATION HEADER
         ========================================================================= */}
      <header className="bg-white border border-black/15 shadow-sm px-5 sm:px-7 py-3.5 mb-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/simulator"
            className="w-11 h-11 rounded-xl bg-[#111111] flex items-center justify-center text-[#38BDF8] shadow-md hover:scale-105 transition-transform shrink-0"
            title="Launch Interactive Physics Simulator"
          >
            <Monitor className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-baseline gap-2.5">
              <Link
                href="/"
                className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[#111111] uppercase hover:text-black transition-colors"
              >
                ForceSight
              </Link>
              <span className="text-[10px] tracking-widest px-2.5 py-0.5 rounded-full bg-[#111111] text-[#EF4444] font-mono font-bold uppercase hidden sm:inline">
                INCIDENT DEMO VIDEO
              </span>
            </div>
            <p className="text-[11px] text-[#111111]/70 font-mono tracking-wide mt-0.5">
              Demonstrating Stage Pyrotechnic Fire, Unrest Reverse-Surge &amp; Photoelastic Early Detection
            </p>
          </div>
        </div>

        {/* Global Navigation Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-full bg-black/5 hover:bg-black hover:text-white border border-black/15 text-[#111111] transition flex items-center gap-1 text-xs font-mono tracking-wider uppercase shadow-sm"
          >
            <span>&larr; Showcase</span>
          </Link>

          <Link
            href="/simulator"
            className="px-3.5 py-1.5 rounded-full bg-[#111111] text-[#F5F2EB] hover:bg-black hover:text-[#38BDF8] border border-black/15 transition flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase shadow-sm font-bold"
          >
            <Monitor className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Interactive Simulator &rarr;</span>
          </Link>
        </div>
      </header>

      {/* =========================================================================
          MAIN DEMO VIDEO PLAYER & CINEMATIC DISPLAY CONTAINER
         ========================================================================= */}
      <section className="bg-white border border-black/15 shadow-sm rounded-2xl p-4 sm:p-6 mb-5 flex flex-col gap-4">
        {/* Video Player Top Telemetry Ticker */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                alertStatus === 'CRITICAL'
                  ? 'bg-red-500 animate-ping'
                  : alertStatus === 'WARNING'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-bold text-[#111111] tracking-wider uppercase">
              {incidentPhase}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-[#F5F2EB] border border-black/10 rounded-lg p-1 flex items-center gap-1 text-[10px]">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded transition font-bold ${
                  viewMode === 'split' ? 'bg-[#111111] text-[#F5F2EB]' : 'text-[#111111]/70 hover:text-black'
                }`}
              >
                Split Screen (CCTV + Twin)
              </button>
              <button
                onClick={() => setViewMode('cctv')}
                className={`px-2.5 py-1 rounded transition font-bold ${
                  viewMode === 'cctv' ? 'bg-[#111111] text-[#F5F2EB]' : 'text-[#111111]/70 hover:text-black'
                }`}
              >
                CCTV Only
              </button>
              <button
                onClick={() => setViewMode('forcesight')}
                className={`px-2.5 py-1 rounded transition font-bold ${
                  viewMode === 'forcesight' ? 'bg-[#111111] text-[#F5F2EB]' : 'text-[#111111]/70 hover:text-black'
                }`}
              >
                ForceSight Twin
              </button>
            </div>
          </div>
        </div>

        {/* Video Canvas Stage (16:9 Cinema Aspect) */}
        <div className="w-full aspect-[960/540] bg-black rounded-xl overflow-hidden border border-black/20 shadow-2xl relative my-auto">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* =========================================================================
            CINEMA VIDEO CONTROLS BAR (PLAY, TIMELINE SCRUBBER, SPEED, AUDIO)
           ========================================================================= */}
        <div className="bg-[#111111] text-[#F5F2EB] p-3 sm:p-4 rounded-xl flex flex-col gap-3 font-mono border border-black/20 shadow-md">
          {/* Timeline Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#38BDF8] font-bold shrink-0 min-w-[45px]">
              00:{String(Math.floor(currentTime)).padStart(2, '0')}
            </span>

            <input
              type="range"
              min="0"
              max="30"
              step="0.1"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full accent-[#38BDF8] cursor-pointer h-2 bg-white/20 rounded-lg"
            />

            <span className="text-xs text-white/50 font-bold shrink-0">00:30</span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Play / Pause */}
              <button
                onClick={() => setIsPlaying((prev) => !prev)}
                className="px-4 py-2 rounded-lg bg-[#38BDF8] hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              {/* Restart */}
              <button
                onClick={handleRestart}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition border border-white/15"
                title="Restart Incident Video"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>

              {/* Siren Audio Toggle */}
              <button
                onClick={() => setIsAudioMuted((prev) => !prev)}
                className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                  !isAudioMuted
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-white/10 border-white/15 text-white/70 hover:text-white'
                }`}
                title="Toggle Emergency Alarm Siren Sound"
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isAudioMuted ? 'Muted' : 'Alarm Sound On'}</span>
              </button>
            </div>

            {/* Playback Speed Selectors */}
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <span className="text-[10px] uppercase text-white/40 mr-1">Speed:</span>
              {[0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    playbackSpeed === spd
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INCIDENT CHAPTERS: DIRECT JUMP TO CRUCIAL TIMELINE EVENTS
         ========================================================================= */}
      <section className="bg-white border border-black/15 shadow-sm rounded-2xl p-5 mb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-black/10 pb-2">
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#EF4444]" />
            Incident Timeline Chapters &middot; Click to Jump
          </span>
          <span className="text-[10px] text-[#111111]/60 font-mono">
            4-PHASE EMERGENCY LIFECYCLE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Chapter 1 */}
          <button
            onClick={() => handleSeek(0)}
            className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
              currentTime < 5.0
                ? 'bg-cyan-50 border-[#38BDF8] ring-2 ring-[#38BDF8]/30 shadow-sm'
                : 'bg-[#F5F2EB] border-black/10 hover:border-black/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#38BDF8] font-mono">00:00 &middot; PHASE 1</span>
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            </div>
            <h4 className="font-bold text-xs text-[#111111]">Nominal Concert Flow</h4>
            <p className="text-[11px] text-[#111111]/70 leading-snug">
              Crowd gathers near headliner stage enjoying performance; stress normal (~12 PSI).
            </p>
          </button>

          {/* Chapter 2 */}
          <button
            onClick={() => handleSeek(5.2)}
            className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
              currentTime >= 5.0 && currentTime < 9.0
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                : 'bg-[#F5F2EB] border-black/10 hover:border-black/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#F59E0B] font-mono">00:05 &middot; PHASE 2</span>
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
            </div>
            <h4 className="font-bold text-xs text-[#111111]">Stage Pyro Ignition &amp; Fire</h4>
            <p className="text-[11px] text-[#111111]/70 leading-snug">
              Pyrotechnic fault explodes left speaker stack; flames and thick smoke spread across stage.
            </p>
          </button>

          {/* Chapter 3 */}
          <button
            onClick={() => handleSeek(10.0)}
            className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
              currentTime >= 9.0 && currentTime < 22.0
                ? 'bg-red-50 border-red-500 ring-2 ring-red-500/30 shadow-sm'
                : 'bg-[#F5F2EB] border-black/10 hover:border-black/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#EF4444] font-mono">00:10 &middot; PHASE 3</span>
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
            </div>
            <h4 className="font-bold text-xs text-[#111111]">Reverse Surge &amp; Panic Unrest</h4>
            <p className="text-[11px] text-[#111111]/70 leading-snug">
              Crowd turns and frantically flees away from stage; violent funneling into North Exit.
            </p>
          </button>

          {/* Chapter 4 */}
          <button
            onClick={() => handleSeek(22.5)}
            className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
              currentTime >= 22.0
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                : 'bg-[#F5F2EB] border-black/10 hover:border-black/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#10B981] font-mono">00:22 &middot; PHASE 4</span>
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            </div>
            <h4 className="font-bold text-xs text-[#111111]">ForceSight Early Warning</h4>
            <p className="text-[11px] text-[#111111]/70 leading-snug">
              Photoelastic fringes pinpoint crush choke 45s before injuries; secondary exits deployed.
            </p>
          </button>
        </div>
      </section>

      {/* =========================================================================
          TECHNICAL COMPARISON: STANDARD CCTV VS FORCESIGHT PHOTOELASTIC
         ========================================================================= */}
      <section className="bg-white border border-black/15 shadow-sm rounded-2xl p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 rounded-xl bg-[#F5F2EB] border border-black/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-red-700 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Standard Security Cameras (Failure Mode)</span>
            </div>
            <p className="text-xs text-[#111111]/80 leading-relaxed mt-2">
              Standard optical CCTV feeds only capture visible outer motion. Human marshals cannot see
              the invisible compressive force waves rippling through bodies. By the time a crowd fall or
              suffocation occurs on conventional monitors, it is already too late to intervene.
            </p>
          </div>
          <div className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-3 pt-2 border-t border-black/10">
            RESULT: Fatal crush develops silently in dense queues.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-50/50 border border-[#38BDF8]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-cyan-900 mb-1">
              <Shield className="w-4 h-4 text-[#38BDF8]" />
              <span>ForceSight Digital Photoelastic CV (Proactive Life-Saving)</span>
            </div>
            <p className="text-xs text-[#111111]/80 leading-relaxed mt-2">
              ForceSight converts optical flow velocity variance into real-time physical pressure gradients
              (0–100 Peak Stress Index). As compressive body forces approach the 2,550 N rib-fracture threshold,
              the display shifts from cyber blue into deep crimson, providing indisputable early warnings
              45 to 60 seconds before fatal thresholds occur.
            </p>
          </div>
          <div className="text-[10px] text-cyan-800 font-bold uppercase tracking-wider mt-3 pt-2 border-t border-[#38BDF8]/20 flex items-center justify-between">
            <span>RESULT: 45s early warning &middot; Throttles gates before stampedes</span>
            <Link href="/simulator" className="underline hover:text-cyan-900">
              Open Simulator &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Return */}
      <footer className="text-center text-xs text-[#111111]/50 py-2">
        ForceSight Incident Demonstration Suite &middot; Calibrated on Helbing Social Force CV &middot; 2026
      </footer>
    </main>
  );
}
