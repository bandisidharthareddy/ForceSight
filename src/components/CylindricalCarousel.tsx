'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Flame,
  Activity,
  Layers,
  Sparkles,
  Cpu,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Compass,
} from 'lucide-react';
import ScrambleText from './ScrambleText';

interface CarouselItem {
  id: string;
  tag: string;
  title: string;
  category: string;
  description: string;
  metric: string;
  metricLabel: string;
  icon: React.ElementType;
  accent: 'cyan' | 'amber' | 'crimson';
}

const CAROUSEL_ITEMS: CarouselItem[] = [
  {
    id: '01',
    tag: 'CV-CORE // 01',
    title: 'Helbing Social Force Physics',
    category: 'Agent-Based Micro-Dynamics',
    description:
      'Continuous 60 FPS numerical integration combining psychological social distances, dynamic velocity relaxation horizons (τ = 0.55s), and tangential sliding friction.',
    metric: '60 FPS',
    metricLabel: 'Real-Time Physics Horizon',
    icon: Activity,
    accent: 'cyan',
  },
  {
    id: '02',
    tag: 'OPTIC-FLOW // 02',
    title: 'Digital Photoelastic Bloom',
    category: 'Stress Birefringence Simulation',
    description:
      'Mimics mechanical stress in polarized polyurethane by blending chromatic interference fringes (cyan ➔ amber ➔ crimson) directly onto high-density bottleneck zones.',
    metric: '0–100',
    metricLabel: 'Standardized Peak Stress Index',
    icon: Flame,
    accent: 'crimson',
  },
  {
    id: '03',
    tag: 'SPATIAL // 03',
    title: '5×4 Sector Matrix Telemetry',
    category: 'Spatial Pressure Binning',
    description:
      'Divides physical gate environments into 20 isometric sector coordinates with independent compressive force counters and isolated single-box focus.',
    metric: '20 TILES',
    metricLabel: 'Precision Coordinate Grid',
    icon: Layers,
    accent: 'amber',
  },
  {
    id: '04',
    tag: 'BARRIER // 04',
    title: 'Deflection Pillar Geometry',
    category: 'Hydrodynamic Crowd Relievers',
    description:
      'Simulates strategic circular obstacles placed ahead of turnstiles to break surging crowd pressure waves and naturally bifurcate ingress queues.',
    metric: '-38%',
    metricLabel: 'Chokepoint Peak Stress Reduction',
    icon: Compass,
    accent: 'cyan',
  },
  {
    id: '05',
    tag: 'SYNC // 05',
    title: '300ms Synchronized Twin',
    category: 'In-Memory Telemetry Pipeline',
    description:
      'Zero-delay bidirectional state bridge connecting desktop simulation engines with mobile security marshal terminals via sub-second HTTP polling and haptics.',
    metric: '300 MS',
    metricLabel: 'Bi-Directional State Dispatch',
    icon: Cpu,
    accent: 'amber',
  },
  {
    id: '06',
    tag: 'TACTICAL // 06',
    title: 'Mobile Guard Intervention',
    category: 'Haptic Guard Telemetry',
    description:
      'Edge-to-edge guard companion unit with automatic acoustic sirens, dual-frequency hardware vibration alerts, and 1-tap marshal sector dispatch.',
    metric: '2550 N',
    metricLabel: 'Rib-Fracture Prevention Limit',
    icon: ShieldAlert,
    accent: 'crimson',
  },
];

export default function CylindricalCarousel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const targetRotationRef = useRef<number>(0);
  const currentRotationRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startRotRef = useRef<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [panelWidth, setPanelWidth] = useState<number>(310);
  const [radius, setRadius] = useState<number>(380);

  const N = CAROUSEL_ITEMS.length;
  const angleStep = 360 / N;

  // Responsive radius calculation
  const updateDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    if (w < 640) {
      setPanelWidth(260);
      setRadius(290);
    } else if (w < 1024) {
      setPanelWidth(290);
      setRadius(340);
    } else {
      setPanelWidth(330);
      setRadius(420);
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Inertia damping (lerp) loop: rotation += (target - rotation) * 0.08
  useEffect(() => {
    let animId: number;
    const loop = () => {
      if (autoRotate && !isDraggingRef.current) {
        targetRotationRef.current -= 0.16;
      }

      const diff = targetRotationRef.current - currentRotationRef.current;
      currentRotationRef.current += diff * 0.08;
      setRotation(currentRotationRef.current);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate]);

  // Pointer drag & touch event handlers
  const handlePointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    startXRef.current = clientX;
    startRotRef.current = targetRotationRef.current;
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - startXRef.current;
    targetRotationRef.current = startRotRef.current + deltaX * 0.42;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const stepNext = () => {
    targetRotationRef.current = Math.round(targetRotationRef.current / angleStep) * angleStep - angleStep;
  };

  const stepPrev = () => {
    targetRotationRef.current = Math.round(targetRotationRef.current / angleStep) * angleStep + angleStep;
  };

  return (
    <div className="relative w-full py-16 overflow-hidden select-none">
      {/* Editorial Section Top Header */}
      <div className="max-w-6xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#111111]/60 flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span>03 &middot; SPATIAL ARCHITECTURE CAROUSEL</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-sans tracking-tight text-[#111111] uppercase">
            360&deg; Cylindrical Viewport
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-[#111111]/60 mr-2">
            ROTATION: <span className="font-bold text-[#111111]">{Math.abs(Math.round(rotation % 360))}&deg;</span>
          </div>

          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`p-2 rounded border text-xs font-mono flex items-center gap-1.5 transition ${
              autoRotate
                ? 'bg-[#111111] text-[#F5F2EB] border-transparent'
                : 'bg-white border-black/15 text-[#111111] hover:border-black'
            }`}
            title="Toggle Auto-Spin"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{autoRotate ? 'AUTO' : 'MANUAL'}</span>
          </button>

          <button
            onClick={stepPrev}
            className="p-2 rounded border border-black/15 bg-white text-[#111111] hover:bg-[#111111] hover:text-[#F5F2EB] transition shadow-sm"
            aria-label="Previous Module"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={stepNext}
            className="p-2 rounded border border-black/15 bg-white text-[#111111] hover:bg-[#111111] hover:text-[#F5F2EB] transition shadow-sm"
            aria-label="Next Module"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Cylindrical Stage */}
      <div
        ref={containerRef}
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onMouseMove={(e) => handlePointerMove(e.clientX)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
        onTouchEnd={handlePointerUp}
        className="cursor-grab active:cursor-grabbing relative h-[480px] sm:h-[530px] flex items-center justify-center"
        style={{
          perspective: '1300px',
        }}
      >
        {/* Revolving Cylindrical Assembly */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotation}deg)`,
          }}
        >
          {CAROUSEL_ITEMS.map((item, index) => {
            const panelAngle = index * angleStep;
            // Angle normalized to -180...180 relative to viewer
            const effectiveAngle = ((panelAngle + rotation) % 360 + 540) % 360 - 180;
            const isFront = Math.abs(effectiveAngle) < 38;
            const isBack = Math.abs(effectiveAngle) > 95;

            // Accent styles
            let accentPill = 'bg-cyan-950 text-cyan-400 border-cyan-500/30';
            let metricColor = 'text-[#38BDF8]';
            let topBorder = 'border-t-[#38BDF8]';

            if (item.accent === 'amber') {
              accentPill = 'bg-amber-950 text-amber-400 border-amber-500/30';
              metricColor = 'text-[#F59E0B]';
              topBorder = 'border-t-[#F59E0B]';
            } else if (item.accent === 'crimson') {
              accentPill = 'bg-red-950 text-red-400 border-red-500/30';
              metricColor = 'text-[#EF4444]';
              topBorder = 'border-t-[#EF4444]';
            }

            const IconComponent = item.icon;

            return (
              <div
                key={item.id}
                className={`absolute top-1/2 left-1/2 rounded-xl border border-black/15 bg-[#111111] text-[#F5F2EB] shadow-2xl p-6 flex flex-col justify-between transition-all duration-300 ${topBorder} border-t-4`}
                style={{
                  width: `${panelWidth}px`,
                  height: '420px',
                  marginLeft: `-${panelWidth / 2}px`,
                  marginTop: '-210px',
                  transform: `rotateY(${panelAngle}deg) translateZ(${radius}px) scale(${isFront ? 1.05 : 0.94})`,
                  transformStyle: 'preserve-3d',
                  filter: isBack ? 'blur(3.5px) brightness(0.65)' : 'none',
                  opacity: isBack ? 0.35 : isFront ? 1.0 : 0.78,
                  backfaceVisibility: 'visible',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${accentPill}`}>
                      {item.tag}
                    </span>
                    <span className="text-[10px] font-mono text-[#F5F2EB]/50">
                      SYS #{item.id}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center mb-4">
                    <IconComponent className={`w-5 h-5 ${metricColor}`} />
                  </div>

                  <div className="text-[11px] font-mono text-[#F5F2EB]/50 uppercase tracking-widest mb-1">
                    {item.category}
                  </div>
                  <h3 className="text-xl font-bold font-sans tracking-tight text-[#F5F2EB] mb-3 leading-snug">
                    <ScrambleText text={item.title} />
                  </h3>

                  <p className="text-xs font-sans text-[#F5F2EB]/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-end justify-between font-mono">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[#F5F2EB]/50">
                      {item.metricLabel}
                    </div>
                    <div className={`text-2xl font-black ${metricColor} mt-0.5`}>
                      {item.metric}
                    </div>
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-[#F5F2EB]/40 font-mono">
                    360&deg; DOCKED
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-[11px] font-mono text-[#111111]/50 uppercase tracking-widest mt-6">
        &larr; Drag horizontally or swipe to revolve spatial cylinder &rarr;
      </div>
    </div>
  );
}
