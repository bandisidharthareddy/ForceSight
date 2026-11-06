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
  ArrowUpRight,
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
      className={`min-h-screen text-[#111111] flex flex-col justify-between font-mono transition-colors duration-500 select-none ${
        isSelectedCrit
          ? 'bg-[#FEF2F2] selection:bg-[#EF4444] selection:text-white'
          : isSelectedWarn
          ? 'bg-[#FEF3C7] selection:bg-[#F59E0B] selection:text-black'
          : 'bg-[#F5F2EB] selection:bg-[#111111] selection:text-[#F5F2EB]'
      }`}
    >
      {/* =========================================================================
          TOP MOBILE APP BAR (SWISS EDITORIAL THEME)
         ========================================================================= */}
      <header className="px-4 py-3 border-b border-black/10 flex items-center justify-between backdrop-blur-md bg-white/90 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              isSelectedCrit
                ? 'bg-red-500 text-white animate-pulse'
                : isSelectedWarn
                ? 'bg-amber-400 text-black'
                : 'bg-[#111111] text-[#38BDF8]'
            }`}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-display tracking-tight text-[#111111] uppercase">
                ForceSight Guard
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 text-[#111111] font-bold border border-black/10 font-mono">
                BOX {selectedSector}
              </span>
            </div>
            <div className="text-[10px] text-[#111111]/60 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
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
                ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm'
                : 'bg-white border-black/15 text-[#111111]/60 hover:text-black'
            }`}
            title="Toggle Acoustic Siren"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Desktop Simulator Link */}
          <Link
            href="/simulator"
            className="p-2 rounded-full bg-white border border-black/15 text-[#111111]/70 hover:text-black shadow-sm"
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
          className={`cursor-pointer px-4 py-2.5 border-b text-xs flex items-center justify-between gap-2 font-mono transition shadow-sm ${
            telemetry.peakStress >= 85
              ? 'bg-[#EF4444] text-white animate-pulse'
              : 'bg-[#F59E0B] text-black font-semibold'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              HOTSPOT DETECTED IN <b>BOX {telemetry.hotspotSector}</b> ({telemetry.peakStress} PSI)
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
        <div className="mb-3 relative">
          {isSelectedNormal && (
            <div className="w-20 h-20 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center text-emerald-700 shadow-sm">
              <CheckCircle2 className="w-11 h-11" />
            </div>
          )}

          {isSelectedWarn && (
            <div className="w-20 h-20 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center text-amber-800 shadow-md animate-bounce">
              <AlertTriangle className="w-11 h-11" />
            </div>
          )}

          {isSelectedCrit && (
            <div className="w-22 h-22 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-600 shadow-lg animate-pulse p-4">
              <Flame className="w-12 h-12 text-red-600" />
            </div>
          )}
        </div>

        {/* State Engine Primary Text Readout */}
        <div className="mb-4">
          <h2
            className={`font-black font-display uppercase tracking-tight text-2xl sm:text-3xl leading-tight ${
              isSelectedCrit
                ? 'text-red-600'
                : isSelectedWarn
                ? 'text-amber-800'
                : 'text-[#111111]'
            }`}
          >
            {isSelectedCrit
              ? `CRITICAL OVERLOAD: BOX ${selectedSector}`
              : isSelectedWarn
              ? `PRESSURE RISING: BOX ${selectedSector}`
              : `FLOW NORMAL: BOX ${selectedSector}`}
          </h2>

          <p className="text-[11px] text-[#111111]/70 mt-1 font-body max-w-xs mx-auto">
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
        <div className="w-full bg-white p-4 sm:p-5 border border-black/15 rounded-2xl mb-4 shadow-sm">
          {/* Card Header with Selected Box Only Badge */}
          <div className="flex justify-between items-center text-xs text-[#111111]/70 uppercase tracking-widest mb-1 font-mono">
            <span className="flex items-center gap-1.5 font-bold text-[#111111]">
              <Target className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>PEAK STRESS &middot; BOX {selectedSector}</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-black/5 border border-black/10 text-[9px] font-bold text-[#111111] tracking-wider">
              SELECTED BOX ONLY
            </span>
          </div>

          {/* Huge Numeric Display */}
          <div className="flex items-baseline justify-center gap-1.5 my-2">
            <span
              className={`text-6xl sm:text-7xl font-black font-display tracking-tight ${
                isSelectedCrit
                  ? 'text-[#EF4444]'
                  : isSelectedWarn
                  ? 'text-[#F59E0B]'
                  : 'text-[#111111]'
              }`}
            >
              {selectedStress}
            </span>
            <span className="text-base text-[#111111]/40 font-mono">/100.0</span>
          </div>

          {/* Progress Bar of Selected Box Stress */}
          <div className="w-full bg-black/5 h-2.5 rounded-full overflow-hidden border border-black/10 my-2.5">
            <div
              className={`h-full transition-all duration-300 ${
                isSelectedCrit
                  ? 'bg-[#EF4444]'
                  : isSelectedWarn
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#38BDF8]'
              }`}
              style={{ width: `${Math.min(100, selectedStress)}%` }}
            />
          </div>

          {/* Local Micro-Stats for Selected Box */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mt-3 pt-2.5 border-t border-black/10">
            <div className="bg-[#F5F2EB] p-2 rounded-lg border border-black/5 flex flex-col items-center">
              <span className="text-[9px] text-[#111111]/60 uppercase tracking-wider">Box Force</span>
              <span className="font-bold text-[#111111] text-xs mt-0.5">{selectedPeakForce} N</span>
            </div>
            <div className="bg-[#F5F2EB] p-2 rounded-lg border border-black/5 flex flex-col items-center">
              <span className="text-[9px] text-[#111111]/60 uppercase tracking-wider">In Box</span>
              <span className="font-bold text-[#38BDF8] text-xs mt-0.5">{selectedAgentCount} pax</span>
            </div>
            <div className="bg-[#F5F2EB] p-2 rounded-lg border border-black/5 flex flex-col items-center">
              <span className="text-[9px] text-[#111111]/60 uppercase tracking-wider">Rib Limit</span>
              <span className="font-bold text-[#EF4444] text-xs mt-0.5">2550 N</span>
            </div>
          </div>

          {/* Gate Barrier Sensors P1 & P2 */}
          <div className="mt-2.5 pt-2 border-t border-black/10 grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-1.5 rounded-lg bg-[#F5F2EB] border border-black/5 flex justify-between items-center px-2.5">
              <span className="text-[#111111]/60">P1 Wall (L):</span>
              <span className="font-bold text-[#111111]">
                {(telemetry.barrierP1 ?? 0.12).toFixed(2)} kN
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#F5F2EB] border border-black/5 flex justify-between items-center px-2.5">
              <span className="text-[#111111]/60">P2 Wall (R):</span>
              <span className="font-bold text-[#111111]">
                {(telemetry.barrierP2 ?? 0.15).toFixed(2)} kN
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            INTERACTIVE 5x4 SECTOR MATRIX (TAP ANY BOX TO FOCUS)
           ========================================================================= */}
        {telemetry.sectorGrid && telemetry.sectorGrid.length > 0 && (
          <div className="w-full bg-white p-3.5 border border-black/15 rounded-2xl mb-4 shadow-sm">
            {/* Matrix Header & Quick-Select Action Chips */}
            <div className="flex justify-between items-center text-[10px] text-[#111111]/70 uppercase tracking-wider mb-2 font-mono">
              <span className="flex items-center gap-1 font-bold text-[#111111]">
                <Target className="w-3 h-3 text-[#38BDF8]" />
                <span>Sector Pressure Matrix (5&times;4)</span>
              </span>
              <span className="text-[#111111]/50 text-[9px]">Tap tile to isolate</span>
            </div>

            {/* Quick Action Selection Chips */}
            <div className="flex items-center justify-between gap-1.5 mb-2.5">
              <button
                onClick={() => handleTileSelect(telemetry.hotspotSector)}
                className={`flex-1 py-1.5 px-2 rounded-full border text-[9px] font-bold font-mono uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                  selectedSector === telemetry.hotspotSector
                    ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm'
                    : 'bg-[#F5F2EB] border-black/10 text-[#111111] hover:border-black/30'
                }`}
              >
                <Flame className="w-2.5 h-2.5 text-amber-600" />
                <span>Hotspot ({telemetry.hotspotSector})</span>
              </button>

              <button
                onClick={() => handleTileSelect('B3')}
                className={`flex-1 py-1.5 px-2 rounded-full border text-[9px] font-bold font-mono uppercase tracking-wider transition flex items-center justify-center gap-1 ${
                  selectedSector === 'B3'
                    ? 'bg-cyan-50 border-[#38BDF8] text-cyan-900 shadow-sm'
                    : 'bg-[#F5F2EB] border-black/10 text-[#111111] hover:border-black/30'
                }`}
              >
                <Zap className="w-2.5 h-2.5 text-[#38BDF8]" />
                <span>Gate (B3)</span>
              </button>

              {userSelectedOverride && telemetry.selectedSector && (
                <button
                  onClick={() => {
                    setSelectedSector(telemetry.selectedSector!);
                    setUserSelectedOverride(false);
                  }}
                  className="py-1.5 px-2 rounded-full border border-black/15 bg-white text-[#111111] text-[9px] font-mono flex items-center gap-1 hover:bg-black hover:text-white transition"
                  title="Resync with desktop console"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Sync ({telemetry.selectedSector})</span>
                </button>
              )}
            </div>

            {/* 5x4 Tap-to-Inspect Interactive Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {telemetry.sectorGrid.map((tile) => {
                const isSelected = tile.sector === selectedSector;
                const isHot = tile.sector === telemetry.hotspotSector;

                let tileBg = 'bg-[#F5F2EB] border-black/10 text-[#111111]/70 hover:border-black/30';
                if (tile.status === 'CRITICAL') {
                  tileBg = 'bg-red-100 border-red-400 text-red-900 font-bold';
                } else if (tile.status === 'WARNING') {
                  tileBg = 'bg-amber-100 border-amber-400 text-amber-900 font-bold';
                }

                if (isSelected) {
                  tileBg = 'bg-cyan-50 border-[#38BDF8] text-cyan-950 font-bold ring-2 ring-[#38BDF8] shadow-sm scale-105 z-10';
                }

                return (
                  <button
                    key={tile.sector}
                    onClick={() => handleTileSelect(tile.sector)}
                    type="button"
                    className={`relative p-1.5 rounded-lg text-center border text-[9px] font-mono flex flex-col justify-center items-center transition-all active:scale-95 ${tileBg}`}
                  >
                    {/* Hotspot indicator pip */}
                    {isHot && !isSelected && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}

                    <span className="font-bold tracking-wider">{tile.sector}</span>
                    <span className="text-[8px] opacity-80 mt-0.5">{tile.pressureScore}%</span>

                    {isSelected && (
                      <span className="text-[7px] text-[#38BDF8] uppercase tracking-tighter mt-0.5 font-bold">
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
            className={`w-full py-3.5 rounded-xl font-bold font-display tracking-wider uppercase text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
              acknowledgedSector === selectedSector
                ? 'bg-emerald-600 text-white'
                : isSelectedCrit
                ? 'bg-[#EF4444] hover:bg-red-600 text-white animate-pulse shadow-lg'
                : isSelectedWarn
                ? 'bg-[#F59E0B] hover:bg-amber-500 text-black'
                : 'bg-[#111111] hover:bg-black text-[#F5F2EB]'
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
            <div className="text-[10px] text-emerald-800 uppercase tracking-wider font-mono text-center flex items-center justify-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Response team deployed to Sector {selectedSector}</span>
            </div>
          )}

          {isSelectedCrit && (
            <div className="text-[11px] text-red-600 uppercase tracking-wider font-bold animate-pulse text-center">
              Vibration haptic alert triggered on mobile hardware
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          BOTTOM TELEMETRY FOOTER STRIP
         ========================================================================= */}
      <footer className="px-4 py-2.5 border-t border-black/10 bg-white/80 backdrop-blur-md text-[11px] grid grid-cols-4 text-center text-[#111111]/70 font-mono">
        <div>
          <div className="text-[8px] uppercase tracking-wider text-[#111111]/50">Throughput</div>
          <div className="font-bold text-[#111111] mt-0.5">{telemetry.throughput}/min</div>
        </div>
        <div>
          <div className="text-[8px] uppercase tracking-wider text-[#111111]/50">Total Crowd</div>
          <div className="font-bold text-[#111111] mt-0.5">{telemetry.activeAgents} pax</div>
        </div>
        <div>
          <div className="text-[8px] uppercase tracking-wider text-[#111111]/50">Gate Gap</div>
          <div className="font-bold text-[#111111] mt-0.5">{(telemetry.gateWidth || 1.4).toFixed(1)} m</div>
        </div>
        <div>
          <div className="text-[8px] uppercase tracking-wider text-[#111111]/50">Box Focus</div>
          <div className="font-bold text-[#38BDF8] mt-0.5">{selectedSector}</div>
        </div>
      </footer>
    </div>
  );
}
