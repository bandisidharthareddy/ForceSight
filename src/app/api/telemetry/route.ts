import { NextResponse } from 'next/server';

export interface TelemetryState {
  peakStress: number;               // 0 - 100 Normalized Peak Stress Index
  rawPeakForce: number;             // Maximum single-agent contact force in Newtons
  meanForce: number;                // Mean contact force across crowd in Newtons
  activeAgents: number;             // Current active crowd population
  throughput: number;               // Escaped agents per minute
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  alertMessage: string;
  hotspotSector: string;            // e.g. "C4"
  gateWidth: number;                // In meters
  spawnRate: number;                // Agents / sec
  kineticDrive: number;             // Multiplier (1.0x - 3.0x)
  opticalFlowDivergence: number;    // Micro-metric
  hysteresisDebounce: number;       // Micro-metric
  frameDensityMatrix: string;       // Micro-metric
  timestamp: number;
}

// In-memory telemetry storage holding live synchronized digital twin metrics
let currentTelemetry: TelemetryState = {
  peakStress: 14.5,
  rawPeakForce: 420,
  meanForce: 85,
  activeAgents: 64,
  throughput: 38,
  alertLevel: 'NORMAL',
  alertMessage: 'Flow is laminar. Bottleneck impedance nominal.',
  hotspotSector: 'C3',
  gateWidth: 1.4,
  spawnRate: 4.5,
  kineticDrive: 1.0,
  opticalFlowDivergence: 0.0142,
  hysteresisDebounce: 0.982,
  frameDensityMatrix: '64x64 [OK]',
  timestamp: Date.now(),
};

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(currentTelemetry, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<TelemetryState>;

    // Compute derived alert level if not explicitly provided
    const stress = typeof payload.peakStress === 'number' ? payload.peakStress : currentTelemetry.peakStress;
    let alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    let alertMessage = 'STATUS: FLOW NORMAL';

    if (stress >= 85) {
      alertLevel = 'CRITICAL';
      alertMessage = 'CRITICAL OVERLOAD: DIVERT CROWD';
    } else if (stress >= 60) {
      alertLevel = 'WARNING';
      alertMessage = 'WARNING: PRESSURE RISING';
    }

    currentTelemetry = {
      ...currentTelemetry,
      ...payload,
      peakStress: Math.min(100, Math.max(0, stress)),
      alertLevel: payload.alertLevel || alertLevel,
      alertMessage: payload.alertMessage || alertMessage,
      timestamp: Date.now(),
    };

    return NextResponse.json(
      { success: true, telemetry: currentTelemetry },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Malformed telemetry payload' },
      { status: 400 }
    );
  }
}
