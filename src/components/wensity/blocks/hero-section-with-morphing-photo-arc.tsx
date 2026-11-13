'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ShieldAlert,
  Activity,
  Radio,
  Gauge,
  Cpu,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';

export interface PhotoArcItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  imageUrl: string;
  badge?: string;
  metric?: string;
  metricLabel?: string;
  tag?: string;
}

export interface HeroSectionWithMorphingPhotoArcProps {
  badge?: string;
  title?: React.ReactNode;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  items?: PhotoArcItem[];
  autoRotateInterval?: number;
  className?: string;
  onItemSelect?: (item: PhotoArcItem, index: number) => void;
}

export const DEFAULT_FORCESIGHT_ITEMS: PhotoArcItem[] = [
  {
    id: 'piston-frame',
    title: 'Precision Mechanical Testing Frame',
    subtitle: 'Lead-screw driven linear actuator delivering controlled 0–5 kN compressive loading for crush calibration.',
    category: 'HARDWARE CALIBRATION',
    imageUrl: '/subsystems/piston_frame.png',
    badge: 'ACTUATOR FRAME',
    metric: '5.0 kN',
    metricLabel: 'Peak Stroke Capacity',
    tag: 'CALIBRATION RIG',
  },
  {
    id: 'load-cell',
    title: 'Multi-Axis Load Cell Telemetry',
    subtitle: 'High-speed strain-gauge bridge recording contact force vectors, barrier moments, and pinning impulses.',
    category: 'TELEMETRY BRIDGE',
    imageUrl: '/subsystems/load_cell.png',
    badge: 'STRAIN SENSORS',
    metric: '100 Hz',
    metricLabel: 'Sampling Frequency',
    tag: 'REAL-TIME DATA',
  },
  {
    id: 'photoelastic-fringe',
    title: 'Digital Photoelastic Stress Optics',
    subtitle: 'Michel-Lévy chromatic fringe mapping transforming optical flow divergence into visible isobar contours.',
    category: 'BIREFRINGENCE CV',
    imageUrl: '/subsystems/photoelastic_optics.png',
    badge: 'BIREFRINGENCE',
    metric: '0–100',
    metricLabel: 'Peak Stress Index',
    tag: 'OPENCV ENGINE',
  },
  {
    id: 'cctv-analytics',
    title: 'Farnebäck Optical Flow Ingestion',
    subtitle: 'Dual-frame polynomial expansion tracking crowd velocity variance and detecting fluidization collapse.',
    category: 'CCTV INTEGRATION',
    imageUrl: '/subsystems/cctv_analytics.png',
    badge: 'AI STREAM DECODER',
    metric: '< 28 ms',
    metricLabel: 'Processing Latency',
    tag: 'BENCHMARK RTSP',
  },
  {
    id: 'guard-dispatch',
    title: 'Marshal Tactical Early-Warning Deck',
    subtitle: 'Glanceable Swiss-editorial mobile dashboard routing marshals to high-risk bottlenecks 45s ahead of surges.',
    category: 'TACTICAL DISPATCH',
    imageUrl: '/subsystems/guard_dispatch.png',
    badge: 'MOBILE DISPATCH',
    metric: '45–60 s',
    metricLabel: 'Surge Lead Time',
    tag: 'EARLY WARNING',
  },
];

export default function HeroSectionWithMorphingPhotoArc({
  badge = 'FORCESIGHT v2.5 // INTEGRATED PROACTIVE SYSTEM',
  title = (
    <>
      PHYSICAL COMPRESSION RIG.{' '}
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-300 to-rose-400">
        DIGITAL PHOTOELASTIC INTELLIGENCE.
      </span>
    </>
  ),
  description = 'ForceSight unites mechanical screw-driven piston load frames, real-time load cell telemetry, and OpenCV photoelastic stress analysis to make invisible crush dynamics visible 45 seconds before incidents develop.',
  primaryCtaText = 'Launch Indoor Twin',
  primaryCtaHref = '/simulator',
  secondaryCtaText = 'Inspect CCTV Feeds',
  secondaryCtaHref = '/cctv',
  items = DEFAULT_FORCESIGHT_ITEMS,
  autoRotateInterval = 6000,
  className = '',
  onItemSelect,
}: HeroSectionWithMorphingPhotoArcProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const headingId = useId();
  const prefersReducedMotion = useReducedMotion();
  const touchStartXRef = useRef<number | null>(null);

  const activeItem = items[activeIndex] || items[0];

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleSelect = (idx: number) => {
    setActiveIndex(idx);
    onItemSelect?.(items[idx], idx);
  };

  // Keyboard navigation across arc items
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      handleSelect(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      handleSelect(items.length - 1);
    }
  };

  // Auto-rotation timer with pause on hover / focus
  useEffect(() => {
    if (isPaused || autoRotateInterval <= 0 || prefersReducedMotion) return;
    const interval = setInterval(handleNext, autoRotateInterval);
    return () => clearInterval(interval);
  }, [isPaused, autoRotateInterval, handleNext, prefersReducedMotion]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) handleNext();
      else handlePrev();
    }
    touchStartXRef.current = null;
  };

  return (
    <section
      aria-labelledby={headingId}
      className={`relative w-full overflow-hidden bg-[#0A0D14] text-[#F5F2EB] py-16 sm:py-24 border-b border-white/10 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Background Architectural Mesh & Subtle Radial Glow */}
      <div className="absolute inset-0 pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-gradient-to-b from-sky-500/15 via-rose-500/10 to-transparent blur-3xl opacity-80" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Eyebrow Badge */}
        {badge && (
          <div className="flex items-center gap-2 mb-6 font-mono text-[11px] tracking-widest uppercase">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/15 text-sky-400 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              {badge}
            </span>
            <span className="text-white/40 hidden sm:inline">&middot; HARDWARE &times; CV TELEMETRY</span>
          </div>
        )}

        {/* Hero Title & Lead Description */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12 lg:mb-16">
          <div className="lg:col-span-8">
            <h1
              id={headingId}
              className="text-3xl sm:text-5xl lg:text-6xl font-black font-display uppercase tracking-tight leading-[1.08] text-white"
            >
              {title}
            </h1>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-end gap-5">
            <p className="text-sm sm:text-base font-body text-white/70 leading-relaxed">
              {description}
            </p>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              {primaryCtaHref && (
                <Link
                  href={primaryCtaHref}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-400 text-black font-bold tracking-wider uppercase hover:bg-sky-300 transition-colors shadow-[0_0_20px_rgba(56,189,248,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  <span>{primaryCtaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              )}
              {secondaryCtaHref && (
                <Link
                  href={secondaryCtaHref}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/15 text-white/90 hover:bg-white/10 hover:border-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>{secondaryCtaText}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            THE MORPHING PHOTO ARC STAGE
           ========================================================================= */}
        <div
          role="region"
          aria-label="ForceSight Modular Subsystem Showcase"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 sm:p-8 lg:p-10 shadow-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {/* Top Arc Telemetry Ticker */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white tracking-wider uppercase">
                {activeItem.category} // {activeItem.id.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-white/50 text-[11px]">
                SUBSYSTEM {activeIndex + 1} OF {items.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous subsystem"
                  className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next subsystem"
                  className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Morphing Visual Canvas & Focused Card Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-8">
            {/* Left: Active Hero Spotlight Panel */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full gap-6">
              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeItem.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-[10px] font-mono font-bold text-sky-300 uppercase tracking-wider">
                        {activeItem.badge || 'ACTIVE SPEC'}
                      </span>
                      {activeItem.tag && (
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                          {activeItem.tag}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight text-white">
                      {activeItem.title}
                    </h2>
                    <p className="text-xs sm:text-sm font-body text-white/70 leading-relaxed">
                      {activeItem.subtitle}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Real-time Metric Pill */}
              {activeItem.metric && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between font-mono">
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">
                      {activeItem.metricLabel || 'Primary Metric'}
                    </div>
                    <div className="text-2xl font-black text-sky-400 mt-0.5">
                      {activeItem.metric}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/25 flex items-center justify-center text-sky-400">
                    <Gauge className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>
              )}
            </div>

            {/* Right: The Curved / Morphing Photo Arc Ring */}
            <div className="lg:col-span-7 relative h-72 sm:h-96 w-full flex items-center justify-center overflow-visible">
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ perspective: 1000 }}
              >
                {items.map((item, index) => {
                  // Calculate relative offset from active index
                  const offset = index - activeIndex;
                  const absOffset = Math.abs(offset);
                  const isVisible = absOffset <= 2 || absOffset >= items.length - 2;

                  // Normalize cyclical index
                  let circularOffset = offset;
                  if (offset > items.length / 2) circularOffset = offset - items.length;
                  if (offset < -items.length / 2) circularOffset = offset + items.length;

                  // Arc geometry: x spreads horizontally, y bows down in an arc curve
                  const xTranslate = circularOffset * 140;
                  const yTranslate = Math.pow(circularOffset, 2) * 18;
                  const zTranslate = -Math.abs(circularOffset) * 90;
                  const rotateY = circularOffset * -16;
                  const scale = Math.max(0.68, 1 - Math.abs(circularOffset) * 0.16);
                  const opacity = Math.max(0.2, 1 - Math.abs(circularOffset) * 0.35);
                  const isCurrent = circularOffset === 0;

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(index)}
                      aria-label={`View ${item.title}`}
                      aria-current={isCurrent ? 'true' : undefined}
                      animate={{
                        x: xTranslate,
                        y: yTranslate,
                        z: zTranslate,
                        rotateY,
                        scale,
                        opacity: isVisible ? opacity : 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 24,
                      }}
                      className={`absolute w-44 sm:w-60 aspect-[4/5] rounded-2xl overflow-hidden border transition-shadow cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 ${
                        isCurrent
                          ? 'border-sky-400 ring-2 ring-sky-400/50 shadow-[0_15px_40px_rgba(56,189,248,0.35)] z-30'
                          : 'border-white/15 hover:border-white/40 shadow-xl z-10'
                      }`}
                      style={{
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 180px, 240px"
                        className="object-cover"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-left font-mono">
                        <span className="text-[9px] uppercase tracking-wider text-sky-400 block font-bold truncate">
                          {item.category}
                        </span>
                        <span className="text-xs font-bold text-white block truncate">
                          {item.title}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Arc Thumbnails & Navigation Dots */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[10px] uppercase">DIRECT JUMP:</span>
              <div className="flex items-center gap-1.5">
                {items.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    aria-label={`Jump to item ${idx + 1}: ${item.title}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeIndex === idx
                        ? 'w-7 bg-sky-400'
                        : 'w-2 bg-white/20 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-white/50">
              <span className="hidden sm:inline">Use &larr; &rarr; arrow keys to navigate arc</span>
              <span className="text-sky-400 font-bold">INTERACTION: ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
