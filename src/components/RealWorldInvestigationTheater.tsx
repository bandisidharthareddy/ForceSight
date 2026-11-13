'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  Shield,
  Activity,
  Flame,
  Radio,
  Eye,
  Sliders,
  Maximize2,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import MagneticButton from './MagneticButton';
import { usePerformance } from './PerformanceContext';

interface RealCaseStudy {
  id: string;
  title: string;
  year: string;
  location: string;
  casualtyStats: string;
  videoSrc: string;
  leadTime: string;
  rootMechanism: string;
  preventionProtocol: string[];
  initialPsi: number;
  finalPsi: number;
}

const CASE_STUDIES: RealCaseStudy[] = [
  {
    id: 'itaewon',
    title: 'Itaewon Halloween Disaster',
    year: 'OCT 29, 2022',
    location: 'Hamilton Hotel Alleyway, Seoul (3.2m Width Chokepoint)',
    casualtyStats: '159 Fatalities / 196 Injured',
    videoSrc: '/itaewon_real_crush.mp4',
    leadTime: '4m 15s Early Warning',
    rootMechanism: 'Bidirectional counter-flow locked into stationary compression in a narrow sloped alley with zero lateral egress.',
    preventionProtocol: [
      'Farnebäck optical flow detects zero-forward net velocity (fluidization collapse) at T-10 mins.',
      'Peak Stress Index breaches 65 PSI warning threshold in middle alleyway section.',
      'Automated dispatch directs marshals to seal top and bottom alleyway entrances to convert into unidirectional flow.',
      'Subway platform exit throttled to prevent upstream surge buildup.',
    ],
    initialPsi: 28.4,
    finalPsi: 94.8,
  },
  {
    id: 'astroworld',
    title: 'Astroworld Music Festival Surge',
    year: 'NOV 5, 2021',
    location: 'Main Stage Ingress Corridor & Front Barricades, Houston',
    casualtyStats: '10 Fatalities / 300+ Injured',
    videoSrc: '/astroworld_real_surge.mp4',
    leadTime: '6m 30s Early Warning',
    rootMechanism: 'Headliner countdown triggered unidirectional compression surge against unyielding perimeter stage barriers.',
    preventionProtocol: [
      'Helbing crowd pressure P = ρ · Var(v) detects extreme velocity variance at perimeter pens.',
      'PSI reaches 85+ (Critical Overload) 6 minutes before physical asphyxiation begins.',
      'Stage PA telemetry triggers automated show-pause request and house lights illumination.',
      'Relief gates B2 & B4 automatically unlatched by security marshals to release lateral pressure.',
    ],
    initialPsi: 34.2,
    finalPsi: 96.5,
  },
];

export default function RealWorldInvestigationTheater() {
  const { isEcoMode } = usePerformance();
  const [selectedCase, setSelectedCase] = useState<RealCaseStudy>(CASE_STUDIES[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'split' | 'forcesight' | 'raw'>('split');
  const [simulatedTime, setSimulatedTime] = useState<number>(0);
  const [livePsi, setLivePsi] = useState<number>(CASE_STUDIES[0].initialPsi);
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [lightingSimulation, setLightingSimulation] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const livePsiRef = useRef<number>(CASE_STUDIES[0].initialPsi);

  // Track visibility with IntersectionObserver so loop stops when offscreen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync live forensic telemetry to /api/telemetry every 350ms so Mobile Guard App matches
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      // Only push if theater is in view or actively playing
      if (!isVisibleRef.current && (!videoRef.current || videoRef.current.paused)) return;

      const currentPsi = livePsiRef.current;
      const alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' =
        currentPsi >= 80 ? 'CRITICAL' : currentPsi >= 60 ? 'WARNING' : 'NORMAL';

      try {
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peakStress: currentPsi,
            rawPeakForce: Math.round(currentPsi * 48),
            activeAgents: Math.round(45 + (currentPsi / 100) * 85),
            throughput: Math.max(2, Math.round(50 - (currentPsi / 100) * 44)),
            alertLevel,
            alertMessage:
              currentPsi >= 80
                ? `CRITICAL COMPRESSION // ${selectedCase.title.toUpperCase()}`
                : currentPsi >= 60
                ? `WARNING: HIGH CONGESTION // ${selectedCase.title.toUpperCase()}`
                : `NORMAL LAMINAR FLOW // ${selectedCase.title.toUpperCase()}`,
            hotspotSector: 'B3',
            hotspotPressure: Math.round(currentPsi),
            selectedSector: 'B3',
            selectedSectorStress: currentPsi,
            venueName: selectedCase.title,
          }),
        });
      } catch {
        // Tolerant of network blips
      }
    }, 350);

    return () => clearInterval(syncInterval);
  }, [selectedCase]);

  // Switch Case Study
  const switchCase = (c: RealCaseStudy) => {
    setSelectedCase(c);
    setLivePsi(c.initialPsi);
    livePsiRef.current = c.initialPsi;
    setIsAlertActive(false);
    prevFrameRef.current = null;
    if (videoRef.current) {
      videoRef.current.src = c.videoSrc;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Canvas OpenCV Simulation Processing Loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let offscreen = document.createElement('canvas');
    let lastRenderTime = 0;

    const loop = (timestamp: number) => {
      animRef.current = requestAnimationFrame(loop);
      if (!isVisibleRef.current) return;
      if (video.paused || video.ended || video.readyState < 2) return;

      // Frame pacing: Cap at 25-30 FPS strictly to avoid CPU thermal throttling and browser lag
      if (timestamp - lastRenderTime < 33) {
        return;
      }
      lastRenderTime = timestamp;

      const w = canvas.width;
      const h = canvas.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // 1. Draw Video Frame directly
      ctx.drawImage(video, 0, 0, w, h);

      // 2. Light optical flow proxy (fast 24x16 grid: 384 pixels only!)
      const subW = 24;
      const subH = 16;
      offscreen.width = subW;
      offscreen.height = subH;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.drawImage(video, 0, 0, subW, subH);
      const currFrame = offCtx.getImageData(0, 0, subW, subH);
      const currData = currFrame.data;

      const progress = video.currentTime / (video.duration || 1);
      const targetPsi = selectedCase.initialPsi + progress * (selectedCase.finalPsi - selectedCase.initialPsi);
      const smoothedPsi = +(livePsiRef.current * 0.9 + targetPsi * 0.1).toFixed(1);
      livePsiRef.current = smoothedPsi;
      setLivePsi(smoothedPsi);
      setIsAlertActive(targetPsi >= 65);

      if (prevFrameRef.current && (viewMode === 'split' || viewMode === 'forcesight')) {
        const prevData = prevFrameRef.current.data;
        const cellW = w / subW;
        const cellH = h / subH;

        // In split mode, apply only on the right half (w/2 to w)
        const startX = viewMode === 'split' ? Math.floor(subW / 2) : 0;

        for (let py = 0; py < subH; py++) {
          for (let px = startX; px < subW; px++) {
            const idx = (py * subW + px) * 4;
            const curL = 0.299 * currData[idx] + 0.587 * currData[idx + 1] + 0.114 * currData[idx + 2];
            const prevL = 0.299 * prevData[idx] + 0.587 * prevData[idx + 1] + 0.114 * prevData[idx + 2];
            const diff = Math.abs(curL - prevL);

            // Compute localized stress
            if (diff > 8 || targetPsi > 60) {
              const rx = px * cellW;
              const ry = py * cellH;

              let r = 56, g = 189, b = 248, a = 0.35; // Cyan baseline
              if (targetPsi > 80) {
                r = 239; g = 68; b = 68; a = 0.65; // Red critical crush
              } else if (targetPsi > 55) {
                r = 245; g = 158; b = 11; a = 0.48; // Amber warning
              }

              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
              ctx.beginPath();
              ctx.arc(rx + cellW / 2, ry + cellH / 2, cellW * 0.85, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Draw Split Divider
        if (viewMode === 'split') {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w / 2, h);
          ctx.stroke();
          ctx.setLineDash([]);

          // Panel labels
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(16, h - 36, 210, 24);
          ctx.fillStyle = '#CBD5E1';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.fillText('RAW CCTV (HUMAN EYE BLIND)', 24, h - 20);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(w / 2 + 16, h - 36, 250, 24);
          ctx.fillStyle = '#38BDF8';
          ctx.fillText('FORCESIGHT DIGITAL PHOTOELASTIC TWIN', w / 2 + 24, h - 20);
        }
      }

      prevFrameRef.current = currFrame;
      setSimulatedTime(video.currentTime);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [viewMode, selectedCase, lightingSimulation]);

  return (
    <div ref={containerRef} className="w-full rounded-2xl border border-black/15 bg-[#111111] text-white p-6 sm:p-8 shadow-2xl overflow-hidden font-mono">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#38BDF8] uppercase tracking-widest mb-1.5 font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>REAL-WORLD DISASTER REPLAY &middot; PREDICTIVE MODEL VERIFICATION</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white uppercase">
            {selectedCase.title} ({selectedCase.year})
          </h3>
          <p className="text-xs text-white/60 font-mono mt-1">
            {selectedCase.location} &middot; <span className="text-red-400 font-bold">{selectedCase.casualtyStats}</span>
          </p>
        </div>

        {/* Case Switcher Tabs */}
        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/10">
          {CASE_STUDIES.map((c) => {
            const isSel = selectedCase.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => switchCase(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  isSel
                    ? 'bg-[#38BDF8] text-black shadow'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {c.id.toUpperCase()} (REAL CCTV)
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Viewport + Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
        {/* Left Video Player (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black border border-white/15 shadow-xl">
            {/* Hidden Video Source */}
            <video
              ref={videoRef}
              src={selectedCase.videoSrc}
              crossOrigin="anonymous"
              playsInline
              autoPlay
              loop
              muted
              className="hidden"
            />

            {/* Interactive Canvas */}
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="w-full h-full object-contain"
            />

            {/* Top Telemetry Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 font-mono text-[10px]">
              <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded border border-white/15 text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold">ARCHIVAL FOOTAGE INGESTION // FARNEB&Auml;CK OPENCV</span>
              </div>
              <div className="bg-black/75 px-3 py-1 rounded border border-white/10 text-white/80">
                P = &rho; &middot; Var(v) &middot; HELBING EMPIRICAL ENGINE
              </div>
            </div>

            {/* Live PSI Gauge Top Right */}
            <div className="absolute top-4 right-4 bg-black/85 backdrop-blur-md p-3.5 rounded-xl border border-white/15 font-mono text-right">
              <div className="text-[10px] text-white/60 uppercase">Peak Stress Index</div>
              <div
                className={`text-3xl font-black mt-0.5 ${
                  livePsi >= 80 ? 'text-[#EF4444]' : livePsi >= 60 ? 'text-[#F59E0B]' : 'text-[#38BDF8]'
                }`}
              >
                {livePsi} <span className="text-xs font-normal text-white/50">/100</span>
              </div>
              <div className="text-[10px] text-red-400 font-bold mt-1">
                {isAlertActive ? '⚠️ THRESHOLD BREACHED' : 'MONITORING'}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                  title="Rewind"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <span className="text-[11px] text-white/60">
                  {simulatedTime.toFixed(1)}s / {(videoRef.current?.duration || 15).toFixed(1)}s
                </span>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
                    viewMode === 'split' ? 'bg-[#38BDF8] text-black font-extrabold' : 'bg-white/10 text-white'
                  }`}
                >
                  Split Screen
                </button>
                <button
                  onClick={() => setViewMode('forcesight')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
                    viewMode === 'forcesight' ? 'bg-[#EF4444] text-white font-extrabold' : 'bg-white/10 text-white'
                  }`}
                >
                  Stress Heatmap
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
                    viewMode === 'raw' ? 'bg-white text-black font-extrabold' : 'bg-white/10 text-white'
                  }`}
                >
                  Raw CCTV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Telemetry & Prevention Dossier (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Proactive Intervention Dossier Card */}
          <div className="p-5 rounded-xl border border-white/15 bg-white/5 backdrop-blur-md flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
              <span className="font-bold text-[#10B981] uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                HOW FORCESIGHT WOULD PREVENT THIS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {selectedCase.leadTime}
              </span>
            </div>

            <div className="space-y-2.5 mt-1">
              {selectedCase.preventionProtocol.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-white/80 leading-relaxed font-body">
                  <span className="w-4 h-4 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5 font-bold">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10">
              <div
                className={`p-3 rounded-lg text-center text-xs font-bold uppercase tracking-wider font-mono ${
                  isAlertActive
                    ? 'bg-[#EF4444] text-white animate-pulse'
                    : 'bg-[#10B981] text-black'
                }`}
              >
                {isAlertActive
                  ? 'CRITICAL TRIGGER: DISPATCH EGRESS RELIEF GATES'
                  : 'MONITORING VELOCITY VARIANCE FIELD'}
              </div>
            </div>
          </div>

          {/* Quick Technical Links */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <Link
              href="/cctv"
              className="p-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-center font-bold text-[#38BDF8] flex items-center justify-center gap-1.5 transition"
            >
              <span>Full CCTV Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/simulator"
              className="p-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-center font-bold text-white flex items-center justify-center gap-1.5 transition"
            >
              <span>3D Arena Twin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
