'use client';

import React from 'react';
import Link from 'next/link';
import {
  Monitor,
  Smartphone,
  Shield,
  Activity,
  ArrowRight,
  Flame,
  Radio,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col justify-between font-mono selection:bg-cyan-500 selection:text-black">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,179,217,0.15),rgba(255,255,255,0))]" />

      {/* Top Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between glass-panel z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest uppercase font-sans">ForceSight</div>
            <div className="text-[10px] text-slate-400 tracking-wider">Digital Twin Simulation &amp; Early-Warning Console</div>
          </div>
        </div>
        <div className="text-xs px-2.5 py-1 rounded border border-cyan-500/40 text-cyan-300 bg-cyan-950/40">
          SYSTEM ACTIVE &middot; NEXT.JS APPS
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 text-xs tracking-wider uppercase mb-6">
          <Layers className="w-3.5 h-3.5" />
          <span>Synchronized Dual-Viewport Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-sans tracking-tight uppercase leading-none mb-4">
          Predictive Crowd <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-red-500">
            Stress Simulation
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-10 font-sans leading-relaxed">
          Driven purely by an agent-based <b>Helbing Social Force Model</b> with real-time photoelastic stress bloom, synchronized at 300ms latency between the Desktop Simulation Console and Mobile Guard Telemetry Dashboard.
        </p>

        {/* Dual Portal Launcher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-left">
          {/* Card 1: Desktop Simulation Console */}
          <Link
            href="/simulator"
            className="glass-panel p-6 border border-white/10 hover:border-cyan-400 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,179,217,0.25)] group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                <Monitor className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold font-sans uppercase tracking-wider text-white mb-2 flex items-center justify-between">
                <span>Desktop Simulator</span>
                <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                High-complexity Canvas physics loop, 3D holographic perspective toggle, real-time kinetic sliders, and rolling Recharts telemetry.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-cyan-400 font-mono">
              <span>LAUNCH &rarr; /simulator</span>
              <span className="text-slate-500">60 FPS</span>
            </div>
          </Link>

          {/* Card 2: Mobile Guard Alert Dashboard */}
          <Link
            href="/mobile"
            className="glass-panel p-6 border border-white/10 hover:border-red-400 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,81,58,0.25)] group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold font-sans uppercase tracking-wider text-white mb-2 flex items-center justify-between">
                <span>Mobile Guard Unit</span>
                <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
              </h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Edge-to-edge security marshal dashboard with tri-state alert engine, deep red critical pulse, vibration haptics, and acoustic siren.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-red-400 font-mono">
              <span>LAUNCH &rarr; /mobile</span>
              <span className="text-slate-500">300ms Poll</span>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/10 text-center text-xs text-slate-500 font-mono">
        ForceSight &middot; Digital Photoelastic Crowd Dynamics Twin &middot; Next.js App Router
      </footer>
    </div>
  );
}
