'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Activity, Radio, Flame, Sparkles, Layers, Sliders } from 'lucide-react';
import ScrambleText from './ScrambleText';

interface Agent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  force: number;
}

export default function HeroCanvasSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [fps, setFps] = useState<number>(60);
  const [agentCount, setAgentCount] = useState<number>(55);
  const [peakPsi, setPeakPsi] = useState<number>(14.2);
  const [fluxPerMin, setFluxPerMin] = useState<number>(42);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Mouse repulsion probe
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let frameCounter = 0;
    let lastFpsTime = performance.now();

    // High-DPI Canvas Setup
    const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
    const width = 840;
    const height = 480;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const gateWidth = 140;
    const gateLeft = (width - gateWidth) / 2;
    const gateRight = (width + gateWidth) / 2;
    const wallBottom = 60;

    let agents: Agent[] = [];
    const escapedTimes: number[] = [];

    // Initialize crowd
    for (let i = 0; i < 50; i++) {
      agents.push({
        x: 40 + Math.random() * (width - 80),
        y: height - 20 - Math.random() * (height * 0.7),
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.8 - Math.random() * 0.5,
        radius: 8.5 + Math.random() * 2.5,
        mass: 70,
        force: 0,
      });
    }

    let spawnTimer = 0;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      frameCounter++;
      if (now - lastFpsTime >= 500) {
        setFps(Math.round((frameCounter * 1000) / (now - lastFpsTime)));
        frameCounter = 0;
        lastFpsTime = now;
      }

      // Continuous spawning
      spawnTimer += dt * 5.2;
      while (spawnTimer >= 1 && agents.length < 90) {
        spawnTimer -= 1;
        agents.push({
          x: 40 + Math.random() * (width - 80),
          y: height - 10,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -0.9 - Math.random() * 0.4,
          radius: 8.5 + Math.random() * 2.5,
          mass: 70,
          force: 0,
        });
      }

      // Physics loop
      let maxForce = 0;
      const mouse = mousePosRef.current;

      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        let fx = 0;
        let fy = 0;
        let crowdForce = 0;

        // Drive upward to gate
        const targetX = Math.max(gateLeft + 12, Math.min(gateRight - 12, a.x));
        const targetY = a.y > wallBottom ? (a.x < gateLeft || a.x > gateRight ? wallBottom + 18 : -20) : -20;
        const dx = targetX - a.x;
        const dy = targetY - a.y;
        const dist = Math.hypot(dx, dy) || 1;

        fx += (dx / dist) * 110;
        fy += (dy / dist) * 110;

        // Mouse repulsion probe
        if (mouse.active) {
          const mdx = a.x - mouse.x;
          const mdy = a.y - mouse.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < 90 && mdist > 0.001) {
            const mforce = ((90 - mdist) / 90) * 320;
            fx += (mdx / mdist) * mforce;
            fy += (mdy / mdist) * mforce;
          }
        }

        // Agent-agent collisions
        for (let j = 0; j < agents.length; j++) {
          if (i === j) continue;
          const b = agents[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const ddist = Math.hypot(ddx, ddy) || 0.001;
          const sumR = a.radius + b.radius;
          const overlap = sumR - ddist;

          if (ddist < sumR + 12) {
            const nx = ddx / ddist;
            const ny = ddy / ddist;
            fx += 140 * Math.exp(-Math.max(0, -overlap) / 6) * nx;
            fy += 140 * Math.exp(-Math.max(0, -overlap) / 6) * ny;

            if (overlap > 0) {
              const fc = overlap * 260;
              fx += fc * nx;
              fy += fc * ny;
              crowdForce += fc;
            }
          }
        }

        // Wall collision
        let wallStress = 0;
        if (a.y < wallBottom + a.radius) {
          if (a.x < gateLeft || a.x > gateRight) {
            a.y = wallBottom + a.radius;
            if (a.vy < 0) a.vy = 0;
            wallStress = crowdForce > 0 ? crowdForce * 0.7 + 40 : 25;
          }
        }

        a.force = crowdForce + wallStress;
        if (a.force > maxForce) maxForce = a.force;

        a.vx = (a.vx + (fx / a.mass) * dt) * 0.95;
        a.vy = (a.vy + (fy / a.mass) * dt) * 0.95;

        a.x += a.vx;
        a.y += a.vy;

        // Boundaries
        if (a.x < a.radius + 10) { a.x = a.radius + 10; a.vx *= -0.2; }
        if (a.x > width - a.radius - 10) { a.x = width - a.radius - 10; a.vx *= -0.2; }
      }

      // Exit bottleneck
      for (let i = agents.length - 1; i >= 0; i--) {
        if (agents[i].y < 5) {
          agents.splice(i, 1);
          escapedTimes.push(now);
        }
      }

      while (escapedTimes.length && escapedTimes[0] < now - 15000) {
        escapedTimes.shift();
      }
      setFluxPerMin(Math.round(escapedTimes.length * 4));
      setAgentCount(agents.length);
      const computedPsi = +(Math.min(100, (maxForce / 4800) * 100).toFixed(1));
      setPeakPsi(computedPsi);

      // -----------------------------------------------------------------------
      // CANVAS RENDERING (SWISS EDITORIAL MINIMALIST INDUSTRIAL SCHEMATIC)
      // -----------------------------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // Hairline Tactical Grid (#E5E0D8 / #1A1A1A)
      ctx.save();
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1;
      const gridSize = 32;

      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Gate Wall Slabs
      ctx.fillStyle = '#161616';
      ctx.fillRect(0, 0, gateLeft, wallBottom);
      ctx.fillRect(gateRight, 0, width - gateRight, wallBottom);

      // Gate Aperture Sensing Line
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, wallBottom);
      ctx.lineTo(gateLeft, wallBottom);
      ctx.lineTo(gateLeft, 0);
      ctx.moveTo(gateRight, 0);
      ctx.lineTo(gateRight, wallBottom);
      ctx.lineTo(width, wallBottom);
      ctx.stroke();

      // Gate Dimension Label
      ctx.fillStyle = '#38BDF8';
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(`GATE APERTURE: ${gateWidth}PX [CALIBRATED FLOW]`, gateLeft + 8, 34);
      ctx.restore();

      // Velocity Vectors
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.2;
      for (const a of agents) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x - a.vx * 4, a.y - a.vy * 4);
        ctx.stroke();
      }
      ctx.restore();

      // Photoelastic Particles Bloom
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (const a of agents) {
        const stressU = Math.min(1, a.force / 3800);
        let color = '#38BDF8'; // Normal: Cyan
        let shadowColor = 'rgba(56, 189, 248, 0.4)';
        let blur = 0;

        if (stressU > 0.75) {
          color = '#EF4444'; // Critical: Crimson
          shadowColor = '#EF4444';
          blur = 16;
        } else if (stressU > 0.4) {
          color = '#F59E0B'; // Warning: Amber
          shadowColor = '#F59E0B';
          blur = 10;
        }

        ctx.shadowBlur = blur;
        ctx.shadowColor = shadowColor;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();

        // White nucleus for high stress
        if (stressU > 0.5) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Mouse probe reticle
      if (mouse.active) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 85, 0, Math.PI * 2);
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 840 / rect.width;
    const scaleY = 480 / rect.height;
    mousePosRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mousePosRef.current.active = false;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-black/15 bg-[#111111] text-[#F5F2EB] shadow-2xl">
      {/* Top Swiss Telemetry Bar */}
      <div className="px-5 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
          <span className="font-bold text-[#F5F2EB] tracking-wider uppercase">
            HELBING MICRO-DYNAMICS SEQUENCER
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
            60 FPS LIVE
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-white/60">
          <div>
            POPULATION: <span className="font-bold text-[#38BDF8]">{agentCount} PAX</span>
          </div>
          <div>
            THROUGHPUT: <span className="font-bold text-white">{fluxPerMin}/MIN</span>
          </div>
          <div>
            PEAK PSI: <span className={`font-bold ${peakPsi >= 60 ? 'text-[#EF4444]' : 'text-[#38BDF8]'}`}>{peakPsi}%</span>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full aspect-[840/480] bg-[#0E0E0E]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Floating Technical Badge Overlay */}
        <div className="absolute bottom-4 left-4 pointer-events-none p-3 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md font-mono text-[10px] text-white/70 max-w-xs hidden sm:block">
          <div className="text-[#38BDF8] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Radio className="w-3 h-3 animate-ping" />
            <span>Interactive Stress Probe</span>
          </div>
          <p className="text-white/60 leading-relaxed">
            Hover cursor over canvas to introduce virtual tactile deflection barriers. Observe localized photoelastic fringe blooms at chokepoint aperture.
          </p>
        </div>

        <div className="absolute top-4 right-4 pointer-events-none px-2.5 py-1 rounded bg-black/70 border border-white/10 font-mono text-[10px] text-cyan-300">
          <span>&int; HELBING FORCE VECTOR &middot; 60 FPS</span>
        </div>
      </div>

      {/* Bottom Telemetry Strip */}
      <div className="px-5 py-2.5 border-t border-white/10 bg-black/40 text-[10px] font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-white/50 text-center">
        <div>
          <span>FRAME MATRIX:</span> <b className="text-white ml-1">840&times;480 [DPR 2.0]</b>
        </div>
        <div>
          <span>RELAXATION HORIZON:</span> <b className="text-[#38BDF8] ml-1">&tau; = 0.55s</b>
        </div>
        <div>
          <span>RIB FRACTURE THRESHOLD:</span> <b className="text-[#F59E0B] ml-1">2550 N</b>
        </div>
        <div>
          <span>CHROMATIC GRADIENT:</span> <b className="text-[#EF4444] ml-1">MICHEL-L&Eacute;VY</b>
        </div>
      </div>
    </div>
  );
}
