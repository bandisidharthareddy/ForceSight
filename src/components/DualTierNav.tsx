'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Radio, Terminal, Smartphone, Monitor, ChevronRight, Play } from 'lucide-react';
import ScrambleText from './ScrambleText';
import MagneticButton from './MagneticButton';

interface Chapter {
  id: string;
  number: string;
  title: string;
}

const CHAPTERS: Chapter[] = [
  { id: 'prologue', number: '01', title: 'PROLOGUE' },
  { id: 'engine', number: '02', title: 'HELBING ENGINE' },
  { id: 'architecture', number: '03', title: '360° ARCHITECTURE' },
  { id: 'specifications', number: '04', title: 'PHOTOELASTIC SPECS' },
  { id: 'matrix', number: '05', title: 'SECTOR MATRIX' },
  { id: 'deployment', number: '06', title: 'FLEET DISPATCH' },
];

export default function DualTierNav() {
  const [activeChapter, setActiveChapter] = useState<string>('prologue');
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      setScrollPercent(Math.min(100, Math.max(0, progress)));
      setHasScrolled(scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for chapters
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -40% 0px' }
    );

    CHAPTERS.forEach((ch) => {
      const el = document.getElementById(ch.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* 1. FLOATING TOP CAPSULE NAVIGATION */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl">
        <nav className="glass-panel px-4 sm:px-6 py-2.5 rounded-full border border-black/15 bg-[#111111]/85 text-[#F5F2EB] backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3">
          {/* Brand mark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] group-hover:scale-110 transition-transform">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-widest font-sans uppercase text-white">
                ForceSight
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 font-mono text-cyan-300 hidden sm:inline">
                v2.5
              </span>
            </div>
          </Link>

          {/* Quick Anchor Links (Desktop) */}
          <div className="hidden md:flex items-center gap-5 text-xs font-mono text-white/70">
            <button
              onClick={() => scrollToSection('engine')}
              className="hover:text-white transition"
            >
              <ScrambleText text="02 // Physics" />
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="hover:text-white transition"
            >
              <ScrambleText text="03 // 360° View" />
            </button>
            <button
              onClick={() => scrollToSection('specifications')}
              className="hover:text-white transition"
            >
              <ScrambleText text="04 // Specs" />
            </button>
            <button
              onClick={() => scrollToSection('matrix')}
              className="hover:text-white transition"
            >
              <ScrambleText text="05 // Matrix" />
            </button>
          </div>

          {/* Dual Portal Direct Launch CTAs */}
          <div className="flex items-center gap-2">
            <MagneticButton>
              <Link
                href="/demo"
                className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 hover:border-red-400 text-[11px] font-mono text-white flex items-center gap-1.5 transition shadow-sm"
                title="Watch incident demonstration video (fire outbreak & crowd surge)"
              >
                <Play className="w-3.5 h-3.5 text-[#EF4444]" />
                <span className="hidden sm:inline">Incident Demo</span>
              </Link>
            </MagneticButton>

            <MagneticButton>
              <Link
                href="/simulator"
                className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 hover:border-[#38BDF8] text-[11px] font-mono text-white flex items-center gap-1.5 transition shadow-sm"
              >
                <Monitor className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="hidden sm:inline">Simulator</span>
              </Link>
            </MagneticButton>

            <MagneticButton>
              <Link
                href="/mobile"
                className="px-3.5 py-1.5 rounded-full bg-[#38BDF8] hover:bg-cyan-400 text-black text-[11px] font-bold font-mono tracking-wider flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(56,189,248,0.35)]"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Guard App</span>
              </Link>
            </MagneticButton>
          </div>
        </nav>
      </header>

      {/* 2. VERTICAL CHAPTER PROGRESS RAIL (DESKTOP) */}
      <aside
        className={`fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3 font-mono transition-opacity duration-500 ${
          hasScrolled ? 'opacity-100' : 'opacity-40'
        }`}
      >
        <div className="relative pl-4 border-l border-black/15 flex flex-col gap-4 text-[10px]">
          {/* Scroll progress ruler indicator line */}
          <div
            className="absolute left-[-1.5px] top-0 w-[2.5px] bg-[#38BDF8] transition-all duration-150 rounded-full"
            style={{ height: `${scrollPercent}%` }}
          />

          {CHAPTERS.map((ch) => {
            const isActive = activeChapter === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => scrollToSection(ch.id)}
                className={`text-left group flex items-center gap-2 transition-all ${
                  isActive
                    ? 'text-[#111111] font-bold scale-105'
                    : 'text-[#111111]/40 hover:text-[#111111]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    isActive ? 'bg-[#38BDF8] scale-125' : 'bg-black/20 group-hover:bg-black/50'
                  }`}
                />
                <span className="tracking-wider">{ch.number}</span>
                <span className="text-[9px] tracking-widest uppercase">
                  {ch.title}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
