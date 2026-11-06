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
  Shield,
  Target,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { TelemetryState, SectorMetric } from '../api/telemetry/route';

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
    selectedSector: 'B3',
    selectedSectorStress: 14.5,
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

  // Selected Box State (defaults to B3 or desktop twin's selectedSector)
  const [selectedSector, setSelectedSector] = useState<string>('B3');
  const [userSelectedOverride, setUserSelectedOverride] = useState<boolean>(false);
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

          // If mobile user hasn't locked an override, track desktop's selected sector
          if (!userSelectedOverride && data.selectedSector) {
            setSelectedSector(data.selectedSector);
          }
        }
      } catch (err) {
        // Silently tolerate transient network dropouts
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 300);
    return () => clearInterval(interval);
  }, [userSelectedOverride]);

  // Derive metrics strictly for the Selected Box Only
  const activeTile: SectorMetric | undefined = telemetry.sectorGrid?.find(
    (t) => t.sector === selectedSector
  );

  const selectedStress = activeTile
    ? +(Math.min(100, (activeTile.peakForce / 4800) * 100).toFixed(1))
    : (telemetry.selectedSector === selectedSector && telemetry.selectedSectorStress !== undefined
        ? +(telemetry.selectedSectorStress.toFixed(1))
        : +(telemetry.peakStress.toFixed(1)));

  const selectedPeakForce = activeTile ? activeTile.peakForce : telemetry.rawPeakForce;
  const selectedAgentCount = activeTile ? activeTile.agentCount : 0;
  const selectedPressureScore = activeTile ? activeTile.pressureScore : telemetry.hotspotPressure;

  // Selected Box Alert Classification
  const isSelectedCrit = selectedStress >= 85;
  const isSelectedWarn = selectedStress >= 60 && !isSelectedCrit;
  const isSelectedNormal = selectedStress < 60;

  // Global Venue Level
  const isGlobalCrit = telemetry.peakStress >= 85;
  const isGlobalWarn = telemetry.peakStress >= 60 && !isGlobalCrit;
  const isHotspotDifferent =
    Boolean(telemetry.hotspotSector) && telemetry.hotspotSector !== selectedSector;

  // Haptic feedback when the focused box (or global chokepoint) reaches critical overload
  useEffect(() => {
    if (isSelectedCrit || isGlobalCrit) {
      const now = Date.now();
      if (now - lastVibratedTime > 2000) {
        if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
          try {
            navigator.vibrate([500, 200, 500]);
          } catch (e) {
            // Browser policy tolerance
          }
        }
        setLastVibratedTime(now);
      }
    }
  }, [isSelectedCrit, isGlobalCrit, lastVibratedTime]);

  // Acoustic siren for alerts
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isSelectedCrit ? 920 : 540, ctx.currentTime);
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
    if ((isSelectedCrit || isSelectedWarn) && soundEnabled) {
      playAlertSound();
    }
  }, [isSelectedCrit, isSelectedWarn, soundEnabled]);

  const handleTileSelect = (sec: string) => {
    setSelectedSector(sec);
    setUserSelectedOverride(true);
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch (e) {
        // Haptic tap feedback
      }
    }
  };

  const handleDispatchAction = () => {
    setAcknowledgedSector(selectedSector);
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (e) {
        // Dispatch haptic feedback
      }
    }
  };

  return (
    <div
      className={`min-h-screen text-slate-100 flex flex-col justify-between font-mono transition-colors duration-500 select-none ${
        isSelectedCrit
          ? 'critical-pulse bg-red-950/85 text-white'
          : isSelectedWarn
          ? 'bg-[#181208] text-amber-100'
          : 'bg-[#06120D] text-emerald-100'
      }`}
    >
      {/* =========================================================================
          TOP MOBILE APP BAR
         ========================================================================= */}
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between backdrop-blur-md bg-black/60 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <Shield
            className={`w-5 h-5 ${
              isSelectedCrit
                ? 'text-red-400 animate-pulse'
                : isSelectedWarn
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-sans tracking-widest uppercase">
                ForceSight Guard
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-400/40">
                BOX {selectedSector}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>SYNC 300ms &middot; HOTSPOT: {telemetry.hotspotSector}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Siren Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 rounded-full border text-xs transition ${
              soundEnabled
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(79,179,217,0.4)]'
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

      {/* =========================================================================
          CROSS-VENUE HOTSPOT NOTIFICATION BANNER (When focused box differs from hotspot)
         ========================================================================= */}
      {isHotspotDifferent && (telemetry.peakStress >= 60 || telemetry.hotspotPressure >= 60) && (
        <div
          onClick={() => handleTileSelect(telemetry.hotspotSector)}
          className={`cursor-pointer px-4 py-2 border-b text-xs flex items-center justify-between gap-2 font-mono transition animate-pulse ${
            telemetry.peakStress >= 85
              ? 'bg-red-900/90 border-red-500 text-red-100 shadow-[0_0_15px_rgba(212,81,58,0.5)]'
              : 'bg-amber-900/80 border-amber-500 text-amber-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
            <span>
              VENUE HOTSPOT IN <b>BOX {telemetry.hotspotSector}</b> ({telemetry.peakStress} PSI)
            </span>
          </div>
          <span className="text-[10px] underline font-bold uppercase tracking-wider shrink-0">
            INSPECT &rarr;
          </span>
        </div>
      )}

      {/* =========================================================================
          MAIN CENTER ALERT STATE & SELECTED BOX METRICS
         ========================================================================= */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-4 text-center max-w-md mx-auto w-full">
        {/* State Icon Indicator */}
        <div className="mb-4 relative">
          {isSelectedNormal && (
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(62,158,107,0.3)]">
              <CheckCircle2 className="w-14 h-14" />
            </div>
          )}

          {isSelectedWarn && (
            <div className="w-24 h-24 rounded-full bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-[0_0_40px_rgba(217,163,60,0.45)] animate-bounce">
              <AlertTriangle className="w-14 h-14" />
            </div>
          )}

          {isSelectedCrit && (
            <div className="w-28 h-28 rounded-full bg-red-600/20 border-4 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_60px_rgba(212,81,58,0.85)] animate-pulse">
              <Flame className="w-16 h-16 text-red-500" />
            </div>
          )}
        </div>

        {/* State Engine Primary Text Readout */}
        <div className="mb-4">
          <h2
            className={`font-black font-sans uppercase tracking-tight text-2xl sm:text-3xl leading-tight ${
              isSelectedCrit
                ? 'text-red-400 beacon-pulse'
                : isSelectedWarn
                ? 'text-amber-300'
                : 'text-emerald-300'
            }`}
          >
            {isSelectedCrit
              ? `CRITICAL OVERLOAD: BOX ${selectedSector}`
              : isSelectedWarn
              ? `PRESSURE RISING: BOX ${selectedSector}`
              : `FLOW NORMAL: BOX ${selectedSector}`}
          </h2>

          <p className="text-[11px] text-slate-300/80 mt-1 font-mono max-w-xs mx-auto">
            {isSelectedCrit
              ? `Compressive crush risk in Box ${selectedSector}. Throttle ingress and dispatch immediate marshal assistance.`
              : isSelectedWarn
              ? `Localized crowd density building up in Box ${selectedSector}. Monitor boundary pressure.`
              : `Nominal inter-particle spacing in Box ${selectedSector}. Flow is clear and unobstructed.`}
          </p>
        </div>

        {/* =========================================================================
            MASSIVE PEAK STRESS INDEX GAUGE CARD (SELECTED BOX ONLY)
           ========================================================================= */}
        <div className="w-full glass-panel p-4 border border-white/10 rounded-xl mb-4 shadow-2xl bg-black/70 backdrop-blur-xl">
          {/* Card Header with Selected Box Only Badge */}
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-widest mb-1">
            <span className="flex items-center gap-1.5 font-bold text-slate-200">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>PEAK STRESS &middot; BOX {selectedSector}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/50 text-[9px] font-bold text-cyan-300 tracking-wider">
              SELECTED BOX ONLY
            </span>
          </div>

          {/* Huge Numeric Display */}
          <div className="flex items-baseline justify-center gap-1.5 my-2">
            <span
              className={`text-6xl sm:text-7xl font-black font-sans tracking-tight ${
                isSelectedCrit
                  ? 'text-red-500 drop-shadow-[0_0_20px_rgba(212,81,58,0.7)]'
                  : isSelectedWarn
                  ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(217,163,60,0.6)]'
                  : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(79,179,217,0.5)]'
              }`}
            >
              {selectedStress}
            </span>
            <span className="text-base text-slate-400 font-mono">/100.0</span>
          </div>

          {/* Progress Bar of Selected Box Stress */}
          <div className="w-full bg-black/80 h-2.5 rounded-full overflow-hidden border border-white/10 my-2.5">
            <div
              className={`h-full transition-all duration-300 ${
                isSelectedCrit
                  ? 'bg-red-500 shadow-[0_0_12px_#D4513A]'
                  : isSelectedWarn
                  ? 'bg-amber-400 shadow-[0_0_12px_#D9A33C]'
                  : 'bg-cyan-400 shadow-[0_0_12px_#4FB3D9]'
              }`}
              style={{ width: `${Math.min(100, selectedStress)}%` }}
            />
          </div>

          {/* Local Micro-Stats for Selected Box */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mt-3 pt-2.5 border-t border-white/10 text-slate-300">
            <div className="bg-black/40 p-1.5 rounded border border-white/5 flex flex-col items-center">
              <span className="text-[9px] text-slate-400 uppercase">Box Force</span>
              <span className="font-bold text-white text-xs mt-0.5">{selectedPeakForce} N</span>
            </div>
            <div className="bg-black/40 p-1.5 rounded border border-white/5 flex flex-col items-center">
              <span className="text-[9px] text-slate-400 uppercase">In Box</span>
              <span className="font-bold text-cyan-300 text-xs mt-0.5">{selectedAgentCount} pax</span>
            </div>
            <div className="bg-black/40 p-1.5 rounded border border-white/5 flex flex-col items-center">
              <span className="text-[9px] text-slate-400 uppercase">Crush Limit</span>
              <span className="font-bold text-red-400 text-xs mt-0.5">2550 N</span>
            </div>
          </div>

          {/* Gate Barrier Sensors P1 & P2 */}
          <div className="mt-2.5 pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-1 rounded bg-black/40 border border-white/5 flex justify-between items-center px-2">
              <span className="text-slate-400">P1 Wall (L):</span>
              <span className="font-bold text-cyan-300">
                {(telemetry.barrierP1 ?? 0.12).toFixed(2)} kN
              </span>
            </div>
            <div className="p-1 rounded bg-black/40 border border-white/5 flex justify-between items-center px-2">
              <span className="text-slate-400">P2 Wall (R):</span>
              <span className="font-bold text-cyan-300">
                {(telemetry.barrierP2 ?? 0.15).toFixed(2)} kN
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            INTERACTIVE 5x4 SECTOR MATRIX (TAP ANY BOX TO FOCUS)
           ========================================================================= */}
        {telemetry.sectorGrid && telemetry.sectorGrid.length > 0 && (
          <div className="w-full glass-panel p-3 border border-white/10 rounded-xl mb-4 bg-black/70 backdrop-blur-xl">
            {/* Matrix Header & Quick-Select Action Chips */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <Target className="w-3 h-3 text-cyan-400" />
                <span>Sector Pressure Matrix (5&times;4)</span>
              </span>
              <span className="text-slate-400 text-[9px]">Tap tile to isolate</span>
            </div>

            {/* Quick Action Selection Chips */}
            <div className="flex items-center justify-between gap-1.5 mb-2.5">
              <button
                onClick={() => handleTileSelect(telemetry.hotspotSector)}
                className={`flex-1 py-1 px-2 rounded border text-[9px] font-bold font-mono uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                  selectedSector === telemetry.hotspotSector
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(217,163,60,0.4)]'
                    : 'bg-black/50 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                <span>Hotspot ({telemetry.hotspotSector})</span>
              </button>

              <button
                onClick={() => handleTileSelect('B3')}
                className={`flex-1 py-1 px-2 rounded border text-[9px] font-bold font-mono uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                  selectedSector === 'B3'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(79,179,217,0.4)]'
                    : 'bg-black/50 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Zap className="w-2.5 h-2.5 text-cyan-400" />
                <span>Gate (B3)</span>
              </button>

              {userSelectedOverride && telemetry.selectedSector && (
                <button
                  onClick={() => {
                    setSelectedSector(telemetry.selectedSector!);
                    setUserSelectedOverride(false);
                  }}
                  className="py-1 px-2 rounded border border-cyan-500/40 bg-cyan-950/70 text-cyan-300 text-[9px] font-mono flex items-center gap-1 hover:bg-cyan-900/80"
                  title="Resync with desktop console"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Sync Desk ({telemetry.selectedSector})</span>
                </button>
              )}
            </div>

            {/* 5x4 Tap-to-Inspect Interactive Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {telemetry.sectorGrid.map((tile) => {
                const isSelected = tile.sector === selectedSector;
                const isHot = tile.sector === telemetry.hotspotSector;

                let tileBg = 'bg-black/50 border-white/10 text-slate-400';
                if (tile.status === 'CRITICAL') {
                  tileBg = 'bg-red-950/70 border-red-500/80 text-red-200';
                } else if (tile.status === 'WARNING') {
                  tileBg = 'bg-amber-950/70 border-amber-500/80 text-amber-200';
                }

                if (isSelected) {
                  tileBg = 'bg-cyan-950/90 border-cyan-400 text-cyan-100 ring-2 ring-cyan-400 shadow-[0_0_14px_rgba(56,189,248,0.5)] scale-105 z-10';
                }

                return (
                  <button
                    key={tile.sector}
                    onClick={() => handleTileSelect(tile.sector)}
                    type="button"
                    className={`relative p-1.5 rounded text-center border text-[9px] font-mono flex flex-col justify-center items-center transition-all active:scale-95 ${tileBg}`}
                  >
                    {/* Hotspot indicator pip */}
                    {isHot && !isSelected && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}

                    <span className="font-bold tracking-wider">{tile.sector}</span>
                    <span className="text-[8px] opacity-80 mt-0.5">{tile.pressureScore}%</span>

                    {isSelected && (
                      <span className="text-[7px] text-cyan-300 uppercase tracking-tighter mt-0.5 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            DYNAMIC MARSHAL DISPATCH ACTION (TARGETING SELECTED BOX)
           ========================================================================= */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={handleDispatchAction}
            className={`w-full py-3 rounded-lg font-bold font-sans tracking-wider uppercase text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
              acknowledgedSector === selectedSector
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : isSelectedCrit
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(212,81,58,0.7)] animate-pulse'
                : isSelectedWarn
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(79,179,217,0.4)]'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>
              {acknowledgedSector === selectedSector
                ? `DISPATCH ACKNOWLEDGED &rarr; BOX ${selectedSector}`
                : `DISPATCH MARSHALS &rarr; SECTOR ${selectedSector}`}
            </span>
          </button>

          {acknowledgedSector === selectedSector && (
            <div className="text-[10px] text-cyan-300 uppercase tracking-wider font-mono text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <span>Response team deployed to Sector {selectedSector}</span>
            </div>
          )}

          {isSelectedCrit && (
            <div className="text-[11px] text-red-300 uppercase tracking-wider font-bold animate-pulse text-center">
              Vibration haptic alert triggered on mobile hardware
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          BOTTOM TELEMETRY FOOTER STRIP
         ========================================================================= */}
      <footer className="px-4 py-2.5 border-t border-white/10 bg-black/60 backdrop-blur-md text-[11px] grid grid-cols-4 text-center text-slate-400 font-mono">
        <div>
          <div className="text-[8px] uppercase tracking-wider">Throughput</div>
          <div className="font-bold text-slate-200 mt-0.5">{telemetry.throughput}/min</div>
        </div>
        <div>
          <div className="text-[8px] uppercase tracking-wider">Total Crowd</div>
          <div className="font-bold text-slate-200 mt-0.5">{telemetry.activeAgents} pax</div>
        </div>
        <div>
          <div className="text-[8px] uppercase tracking-wider">Gate Gap</div>
          <div className="font-bold text-slate-200 mt-0.5">{(telemetry.gateWidth || 1.4).toFixed(1)} m</div>
        </div>
        <div>
          <div className="text-[8px] uppercase tracking-wider">Box Focus</div>
          <div className="font-bold text-cyan-300 mt-0.5">{selectedSector}</div>
        </div>
      </footer>
    </div>
  );
}
