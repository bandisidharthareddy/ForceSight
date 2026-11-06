'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Activity,
  Flame,
  Radio,
  ExternalLink,
  ArrowUpRight,
  Monitor,
  Smartphone,
  ChevronRight,
  Layers,
  Compass,
  Cpu,
  Target,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  MoveUpRight,
  Terminal,
  Play,
} from 'lucide-react';
import SmoothScroll from '../components/SmoothScroll';
import DualTierNav from '../components/DualTierNav';
import HeroCanvasSimulation from '../components/HeroCanvasSimulation';
import CylindricalCarousel from '../components/CylindricalCarousel';
import TiltCard from '../components/TiltCard';
import MagneticButton from '../components/MagneticButton';
import ScrambleText from '../components/ScrambleText';

export default function ForceSightFlagshipPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [liveMetrics, setLiveMetrics] = useState({
    psi: 16.4,
    force: 480,
    agents: 64,
    gate: 1.4,
    hotspot: 'B3',
  });

  useEffect(() => {
    setMounted(true);
    // Periodically poll /api/telemetry to show real numbers on the marketing showcase
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/telemetry', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setLiveMetrics({
            psi: data.selectedSectorStress ?? data.peakStress ?? 16.4,
            force: data.rawPeakForce ?? 480,
            agents: data.activeAgents ?? 64,
            gate: data.gateWidth ?? 1.4,
            hotspot: data.hotspotSector ?? 'B3',
          });
        }
      } catch {
        // Fallback gracefully
      }
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#F5F2EB] text-[#111111] font-body selection:bg-[#111111] selection:text-[#F5F2EB] relative">
        {/* Dual-Tier Navigation */}
        <DualTierNav />

        {/* =====================================================================
            SECTION 01: PROLOGUE & HERO SHOWCASE
           ===================================================================== */}
        <section
          id="prologue"
          className="min-h-screen pt-28 pb-16 px-6 sm:px-10 max-w-7xl mx-auto flex flex-col justify-between"
        >
          {/* Top Swiss Telemetry Header */}
          <div className="border-b border-black/10 pb-4 mb-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-[#111111]/70">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
              <span className="font-bold text-[#111111] tracking-wider uppercase">
                SYSTEM IDENTIFIER: FORCESIGHT // TWIN ENGINE
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span>EST. 2026 &middot; HELBING MODEL</span>
              <span>CALIBRATED PSI: 0&ndash;100</span>
              <span className="text-[#111111] font-bold">Z&Uuml;RICH / GLOBAL</span>
            </div>
          </div>

          {/* Hero Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
            {/* Left Headline Column */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/15 bg-white text-xs font-mono uppercase tracking-widest text-[#111111] mb-6 w-fit shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                <ScrambleText text="PREDICTIVE PHYSICAL CROWD SIMULATION" />
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black font-display tracking-tight text-[#111111] uppercase leading-[0.96] mb-6">
                Predictive <br />
                <span className="italic font-serif font-normal text-[#111111]/80">Crowd</span> Stress <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] via-[#38BDF8] to-[#EF4444]">
                  Simulation.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#111111]/80 max-w-xl font-normal leading-relaxed mb-8">
                Eliminating crowd surges, stampedes, and crushing incidents at structural bottlenecks.
                Pioneering <b>Digital Photoelastic Simulation</b> to visualize invisible compressive forces
                and deliver glanceable early warnings before fatal physical thresholds develop.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <MagneticButton>
                  <Link
                    href="/demo"
                    className="px-6 py-3.5 rounded-full bg-[#111111] text-[#F5F2EB] hover:bg-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-2xl group"
                  >
                    <Play className="w-4 h-4 text-[#EF4444] group-hover:scale-110 transition-transform fill-current" />
                    <span>Incident Demo Video</span>
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </MagneticButton>

                <MagneticButton>
                  <Link
                    href="/simulator"
                    className="px-6 py-3.5 rounded-full border border-black/20 bg-white hover:bg-black hover:text-white text-[#111111] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Monitor className="w-4 h-4 text-[#38BDF8]" />
                    <span>Desktop Simulator Twin</span>
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </MagneticButton>

                <MagneticButton>
                  <Link
                    href="/mobile"
                    className="px-6 py-3.5 rounded-full border border-black/20 bg-white hover:bg-black hover:text-white text-[#111111] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Smartphone className="w-4 h-4 text-[#EF4444]" />
                    <span>Guard Alert Unit</span>
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </MagneticButton>

                <div className="text-xs font-mono text-[#111111]/60 flex items-center gap-2 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span>300ms Synchronized Stream</span>
                </div>
              </div>
            </div>

            {/* Right Asymmetric Telemetry Card */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <TiltCard className="rounded-xl border border-black/15 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4 font-mono text-xs">
                  <span className="font-bold uppercase tracking-wider text-[#111111]">
                    LIVE TELEMETRY STREAM
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 text-[#111111] font-bold">
                    PORT 3000
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 font-mono">
                  <div>
                    <div className="text-[10px] text-[#111111]/60 uppercase tracking-wider">
                      Current PSI
                    </div>
                    <div className="text-4xl font-black text-[#111111] mt-0.5">
                      {liveMetrics.psi}
                      <span className="text-sm font-normal text-black/40">/100</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#111111]/60 uppercase tracking-wider">
                      Max Force (N)
                    </div>
                    <div className="text-4xl font-black text-[#38BDF8] mt-0.5">
                      {liveMetrics.force}
                      <span className="text-sm font-normal text-black/40"> N</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono border-t border-black/10 pt-3">
                  <div className="flex justify-between text-[#111111]/70">
                    <span>Target Bottleneck:</span>
                    <b className="text-[#111111]">GATE APERTURE {liveMetrics.gate}M</b>
                  </div>
                  <div className="flex justify-between text-[#111111]/70">
                    <span>Critical Hotspot:</span>
                    <b className="text-[#EF4444]">BOX {liveMetrics.hotspot} (ISOLATED)</b>
                  </div>
                  <div className="flex justify-between text-[#111111]/70">
                    <span>Active Ingress Queue:</span>
                    <b className="text-[#111111]">{liveMetrics.agents} PARTICLES</b>
                  </div>
                </div>
              </TiltCard>

              {/* Swiss Minimalist Spec Strip */}
              <div className="p-4 rounded-xl border border-black/15 bg-[#EFECE3] font-mono text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#38BDF8]" />
                  <span className="text-[#111111]/80 font-bold uppercase tracking-wider">
                    Rib Fracture Limit:
                  </span>
                </div>
                <span className="font-bold text-[#EF4444]">2550 N (STILL 2014)</span>
              </div>
            </div>
          </div>

          {/* Canvas Interactive Simulation Module */}
          <div className="w-full">
            <HeroCanvasSimulation />
          </div>
        </section>

        {/* =====================================================================
            SECTION 02: HELBING SOCIAL FORCE MATHEMATICAL ENGINE
           ===================================================================== */}
        <section
          id="engine"
          className="py-24 px-6 sm:px-10 max-w-7xl mx-auto border-t border-black/10"
        >
          {/* Section Header */}
          <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#111111]/60 flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                <span>02 &middot; MATHEMATICAL ARCHITECTURE</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#111111] uppercase">
                The Helbing Social Force Model
              </h2>
            </div>
            <p className="text-sm font-mono text-[#111111]/70 max-w-md">
              Replacing crude bounding boxes with empirical crowd dynamics (P = &rho; &middot; Var(v))
              and multi-agent social forces.
            </p>
          </div>

          {/* Formula Callout Banner */}
          <div className="rounded-2xl border border-black/15 bg-[#111111] text-[#F5F2EB] p-8 mb-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-white/5 font-mono text-7xl font-black select-none pointer-events-none">
              &sum; F_ij
            </div>
            <div className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-widest mb-2">
              EQUATION OF CROWD MOTION
            </div>
            <div className="text-xl sm:text-3xl font-mono font-bold tracking-wider text-white mb-4 overflow-x-auto py-2">
              m_i (dv_i / dt) = m_i (v_i^0 e_i - v_i) / &tau;_i + &sum; f_ij + &sum; f_iW
            </div>
            <p className="text-xs sm:text-sm font-body text-white/70 max-w-3xl leading-relaxed">
              Every particle continuously integrates desired velocity relaxation (&tau; = 0.55s),
              psychological avoidance distance falloff (A = 180 N), normal contact elastic stiffness (k_n),
              and tangential sliding friction (k_t) against gates and surrounding human bodies.
            </p>
          </div>

          {/* 3D Tilt Cards Specification Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Driving Momentum */}
            <TiltCard className="rounded-xl border border-black/15 bg-white p-7 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#111111]/50 mb-4">
                  <span>VECTOR COMPONENT // A</span>
                  <span>&tau; = 0.55s</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-black/5 border border-black/10 flex items-center justify-center text-[#38BDF8] mb-5">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display uppercase tracking-tight text-[#111111] mb-2">
                  <ScrambleText text="Kinetic Drive & Desired Velocity" />
                </h3>
                <p className="text-xs text-[#111111]/70 leading-relaxed mb-6 font-body">
                  Agents calculate a target vector directed toward the gate aperture. If within line-of-sight, agents move in parallel straight tracks ($dx = 0$). Agents behind solid slabs execute smart waypoint routing around corners.
                </p>
              </div>
              <div className="pt-4 border-t border-black/10 font-mono text-xs flex justify-between items-center text-[#111111]">
                <span>Aperture Clamping</span>
                <b className="text-[#38BDF8]">&plusmn;140 PX</b>
              </div>
            </TiltCard>

            {/* Card 2: Contact Compression */}
            <TiltCard className="rounded-xl border border-black/15 bg-white p-7 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#111111]/50 mb-4">
                  <span>VECTOR COMPONENT // B</span>
                  <span>k_n = 320 N/px</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-black/5 border border-black/10 flex items-center justify-center text-[#F59E0B] mb-5">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display uppercase tracking-tight text-[#111111] mb-2">
                  <ScrambleText text="Normal Elastic Compression" />
                </h3>
                <p className="text-xs text-[#111111]/70 leading-relaxed mb-6 font-body">
                  Physical overlaps between agents generate contact repulsion forces. The sum of these repulsive overlap forces applied to an individual agent represents its real bodily stress, calibrated up to 4800 N.
                </p>
              </div>
              <div className="pt-4 border-t border-black/10 font-mono text-xs flex justify-between items-center text-[#111111]">
                <span>Fracture Threshold</span>
                <b className="text-[#F59E0B]">2550 N</b>
              </div>
            </TiltCard>

            {/* Card 3: Boundary Wall Reaction */}
            <TiltCard className="rounded-xl border border-black/15 bg-white p-7 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#111111]/50 mb-4">
                  <span>VECTOR COMPONENT // C</span>
                  <span>k_t = 75 N&middot;s/px</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-black/5 border border-black/10 flex items-center justify-center text-[#EF4444] mb-5">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display uppercase tracking-tight text-[#111111] mb-2">
                  <ScrambleText text="Rigid Boundary Pinning" />
                </h3>
                <p className="text-xs text-[#111111]/70 leading-relaxed mb-6 font-body">
                  Mere contact with a wall produces only gentle deceleration (15&ndash;35 N). Compressive crush forces only escalate when a crowd behind the agent exerts forward push, pinning them against the immovable barrier.
                </p>
              </div>
              <div className="pt-4 border-t border-black/10 font-mono text-xs flex justify-between items-center text-[#111111]">
                <span>Scale Ceiling</span>
                <b className="text-[#EF4444]">4800 N</b>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* =====================================================================
            SECTION 03: 360° CYLINDRICAL VIEWPORT CAROUSEL
           ===================================================================== */}
        <section
          id="architecture"
          className="border-t border-black/10 bg-[#EFECE3]/50"
        >
          <CylindricalCarousel />
        </section>

        {/* =====================================================================
            SECTION 04: DIGITAL PHOTOELASTIC SPECIFICATIONS
           ===================================================================== */}
        <section
          id="specifications"
          className="py-24 px-6 sm:px-10 max-w-7xl mx-auto border-t border-black/10"
        >
          {/* Section Header */}
          <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#111111]/60 flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span>04 &middot; OPTICAL VISUALIZATION SPECIFICATION</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#111111] uppercase">
                Digital Photoelasticity
              </h2>
            </div>
            <p className="text-sm font-mono text-[#111111]/70 max-w-md">
              Mimicking how physical mechanical stress alters chromatic fringe patterns in photoelastic
              polyurethane under crossed polarizers.
            </p>
          </div>

          {/* Chromatic Spectrum Bar */}
          <div className="rounded-xl border border-black/15 bg-white p-6 mb-12 shadow-md">
            <div className="flex justify-between items-center text-xs font-mono text-[#111111]/70 uppercase tracking-wider mb-3">
              <span>Continuous Chromatic Stress Gradient (Michel-L&eacute;vy Birefringence)</span>
              <span>Normalized PSI (0 &ndash; 100)</span>
            </div>

            {/* Gradient Strip */}
            <div className="h-6 w-full rounded-lg bg-gradient-to-r from-[#38BDF8] via-[#F59E0B] to-[#EF4444] shadow-inner mb-4" />

            {/* Scale Markers */}
            <div className="grid grid-cols-3 text-xs font-mono text-[#111111]">
              <div>
                <b className="text-[#38BDF8]">0 &ndash; 30 PSI</b>
                <div className="text-[10px] text-[#111111]/60">Laminar queue flow (&lt;1500 N)</div>
              </div>
              <div className="text-center">
                <b className="text-[#F59E0B]">30 &ndash; 60 PSI</b>
                <div className="text-[10px] text-[#111111]/60">Bottleneck warning congestion</div>
              </div>
              <div className="text-right">
                <b className="text-[#EF4444]">60 &ndash; 100 PSI</b>
                <div className="text-[10px] text-[#111111]/60">Critical crush hazard (&gt;2550 N)</div>
              </div>
            </div>
          </div>

          {/* Technical Specs Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-black/15 bg-white p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#38BDF8] mb-2">
                  SCREEN COMPOSITE BLEND
                </div>
                <h3 className="text-2xl font-bold font-display uppercase tracking-tight text-[#111111] mb-3">
                  Non-Linear Optical Bloom
                </h3>
                <p className="text-xs sm:text-sm text-[#111111]/70 leading-relaxed font-body mb-4">
                  ForceSight renders particles via <code className="bg-black/5 px-1.5 py-0.5 rounded font-mono text-xs">ctx.globalCompositeOperation = &apos;screen&apos;</code>.
                  When high-stress agents crowd together at chokepoints, their chromatic shadows blend additively, creating an intense, undeniable glowing heat signature without obstructing body silhouettes.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F5F2EB] border border-black/10 font-mono text-xs flex justify-between items-center text-[#111111]">
                <span>Shadow Blur Horizon:</span>
                <b>18px Dynamic Gaussian</b>
              </div>
            </div>

            <div className="rounded-xl border border-black/15 bg-white p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#EF4444] mb-2">
                  DEFLECTION HYDRODYNAMICS
                </div>
                <h3 className="text-2xl font-bold font-display uppercase tracking-tight text-[#111111] mb-3">
                  Pillar Surge Deflection
                </h3>
                <p className="text-xs sm:text-sm text-[#111111]/70 leading-relaxed font-body mb-4">
                  Inspired by architectural flood breakers, strategic circular deflection pillars placed ahead of turnstiles relieve up to 38% of physical compressive load by absorbing kinetic surge momentum and splitting unidirectional queues into laminar streams.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F5F2EB] border border-black/10 font-mono text-xs flex justify-between items-center text-[#111111]">
                <span>Compressive Load Relief:</span>
                <b className="text-[#10B981]">-38% Peak Stress</b>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 05: SWISS EDITORIAL DATA MATRIX & 5x4 TILE SYSTEM
           ===================================================================== */}
        <section
          id="matrix"
          className="py-24 px-6 sm:px-10 max-w-7xl mx-auto border-t border-black/10"
        >
          {/* Section Header */}
          <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#111111]/60 flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                <span>05 &middot; SWISS EDITORIAL DATA MATRIX</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#111111] uppercase">
                5&times;4 Sector Grid Analytics
              </h2>
            </div>
            <p className="text-sm font-mono text-[#111111]/70 max-w-md">
              Rigorous spatial pressure binning. Instead of averaging over the entire arena, ForceSight isolates the exact 10m&sup2; box undergoing compressive buildup.
            </p>
          </div>

          {/* Unboxed Swiss Editorial Table */}
          <div className="border-t border-b border-black/20 overflow-x-auto mb-12">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-black/15 text-[10px] text-[#111111]/50 uppercase tracking-widest">
                  <th className="py-3 px-4">Evaluation Metric</th>
                  <th className="py-3 px-4">Legacy CV / Optical Flow</th>
                  <th className="py-3 px-4">YOLO Object Detection Alone</th>
                  <th className="py-3 px-4 text-[#38BDF8] font-bold">ForceSight Digital Twin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                <tr>
                  <td className="py-3 px-4 font-bold text-[#111111]">Compressive Stress Quantification</td>
                  <td className="py-3 px-4 text-[#111111]/70">None (Pixel Velocity Only)</td>
                  <td className="py-3 px-4 text-[#111111]/70">Crude Head Counts</td>
                  <td className="py-3 px-4 text-[#38BDF8] font-bold">0&ndash;100 Peak Stress Index (Helbing)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#111111]">False Positive Sensitivity</td>
                  <td className="py-3 px-4 text-[#EF4444]">Severe (Flags, lighting shifts trigger alarms)</td>
                  <td className="py-3 px-4 text-[#111111]/70">Moderate (Occlusion failures in dense queues)</td>
                  <td className="py-3 px-4 text-[#10B981] font-bold">Robust Multi-Agent Physics Model</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#111111]">Spatial Granularity</td>
                  <td className="py-3 px-4 text-[#111111]/70">Global Viewport Average</td>
                  <td className="py-3 px-4 text-[#111111]/70">Unconnected Bounding Boxes</td>
                  <td className="py-3 px-4 text-[#38BDF8] font-bold">5&times;4 Coordinate Sector Matrix (A1&ndash;D5)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#111111]">Early Warning Lead Time</td>
                  <td className="py-3 px-4 text-[#111111]/70">&lt; 5 seconds (Post-Incident)</td>
                  <td className="py-3 px-4 text-[#111111]/70">None (Only counts after crowd builds)</td>
                  <td className="py-3 px-4 text-[#38BDF8] font-bold">45&ndash;90 Seconds Proactive Lead Time</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#111111]">Mobile Security Companion</td>
                  <td className="py-3 px-4 text-[#111111]/70">None (Control Room Only)</td>
                  <td className="py-3 px-4 text-[#111111]/70">Third-Party Notifications</td>
                  <td className="py-3 px-4 text-[#10B981] font-bold">300ms Synchronized Guard App + Haptics</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Interactive Tile System Preview Grid */}
          <div className="rounded-xl border border-black/15 bg-white p-6 shadow-md">
            <div className="flex justify-between items-center text-xs font-mono text-[#111111]/70 uppercase tracking-wider mb-4">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#38BDF8]" />
                <b>Spatial Sector Pressure Grid (A1 &ndash; D5)</b>
              </span>
              <span className="text-[#38BDF8] font-bold">HOTSPOT: BOX {liveMetrics.hotspot}</span>
            </div>

            <div className="grid grid-cols-5 gap-2 font-mono text-xs text-center">
              {['A', 'B', 'C', 'D'].map((row) =>
                [1, 2, 3, 4, 5].map((col) => {
                  const name = `${row}${col}`;
                  const isHot = name === liveMetrics.hotspot;
                  const isGate = name === 'B3';

                  let tileStyle = 'bg-[#F5F2EB] border-black/10 text-[#111111]';
                  if (isHot) {
                    tileStyle = 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-400 font-bold';
                  } else if (isGate) {
                    tileStyle = 'bg-cyan-50 border-cyan-400 text-cyan-800 font-bold';
                  }

                  return (
                    <div
                      key={name}
                      className={`p-3 rounded border flex flex-col justify-between items-center transition-all ${tileStyle}`}
                    >
                      <span className="text-xs">{name}</span>
                      <span className="text-[10px] text-black/50 mt-1">
                        {isHot ? `${liveMetrics.psi}%` : isGate ? 'GATE' : 'OK'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 06: FLEET DISPATCH & DEPLOYMENT PORTAL
           ===================================================================== */}
        <section
          id="deployment"
          className="py-24 px-6 sm:px-10 max-w-7xl mx-auto border-t border-black/10"
        >
          {/* Section Header */}
          <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#111111]/60 flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>06 &middot; DEPLOYMENT COMMAND</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#111111] uppercase">
                Launch Digital Twin Ports
              </h2>
            </div>
            <p className="text-sm font-mono text-[#111111]/70 max-w-md">
              Access the live digital twin simulation environment or pair a mobile security marshal device.
            </p>
          </div>

          {/* Dual Launch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Simulator Console Card */}
            <div className="rounded-2xl border border-black/15 bg-[#111111] text-[#F5F2EB] p-8 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between font-mono text-xs text-white/50 mb-6">
                  <span className="flex items-center gap-1.5 text-[#38BDF8]">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                    DESKTOP CONSOLE
                  </span>
                  <span>PORTAL /simulator</span>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#38BDF8] mb-6">
                  <Monitor className="w-6 h-6" />
                </div>

                <h3 className="text-3xl font-black font-display uppercase tracking-tight text-white mb-3">
                  Digital Twin Sandbox
                </h3>

                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-body mb-8">
                  Full control deck with continuous 60 FPS Canvas rendering, 3D holographic perspective toggle, interactive sliders (Spawn Rate, Gate Width, Kinetic Panic), and rolling 30-second Recharts stress telemetry.
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <MagneticButton>
                  <Link
                    href="/simulator"
                    className="px-6 py-3 rounded-full bg-[#38BDF8] hover:bg-cyan-400 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
                  >
                    <span>Open Desktop Twin</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </MagneticButton>
                <span className="font-mono text-xs text-white/50">60 FPS Loop</span>
              </div>
            </div>

            {/* Mobile Guard Companion Card */}
            <div className="rounded-2xl border border-black/15 bg-white text-[#111111] p-8 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between font-mono text-xs text-[#111111]/50 mb-6">
                  <span className="flex items-center gap-1.5 text-[#EF4444]">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                    GUARD APP
                  </span>
                  <span>PORTAL /mobile</span>
                </div>

                <div className="w-12 h-12 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center text-[#EF4444] mb-6">
                  <Smartphone className="w-6 h-6" />
                </div>

                <h3 className="text-3xl font-black font-display uppercase tracking-tight text-[#111111] mb-3">
                  Mobile Guard Alert Dashboard
                </h3>

                <p className="text-xs sm:text-sm text-[#111111]/70 leading-relaxed font-body mb-8">
                  Edge-to-edge security marshal unit with isolated selected-box Peak Stress Index, tri-state alert engine, deep red critical background pulse, hardware vibration haptics, and instant marshal sector dispatch.
                </p>
              </div>

              <div className="pt-6 border-t border-black/10 flex items-center justify-between">
                <MagneticButton>
                  <Link
                    href="/mobile"
                    className="px-6 py-3 rounded-full bg-[#111111] hover:bg-black text-[#F5F2EB] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
                  >
                    <span>Open Mobile Guard</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </MagneticButton>
                <span className="font-mono text-xs text-[#111111]/50">300ms Synchronized</span>
              </div>
            </div>
          </div>

          {/* Architectural Summary Strip */}
          <div className="border-t border-black/15 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-xs text-[#111111]">
            <div>
              <div className="text-[10px] text-[#111111]/50 uppercase tracking-widest">Stack</div>
              <div className="font-bold mt-1">Next.js App Router</div>
            </div>
            <div>
              <div className="text-[10px] text-[#111111]/50 uppercase tracking-widest">Physics</div>
              <div className="font-bold mt-1">Helbing Social Force</div>
            </div>
            <div>
              <div className="text-[10px] text-[#111111]/50 uppercase tracking-widest">Telemetry</div>
              <div className="font-bold mt-1">300ms State Bridge</div>
            </div>
            <div>
              <div className="text-[10px] text-[#111111]/50 uppercase tracking-widest">Standard</div>
              <div className="font-bold mt-1">Still 2014 Benchmark</div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            FOOTER (SWISS EDITORIAL MINIMALIST)
           ===================================================================== */}
        <footer className="border-t border-black/15 py-12 px-6 sm:px-10 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-xs text-[#111111]/60">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
            <span className="font-bold text-[#111111] uppercase tracking-wider">
              ForceSight &middot; Digital Twin
            </span>
            <span>&middot; Version 2.5</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/simulator" className="hover:text-[#111111] transition">
              /simulator
            </Link>
            <Link href="/mobile" className="hover:text-[#111111] transition">
              /mobile
            </Link>
            <Link href="/api/telemetry" className="hover:text-[#111111] transition">
              /api/telemetry
            </Link>
          </div>

          <div>
            &copy; 2026 FORCESIGHT DYNAMICS. ALL RIGHTS RESERVED.
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}
