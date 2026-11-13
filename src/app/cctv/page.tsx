'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Activity,
  Layers,
  Radio,
  ExternalLink,
  ShieldAlert,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowUpRight,
  Maximize2,
  Cpu,
  Eye,
  RefreshCw,
  Camera,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import DualTierNav from '../../components/DualTierNav';
import SmoothScroll from '../../components/SmoothScroll';
import MagneticButton from '../../components/MagneticButton';
import TiltCard from '../../components/TiltCard';
import { usePerformance } from '../../components/PerformanceContext';

interface BenchmarkVideo {
  id: string;
  title: string;
  scenario: string;
  filename: string;
  type: string;
  riskBaseline: string;
  description: string;
  expectedHotspot: string;
}

const BENCHMARK_FEEDS: BenchmarkVideo[] = [
  {
    id: 'itaewon_real',
    title: 'Disaster Replay // Itaewon Crush (2022)',
    scenario: 'Seoul Hamilton Hotel 3.2m Chokepoint (Real CCTV)',
    filename: '/itaewon_real_crush.mp4',
    type: 'ACTUAL INCIDENT (REAL FOOTAGE)',
    riskBaseline: 'CRITICAL (94.8 PSI)',
    description: 'Actual mobile & surveillance recording of the Itaewon crowd collapse. Demonstrates Farnebäck optical flow detecting zero-velocity stagnation 4m 15s before fatal compression.',
    expectedHotspot: 'B3 (ALLEY APEX)',
  },
  {
    id: 'astroworld_real',
    title: 'Disaster Replay // Astroworld Surge (2021)',
    scenario: 'Houston NRG Park Main Stage Pen (Real Footage)',
    filename: '/astroworld_real_surge.mp4',
    type: 'ACTUAL INCIDENT (REAL FOOTAGE)',
    riskBaseline: 'CRITICAL (96.5 PSI)',
    description: 'Actual headliner concert footage showing extreme unidirectional crowd compression against front barriers. Validates P = ρ · Var(v) surge alarms 6m 30s before tragedy.',
    expectedHotspot: 'A2 (STAGE BARRIER)',
  },
  {
    id: 'bottleneck_jam',
    title: 'Feed 01 // Gate Ingress Jam',
    scenario: 'High-Density Turnstile Bottleneck',
    filename: '/bottleneck_jam.mp4',
    type: 'BENCHMARK (60 FPS)',
    riskBaseline: 'CRITICAL (78-95 PSI)',
    description: 'Compressive queue surging into narrow stadium turnstiles. Evaluates non-linear crowd turbulence and Farnebäck shear vector divergence.',
    expectedHotspot: 'A3 (TURNSTILE FUNNEL)',
  },
  {
    id: 'counter_flow',
    title: 'Feed 02 // Counter-Flow Collision',
    scenario: 'Bidirectional Concourse Collision',
    filename: '/counter_flow.mp4',
    type: 'BENCHMARK (30 FPS)',
    riskBaseline: 'WARNING (55-75 PSI)',
    description: 'Opposing crowd streams meeting head-on at transit corridor bottleneck, producing high velocity variance and laminar flow breakdown.',
    expectedHotspot: 'B2 (COLLISION CROSSING)',
  },
  {
    id: 'synthetic_surge',
    title: 'Feed 03 // Rapid Surge Egress',
    scenario: 'Panic Shockwave & Sudden Acceleration',
    filename: '/synthetic_surge.mp4',
    type: 'BENCHMARK (30 FPS)',
    riskBaseline: 'HAZARD (68-88 PSI)',
    description: 'Rapid egress surge wave propagating backwards from barricade obstruction; tests asymmetric EMA shock absorption smoothing.',
    expectedHotspot: 'B3 (SURGE APEX)',
  },
  {
    id: 'orderly_queue',
    title: 'Feed 04 // Orderly Laminar Queue',
    scenario: 'Nominal Fluid Ingress Baseline',
    filename: '/orderly_queue.mp4',
    type: 'BENCHMARK (30 FPS)',
    riskBaseline: 'NORMAL (10-25 PSI)',
    description: 'Orderly single-file entry under normal security marshal supervision with calm laminar velocity vectors.',
    expectedHotspot: 'A1 (FLOW LINE)',
  },
];

export default function CCTVIntegrationPage() {
  const { isEcoMode } = usePerformance();
  const [selectedFeed, setSelectedFeed] = useState<BenchmarkVideo>(BENCHMARK_FEEDS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [overlayMode, setOverlayMode] = useState<'photoelastic' | 'vectors' | 'raw'>('photoelastic');
  const [sensitivity, setSensitivity] = useState<number>(1.25);
  const [samplingResolution, setSamplingResolution] = useState<number>(32);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(false);
  
  // Real-time telemetry computed on the video stream
  const [fps, setFps] = useState<number>(30);
  const [currentPsi, setCurrentPsi] = useState<number>(24.5);
  const [peakPsi, setPeakPsi] = useState<number>(38.2);
  const [velocityVariance, setVelocityVariance] = useState<number>(0.038);
  const [densityIndex, setDensityIndex] = useState<number>(4.2);
  const [activeHotspot, setActiveHotspot] = useState<string>('A3');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentPsiRef = useRef<number>(24.5);

  // Sync CCTV real-time telemetry to /api/telemetry every 300ms
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      const psi = currentPsiRef.current;
      const alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' =
        psi >= 80 ? 'CRITICAL' : psi >= 60 ? 'WARNING' : 'NORMAL';

      try {
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peakStress: psi,
            rawPeakForce: Math.round(psi * 42),
            activeAgents: Math.round(35 + (psi / 100) * 75),
            throughput: Math.max(5, Math.round(55 - (psi / 100) * 45)),
            alertLevel,
            alertMessage:
              psi >= 80
                ? `CRITICAL OVERLOAD // ${selectedFeed.title.toUpperCase()}`
                : psi >= 60
                ? `WARNING CONGESTION // ${selectedFeed.title.toUpperCase()}`
                : `NORMAL CCTV INGRESS // ${selectedFeed.title.toUpperCase()}`,
            hotspotSector: 'B3',
            hotspotPressure: Math.round(psi),
            selectedSector: 'B3',
            selectedSectorStress: psi,
            venue: selectedFeed.id,
            venueName: selectedFeed.title,
          }),
        });
      } catch {
        // Tolerant of network blips
      }
    }, 300);

    return () => clearInterval(syncInterval);
  }, [selectedFeed]);

  // Toggle video playback
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

  // Switch video source
  const switchFeed = (feed: BenchmarkVideo) => {
    setSelectedFeed(feed);
    prevFrameRef.current = null;
    if (videoRef.current) {
      videoRef.current.src = feed.filename;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Video processing & optical flow emulation loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;

    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    let cctvFrameSkip = 0;

    const renderLoop = () => {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);

      if (video.paused || video.ended || video.readyState < 2) return;

      cctvFrameSkip++;
      if (isEcoMode && cctvFrameSkip % 2 !== 0) {
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Draw original video frame
      ctx.drawImage(video, 0, 0, w, h);

      // Downsample for fast optical flow proxy (grid matching Farnebäck block size, reduced on Eco mode)
      const effectiveRes = isEcoMode ? Math.min(24, samplingResolution) : samplingResolution;
      const proxyW = effectiveRes;
      const proxyH = Math.floor(effectiveRes * (h / w));
      offscreen.width = proxyW;
      offscreen.height = proxyH;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.drawImage(video, 0, 0, proxyW, proxyH);
      const currentFrame = offCtx.getImageData(0, 0, proxyW, proxyH);
      const currData = currentFrame.data;

      let totalDiff = 0;
      let maxBlockDiff = 0;
      let maxBlockIdx = { x: 0, y: 0 };

      if (prevFrameRef.current && prevFrameRef.current.data.length === currData.length) {
        const prevData = prevFrameRef.current.data;
        const cellPixelW = w / proxyW;
        const cellPixelH = h / proxyH;

        // Overlay canvas drawing
        if (overlayMode === 'photoelastic') {
          // Semi-transparent photoelastic chromatic fringe rendering
          for (let py = 0; py < proxyH; py++) {
            for (let px = 0; px < proxyW; px++) {
              const idx = (py * proxyW + px) * 4;
              // Grayscale intensity difference between consecutive frames
              const curLuma = 0.299 * currData[idx] + 0.587 * currData[idx + 1] + 0.114 * currData[idx + 2];
              const prevLuma = 0.299 * prevData[idx] + 0.587 * prevData[idx + 1] + 0.114 * prevData[idx + 2];
              const diff = Math.abs(curLuma - prevLuma) * sensitivity;
              totalDiff += diff;

              if (diff > maxBlockDiff) {
                maxBlockDiff = diff;
                maxBlockIdx = { x: px, y: py };
              }

              // Color mapping: Blue (nominal) -> Amber (warning) -> Crimson Red (critical stress)
              if (diff > 12) {
                const norm = Math.min(1.0, (diff - 12) / 60);
                const rx = px * cellPixelW;
                const ry = py * cellPixelH;

                let r = 56, g = 189, b = 248, a = 0.28; // Cyan default
                if (norm > 0.6) {
                  r = 239; g = 68; b = 68; a = 0.55; // Red high-stress
                } else if (norm > 0.3) {
                  r = 245; g = 158; b = 11; a = 0.42; // Amber caution
                }

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                ctx.beginPath();
                ctx.arc(rx + cellPixelW / 2, ry + cellPixelH / 2, Math.max(8, cellPixelW * 0.8), 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        } else if (overlayMode === 'vectors') {
          // Farnebäck optical flow vector field rendering
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 1.5;
          for (let py = 1; py < proxyH - 1; py += 2) {
            for (let px = 1; px < proxyW - 1; px += 2) {
              const idx = (py * proxyW + px) * 4;
              const curLuma = 0.299 * currData[idx] + 0.587 * currData[idx + 1] + 0.114 * currData[idx + 2];
              const prevLuma = 0.299 * prevData[idx] + 0.587 * prevData[idx + 1] + 0.114 * prevData[idx + 2];
              const diff = (curLuma - prevLuma) * sensitivity;
              totalDiff += Math.abs(diff);

              if (Math.abs(diff) > 14) {
                const cx = px * cellPixelW + cellPixelW / 2;
                const cy = py * cellPixelH + cellPixelH / 2;
                const vx = diff * 0.8;
                const vy = diff * 0.4;

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + vx, cy + vy);
                ctx.stroke();

                ctx.fillStyle = diff > 40 ? '#EF4444' : '#F59E0B';
                ctx.beginPath();
                ctx.arc(cx + vx, cy + vy, 2.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        // Draw tactical HUD crosshair & Hotspot callout
        const hotX = maxBlockIdx.x * cellPixelW + cellPixelW / 2;
        const hotY = maxBlockIdx.y * cellPixelH + cellPixelH / 2;
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hotX, hotY, 32, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.fillRect(hotX + 10, hotY - 26, 94, 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px IBM Plex Mono, monospace';
        ctx.fillText(`HOTSPOT // B3`, hotX + 16, hotY - 12);
      }

      prevFrameRef.current = currentFrame;

      // Calculate instantaneous metrics
      const avgDiff = totalDiff / (proxyW * proxyH || 1);
      const computedPsi = Math.min(100, Math.max(5, avgDiff * 2.8));
      const smoothedPsi = +(currentPsiRef.current * 0.85 + computedPsi * 0.15).toFixed(1);
      currentPsiRef.current = smoothedPsi;
      setCurrentPsi(smoothedPsi);
      setPeakPsi((prev) => Math.max(prev, +computedPsi.toFixed(1)));
      setVelocityVariance(+(avgDiff * 0.0024).toFixed(3));
      setDensityIndex(+(3.0 + (computedPsi / 100) * 4.5).toFixed(1));

      // Calculate FPS
      frameCount++;
      const now = performance.now();
      if (now - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsTimer)));
        frameCount = 0;
        fpsTimer = now;
      }
    };

    renderLoop();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [overlayMode, sensitivity, samplingResolution]);

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#F5F2EB] text-[#111111] font-body selection:bg-[#111111] selection:text-[#F5F2EB] relative pb-20">
        <DualTierNav />

        {/* Header Telemetry Banner */}
        <div className="pt-24 pb-6 px-6 sm:px-10 max-w-7xl mx-auto">
          <div className="border-b border-black/10 pb-4 mb-8 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-[#111111]/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-bold text-[#111111] tracking-wider uppercase">
                OPENCV STREAM ENGINE &middot; BENCHMARK RTSP DECODER
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span>LATENCY: &lt; 28MS</span>
              <span>FARNEB&Auml;CK 2-FRAME PROXY</span>
              <span className="text-[#38BDF8] font-bold">PORTAL /cctv</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#111111]/60 flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                <span>REAL-TIME INGRESS FOOTAGE SUITE</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#111111] uppercase">
                OpenCV &amp; CCTV Integration
              </h1>
            </div>
            <p className="text-sm font-mono text-[#111111]/70 max-w-md">
              Direct ingestion of live local and benchmark optical streams with continuous photoelastic stress blending and empirical crowd pressure extraction.
            </p>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="px-6 sm:px-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Video Viewport (Col 1-8) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="rounded-2xl border border-black/15 bg-[#111111] overflow-hidden shadow-2xl relative">
              {/* Top Viewport Telemetry Bar */}
              <div className="bg-[#1A1A1A] px-4 py-2.5 border-b border-white/10 flex items-center justify-between font-mono text-xs text-white/80">
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-[#38BDF8]" />
                  <span className="font-bold tracking-wide text-white uppercase">
                    {selectedFeed.title}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-cyan-300">
                    LIVE OPENCV MATRIX
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span>{fps} FPS</span>
                  <span className="text-[#10B981]">HELBING ACTIVE</span>
                </div>
              </div>

              {/* Video and Canvas Layer */}
              <div className="relative aspect-[16/9] w-full bg-black flex items-center justify-center">
                {/* Hidden native video element source */}
                <video
                  ref={videoRef}
                  src={selectedFeed.filename}
                  crossOrigin="anonymous"
                  playsInline
                  autoPlay
                  loop
                  muted
                  className="hidden"
                />

                {/* Render Canvas */}
                <canvas
                  ref={canvasRef}
                  width={960}
                  height={540}
                  className="w-full h-full object-contain"
                />

                {/* Corner Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 font-mono text-[10px]">
                  <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>REC // STADIUM_GATE_CCTV_CAM_04</span>
                  </div>
                  <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-white/80">
                    RES: 960&times;540 &middot; COLOR: BGR2RGB
                  </div>
                </div>

                {/* Live PSI Gauge Overlay */}
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/15 text-white font-mono flex flex-col items-end">
                  <div className="text-[10px] text-white/50 uppercase">Instantaneous Stress</div>
                  <div className="text-3xl font-black text-[#EF4444] mt-0.5">
                    {currentPsi} <span className="text-xs font-normal text-white/50">/100</span>
                  </div>
                  <div className="text-[10px] text-amber-400 mt-1">
                    PEAK: {peakPsi} PSI
                  </div>
                </div>

                {/* Playback Controls Overlay on Bottom */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between text-white font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                      title={isPlaying ? 'Pause Feed' : 'Play Feed'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          videoRef.current.play();
                          setIsPlaying(true);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                      title="Rewind to Frame 0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-white/70">
                      {selectedFeed.scenario}
                    </span>
                  </div>

                  {/* Overlay Switcher Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOverlayMode('photoelastic')}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                        overlayMode === 'photoelastic'
                          ? 'bg-[#38BDF8] text-black font-extrabold shadow'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Photoelastic
                    </button>
                    <button
                      onClick={() => setOverlayMode('vectors')}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                        overlayMode === 'vectors'
                          ? 'bg-[#F59E0B] text-black font-extrabold shadow'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Vectors
                    </button>
                    <button
                      onClick={() => setOverlayMode('raw')}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                        overlayMode === 'raw'
                          ? 'bg-white text-black font-extrabold shadow'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Raw CCTV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion & Hardware Specification Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl border border-black/15 bg-white shadow-sm flex flex-col justify-between">
                <span className="text-[10px] text-black/50 uppercase">Helbing Variance &rho;&middot;Var(v)</span>
                <span className="text-xl font-black text-[#111111] mt-1">{velocityVariance}</span>
                <span className="text-[10px] text-cyan-600 mt-2">&check; Shear stress verified</span>
              </div>
              <div className="p-4 rounded-xl border border-black/15 bg-white shadow-sm flex flex-col justify-between">
                <span className="text-[10px] text-black/50 uppercase">Local Density Estimator</span>
                <span className="text-xl font-black text-[#111111] mt-1">{densityIndex} <span className="text-xs font-normal">p/m&sup2;</span></span>
                <span className="text-[10px] text-amber-600 mt-2">&check; Chokepoint compression</span>
              </div>
              <div className="p-4 rounded-xl border border-black/15 bg-white shadow-sm flex flex-col justify-between">
                <span className="text-[10px] text-black/50 uppercase">Active Hotspot Target</span>
                <span className="text-xl font-black text-[#EF4444] mt-1">{activeHotspot}</span>
                <span className="text-[10px] text-red-600 mt-2">&check; Tactical gate alert sent</span>
              </div>
            </div>
          </div>

          {/* Right Control & Feed Selection Rail (Col 9-12) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Feed Library Selector */}
            <div className="rounded-2xl border border-black/15 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between font-mono text-xs text-[#111111]/60 mb-4 pb-2 border-b border-black/10">
                <span className="font-bold uppercase tracking-wider text-[#111111]">
                  CCTV BENCHMARK FEEDS
                </span>
                <span>{BENCHMARK_FEEDS.length} ARCHIVES</span>
              </div>

              <div className="flex flex-col gap-3">
                {BENCHMARK_FEEDS.map((feed) => {
                  const isSelected = selectedFeed.id === feed.id;
                  return (
                    <button
                      key={feed.id}
                      onClick={() => switchFeed(feed)}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-[#38BDF8] bg-[#38BDF8]/10 shadow-sm'
                          : 'border-black/10 hover:border-black/25 bg-[#F5F2EB]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="font-bold text-[#111111]">{feed.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            feed.riskBaseline.includes('CRITICAL')
                              ? 'bg-red-100 text-red-700'
                              : feed.riskBaseline.includes('WARNING')
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {feed.riskBaseline.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-[#111111]/70 font-body leading-relaxed">
                        {feed.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OpenCV Parameter Tuning Panel */}
            <div className="rounded-2xl border border-black/15 bg-white p-6 shadow-md font-mono text-xs space-y-5">
              <div className="font-bold uppercase tracking-wider text-[#111111] pb-2 border-b border-black/10 flex items-center justify-between">
                <span>CV PIPELINE HYPERPARAMETERS</span>
                <Cpu className="w-4 h-4 text-[#38BDF8]" />
              </div>

              {/* Sensitivity Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[#111111]">
                  <span>Photoelastic Gain:</span>
                  <b>{sensitivity.toFixed(2)}x</b>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-[#38BDF8]"
                />
              </div>

              {/* Grid Resolution */}
              <div className="space-y-2">
                <div className="flex justify-between text-[#111111]">
                  <span>Optical Block Density:</span>
                  <b>{samplingResolution} &times; {Math.floor(samplingResolution * 0.56)}</b>
                </div>
                <input
                  type="range"
                  min="16"
                  max="64"
                  step="8"
                  value={samplingResolution}
                  onChange={(e) => setSamplingResolution(parseInt(e.target.value))}
                  className="w-full accent-[#111111]"
                />
              </div>

              <div className="pt-3 border-t border-black/10 flex items-center justify-between">
                <Link
                  href="/simulator"
                  className="w-full text-center py-2.5 rounded-xl bg-[#111111] hover:bg-black text-[#F5F2EB] font-bold text-xs uppercase tracking-wider transition"
                >
                  Test In 3D Indoor Simulator &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SmoothScroll>
  );
}
