import { NextResponse } from 'next/server';

export interface SectorMetric {
  sector: string;       // e.g. "A1", "B3"
  row: number;          // 0 to 3
  col: number;          // 0 to 4
  pressureScore: number;// 0 to 100
  agentCount: number;
  peakForce: number;    // In Newtons
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface TelemetryState {
  peakStress: number;               // 0 - 100 Normalized Peak Stress Index
  rawPeakForce: number;             // Maximum single-agent contact force in Newtons
  meanForce: number;                // Mean contact force across crowd in Newtons
  activeAgents: number;             // Current active crowd population
  throughput: number;               // Escaped agents per minute
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  alertMessage: string;
  hotspotSector: string;            // e.g. "B3"
  hotspotPressure: number;          // 0 to 100
  selectedSector?: string;          // User-selected box coordinate e.g. "C2"
  selectedSectorStress?: number;    // Localized peak stress of selected box
  gateWidth: number;                // In meters
  spawnRate: number;                // Agents / sec
  kineticDrive: number;             // Multiplier (1.0x - 3.0x)
  opticalFlowDivergence: number;    // Micro-metric
  hysteresisDebounce: number;       // Micro-metric
  frameDensityMatrix: string;       // Micro-metric
  barrierP1: number;                // kN on Left Gate Barrier
  barrierP2: number;                // kN on Right Gate Barrier
  venue?: string;                   // Indoor space replica id e.g. "concert"
  venueName?: string;               // Display name e.g. "Concert Arena & Stage Barricade"
  sectorGrid: SectorMetric[];       // 20 sectors (5x4 tile system)
  timestamp: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

// Default 5x4 Sector Grid
const SECTOR_ROWS = ['A', 'B', 'C', 'D'];
const initialSectorGrid: SectorMetric[] = [];
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 5; c++) {
    initialSectorGrid.push({
      sector: `${SECTOR_ROWS[r]}${c + 1}`,
      row: r,
      col: c,
      pressureScore: 12,
      agentCount: 3,
      peakForce: 150,
      status: 'NORMAL',
    });
  }
}

// In-memory telemetry storage holding live synchronized digital twin metrics
let currentTelemetry: TelemetryState = {
  peakStress: 18.5,
  rawPeakForce: 550,
  meanForce: 120,
  activeAgents: 55,
  throughput: 36,
  alertLevel: 'NORMAL',
  alertMessage: 'STATUS: FLOW NORMAL',
  hotspotSector: 'B3',
  hotspotPressure: 24,
  gateWidth: 1.4,
  spawnRate: 6.5,
  kineticDrive: 1.2,
  opticalFlowDivergence: 0.0142,
  hysteresisDebounce: 0.982,
  frameDensityMatrix: '64x64 [OK]',
  barrierP1: 0.42,
  barrierP2: 0.38,
  sectorGrid: initialSectorGrid,
  timestamp: Date.now(),
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  return NextResponse.json(currentTelemetry, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(request: Request) {
  try {
    let payload: Partial<TelemetryState> = {};
    const rawText = await request.text();
    if (rawText && rawText.trim().length > 0) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = {};
      }
    }

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
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: true, telemetry: currentTelemetry },
      {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
