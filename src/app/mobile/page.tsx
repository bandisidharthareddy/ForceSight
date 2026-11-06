'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  Users,
  Compass,
  ArrowUpRight,
  Shield,
  Target,
  Layers,
} from 'lucide-react';
import { TelemetryState } from '../api/telemetry/route';

export default function MobileGuardDashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    peakStress: 14.5,
    rawPeakForce: 420,
    meanForce: 85,
    activeAgents: 64,
    throughput: 38,
    alertLevel: 'NORMAL',
    alertMessage: 'STATUS: FLOW NORMAL',
    hotspotSector: 'B3',
    hotspotPressure: 18,
    gateWidth: 1.4,
    spawnRate: 4.5,
    kineticDrive: 1.0,
    opticalFlowDivergence: 0.0142,
    hysteresisDebounce: 0.982,
    frameDensityMatrix: '64x64 [OK]',
    barrierP1: 0.12,
    barrierP2: 0.15,
    sectorGrid: [],
    timestamp: Date.now(),
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [acknowledgedSector, setAcknowledgedSector] = useState<string | null>(null);
  const [lastVibratedTime, setLastVibratedTime] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Poll /api/telemetry every 300ms
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/telemetry', { cache: 'no-store' });
        if (res.ok) {
          const data: TelemetryState = await res.json();
          setTelemetry(data);
        }
      } catch (err) {
        // Silently tolerate transient network dropouts
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 300);
    return () => clearInterval(interval);
  }, []);

  // State Engine: Handle Vibrate & Audio Siren when Stress > 85
  const stress = telemetry.peakStress;
  const isCritical = stress >= 85;
  const isWarning = stress >= 60 && !isCritical;
  const isNormal = stress < 60;

  // Haptic feedback for Critical Overload
  useEffect(() => {
    if (isCritical) {
      const now = Date.now();
      // Rate-limit vibration to once every 2 seconds
      if (now - lastVibratedTime > 2000) {
        if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
          try {
            navigator.vibrate([500, 200, 500]);
          } catch (e) {
            // Ignore browsers blocking vibration without user interaction
          }
        }
        setLastVibratedTime(now);
      }
    }
  }, [isCritical, lastVibratedTime]);

  // Audio tone siren for Critical Alert
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isCritical ? 920 : 540, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy catch
    }
  };

  useEffect(() => {
    if ((isCritical || isWarning) && soundEnabled) {
      playAlertSound();
    }
  }, [isCritical, isWarning, soundEnabled]);

  return (
    <div
      className={`min-h-screen text-slate-100 flex flex-col justify-between font-mono transition-colors duration-500 select-none ${
        isCritical
          ? 'critical-pulse bg-red-950/80 text-white'
          : isWarning
          ? 'bg-[#181208] text-amber-100'
          : 'bg-[#06120D] text-emerald-100'
      }`}
    >
      {/* Top Mobile App Navigation Bar */}
      <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-md bg-black/40 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <Shield className={`w-5 h-5 ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`} />
          <div>
            <div className="text-xs font-bold font-sans tracking-widest uppercase">ForceSight Guard</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>LIVE TELEMETRY SYNC (300ms)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Siren Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 rounded-full border text-xs transition ${
              soundEnabled
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-black/50 border-white/10 text-slate-400'
            }`}
            title="Toggle Acoustic Siren"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Desktop Simulator Link */}
          <Link
            href="/simulator"
            className="p-2 rounded-full bg-black/50 border border-white/10 text-slate-300 hover:text-white"
            title="View Desktop Twin"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Center Alert State Banner */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-8 text-center max-w-md mx-auto w-full">
        {/* State Icon Indicator */}
        <div className="mb-6 relative">
          {isNormal && (
            <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(62,158,107,0.3)]">
              <CheckCircle2 className="w-16 h-16" />
            </div>
          )}

          {isWarning && (
            <div className="w-28 h-28 rounded-full bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-[0_0_45px_rgba(217,163,60,0.45)] animate-bounce">
              <AlertTriangle className="w-16 h-16" />
            </div>
          )}

          {isCritical && (
            <div className="w-32 h-32 rounded-full bg-red-600/20 border-4 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_60px_rgba(212,81,58,0.85)] animate-pulse">
              <Flame className="w-20 h-20 text-red-500" />
            </div>
          )}
        </div>

        {/* State Engine Primary Text Readout */}
        <div className="mb-6">
          <h2
            className={`font-black font-sans uppercase tracking-tight text-3xl sm:text-4xl leading-tight ${
              isCritical
                ? 'text-red-400 beacon-pulse'
                : isWarning
                ? 'text-amber-300'
                : 'text-emerald-300'
            }`}
          >
            {isCritical
              ? 'CRITICAL OVERLOAD: DIVERT CROWD'
              : isWarning
              ? 'WARNING: PRESSURE RISING'
              : 'STATUS: FLOW NORMAL'}
          </h2>

          <p className="text-xs text-slate-300/80 mt-2 font-mono max-w-xs mx-auto">
            {isCritical
              ? 'CRUSH THRESHOLD EXCEEDED AT CHOKEPOINT. HALT INGRESS & INITIATE LATERAL DIVERSION.'
              : isWarning
              ? 'Density accumulating rapidly. Prepare gate widening and throttle queue inflow.'
              : 'Flow is laminar. All gate corridors clear with nominal inter-particle spacing.'}
          </p>
        </div>

        {/* Massive Peak Stress Index Gauge Card */}
        <div className="w-full glass-panel p-5 border border-white/10 rounded-xl mb-6 shadow-2xl bg-black/60 backdrop-blur-xl">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-widest mb-1">
            <span>Peak Stress Index</span>
            <span className="font-bold text-slate-300">SECTOR {telemetry.hotspotSector}</span>
          </div>

          <div className="flex items-baseline justify-center gap-2 my-2">
            <span
              className={`text-7xl font-black font-sans tracking-tight ${
                isCritical
                  ? 'text-red-500'
                  : isWarning
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {telemetry.peakStress}
            </span>
            <span className="text-lg text-slate-400 font-mono">/100</span>
          </div>

          <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10 my-3">
            <div
              className={`h-full transition-all duration-300 ${
                isCritical
                  ? 'bg-red-500 shadow-[0_0_12px_#D4513A]'
                  : isWarning
                  ? 'bg-amber-400 shadow-[0_0_12px_#D9A33C]'
                  : 'bg-emerald-400 shadow-[0_0_12px_#3E9E6B]'
              }`}
              style={{ width: `${Math.min(100, telemetry.peakStress)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-300 font-mono">
            <span>Force: <b className="text-white">{telemetry.rawPeakForce} N</b></span>
            <span>Limit: <b className="text-red-400">2550 N</b></span>
          </div>

          {/* Barrier Load Sensors P1 & P2 */}
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-1.5 rounded bg-black/40 border border-white/5 flex justify-between items-center">
              <span className="text-slate-400">P1 Wall (L):</span>
              <span className="font-bold text-cyan-300">{(telemetry.barrierP1 ?? 0.12).toFixed(2)} kN</span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-white/5 flex justify-between items-center">
              <span className="text-slate-400">P2 Wall (R):</span>
              <span className="font-bold text-cyan-300">{(telemetry.barrierP2 ?? 0.15).toFixed(2)} kN</span>
            </div>
          </div>
        </div>

        {/* 5x4 Venue Sector Grid Mini-Heatmap */}
        {telemetry.sectorGrid && telemetry.sectorGrid.length > 0 && (
          <div className="w-full glass-panel p-3 border border-white/10 rounded-xl mb-5 bg-black/60 backdrop-blur-xl">
            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 text-cyan-400" />
                <span>Sector Pressure Matrix (A1...D5)</span>
              </span>
              <span className="text-amber-400 font-bold">HOTSPOT: {telemetry.hotspotSector}</span>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {telemetry.sectorGrid.map((tile) => {
                const isHot = tile.sector === telemetry.hotspotSector;
                const tileBg =
                  tile.status === 'CRITICAL'
                    ? 'bg-red-600/60 border-red-500 text-red-200'
                    : tile.status === 'WARNING'
                    ? 'bg-amber-600/50 border-amber-500 text-amber-200'
                    : 'bg-black/50 border-white/5 text-slate-400';

                return (
                  <div
                    key={tile.sector}
                    className={`p-1 rounded text-center border text-[9px] font-mono flex flex-col justify-center items-center ${tileBg} ${
                      isHot ? 'ring-2 ring-amber-400 shadow-[0_0_8px_rgba(217,163,60,0.6)] font-bold text-white' : ''
                    }`}
                  >
                    <span>{tile.sector}</span>
                    <span className="text-[8px] opacity-75">{tile.pressureScore}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Sector Dispatch Action */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => setAcknowledgedSector(telemetry.hotspotSector)}
            className={`w-full py-3.5 rounded-lg font-bold font-sans tracking-wider uppercase text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
              acknowledgedSector === telemetry.hotspotSector
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : isCritical
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(212,81,58,0.7)] animate-pulse'
                : isWarning
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>
              {acknowledgedSector === telemetry.hotspotSector
                ? `DISPATCH ACKNOWLEDGED → SECTOR ${telemetry.hotspotSector}`
                : `DISPATCH MARSHALS → SECTOR ${telemetry.hotspotSector}`}
            </span>
          </button>

          {isCritical && (
            <div className="text-[11px] text-red-300 uppercase tracking-wider font-bold animate-pulse text-center">
              Vibration haptic alert triggered on mobile hardware
            </div>
          )}
        </div>
      </main>

      {/* Bottom Telemetry Footer Strip */}
      <footer className="px-5 py-3 border-t border-white/10 bg-black/50 backdrop-blur-md text-[11px] grid grid-cols-3 text-center text-slate-400">
        <div>
          <div className="text-[9px] uppercase tracking-wider">Throughput</div>
          <div className="font-bold text-slate-200 mt-0.5">{telemetry.throughput}/min</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider">Active Crowd</div>
          <div className="font-bold text-slate-200 mt-0.5">{telemetry.activeAgents} pax</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider">Gate Gap</div>
          <div className="font-bold text-slate-200 mt-0.5">{(telemetry.gateWidth || 1.4).toFixed(1)} m</div>
        </div>
      </footer>
    </div>
  );
}
