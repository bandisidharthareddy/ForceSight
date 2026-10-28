"""Ultra-realistic, high-performance HTML5 Canvas & WebGL interactive crowd simulator widget.

Features:
- REALISTIC INFLOW QUEUE & INGRESS: New people continuously pour into the venue through entry doors at an adjustable inflow rate.
- REAL EXITS & DISCHARGE FLOW: Particles exit smoothly through configurable exit gates and despawn once evacuated.
- TRUE PHYSICAL CROWD STAMPEDE DYNAMICS:
  - If inflow > exit discharge capacity, room fills up, density saturates, and pressure climbs.
  - When exits are throttled or locked, panic and aggressive shoving occur, creating high compressive forces and deadly wall crushing.
- INTERACTIVE OBSTACLES (PILLARS): Click anywhere to place or drag pillars to test whether they act as a boon (deflecting crush force) or a curse (jamming flow).
- ADJUSTABLE EXIT SIZE: Live slider to widen or narrow the gate bottleneck width.
- SECTOR GRID PINPOINTING: Real-time localization (e.g. Sector C4) tagging high-stress zones.
- AUDIO SIREN ALARM & GUARD DISPATCH: Dynamic siren alerting security marshals with tagged location.
"""

def get_simulator_html(initial_particles: int = 150, initial_fps: int = 60) -> str:
    """Generate standalone self-contained high-performance simulator HTML component."""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * {{
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                user-select: none;
            }}
            body {{
                background-color: transparent;
                font-family: 'Inter', -apple-system, sans-serif;
                color: #F8FAFC;
                overflow: hidden;
            }}
            .sim-wrapper {{
                display: flex;
                flex-direction: column;
                gap: 10px;
                background: radial-gradient(circle at 10% 10%, #0F172A 0%, #020617 100%);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 14px;
                padding: 14px 16px;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
            }}
            .top-bar {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }}
            .brand {{
                display: flex;
                align-items: center;
                gap: 10px;
            }}
            .brand-badge {{
                background: linear-gradient(135deg, #00E5FF, #3B82F6);
                width: 34px;
                height: 34px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: 0 0 16px rgba(0, 229, 255, 0.45);
            }}
            .brand-title {{
                font-size: 15px;
                font-weight: 800;
                letter-spacing: 0.5px;
                color: #FFFFFF;
            }}
            .brand-sub {{
                font-size: 11px;
                color: #94A3B8;
                font-family: 'JetBrains Mono', monospace;
            }}
            .top-actions {{
                display: flex;
                align-items: center;
                gap: 10px;
            }}
            .sound-toggle-btn {{
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #94A3B8;
                border-radius: 6px;
                padding: 5px 12px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
            }}
            .sound-toggle-btn.active {{
                background: rgba(0, 229, 255, 0.15);
                border-color: #00E5FF;
                color: #00E5FF;
                box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
            }}
            .status-pill {{
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 5px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 800;
                letter-spacing: 0.8px;
                transition: all 0.25s ease;
            }}
            .status-nominal {{
                background: rgba(16, 185, 129, 0.15);
                border: 1px solid #10B981;
                color: #6EE7B7;
                box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
            }}
            .status-warning {{
                background: rgba(245, 158, 11, 0.2);
                border: 1px solid #F59E0B;
                color: #FCD34D;
                box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);
            }}
            .status-critical {{
                background: rgba(239, 68, 68, 0.25);
                border: 1px solid #EF4444;
                color: #FCA5A5;
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
                animation: pulse-critical 1.2s infinite;
            }}
            @keyframes pulse-critical {{
                0% {{ box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }}
                50% {{ box-shadow: 0 0 25px rgba(239, 68, 68, 0.8); }}
                100% {{ box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }}
            }}
            .main-content {{
                display: grid;
                grid-template-columns: 1fr 330px;
                gap: 14px;
            }}
            @media (max-width: 1020px) {{
                .main-content {{
                    grid-template-columns: 1fr;
                }}
            }}
            .canvas-container {{
                position: relative;
                background-color: #030712;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;
                width: 100%;
                height: 540px;
                cursor: crosshair;
            }}
            canvas {{
                width: 100%;
                height: 100%;
                display: block;
            }}
            .hud-overlay {{
                position: absolute;
                top: 10px;
                left: 12px;
                pointer-events: none;
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.85);
                background: rgba(3, 7, 18, 0.7);
                padding: 6px 12px;
                border-radius: 6px;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }}
            .canvas-helper-tip {{
                position: absolute;
                bottom: 10px;
                left: 12px;
                pointer-events: none;
                font-size: 11px;
                color: rgba(148, 163, 184, 0.85);
                background: rgba(3, 7, 18, 0.65);
                padding: 5px 12px;
                border-radius: 4px;
                backdrop-filter: blur(6px);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }}
            .right-pane {{
                display: flex;
                flex-direction: column;
                gap: 10px;
            }}
            .card {{
                background: rgba(15, 23, 42, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 12px 14px;
                backdrop-filter: blur(12px);
            }}
            .card-title {{
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #94A3B8;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }}
            .gauge-wrap {{
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 4px 0;
            }}
            .psi-number {{
                font-family: 'JetBrains Mono', monospace;
                font-size: 44px;
                font-weight: 800;
                letter-spacing: -1px;
                line-height: 1;
                color: #00E5FF;
                text-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
                transition: color 0.2s ease;
            }}
            .psi-unit {{
                font-size: 11px;
                color: #94A3B8;
                letter-spacing: 1px;
                margin-top: 3px;
            }}
            .meter-bar-bg {{
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 4px;
                margin-top: 8px;
                overflow: hidden;
            }}
            .meter-bar-fill {{
                height: 100%;
                width: 18%;
                background: #00E5FF;
                border-radius: 4px;
                transition: width 0.15s ease, background 0.2s ease;
            }}
            .sector-tag {{
                font-family: 'JetBrains Mono', monospace;
                background: rgba(255, 255, 255, 0.12);
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 800;
                color: #F8FAFC;
            }}
            .alert-box {{
                border-radius: 8px;
                padding: 10px 12px;
                font-size: 12px;
                line-height: 1.4;
                transition: all 0.25s ease;
            }}
            .controls-panel {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-top: 4px;
            }}
            button.btn-action {{
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #FFFFFF;
                padding: 7px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }}
            button.btn-action:hover {{
                border-color: #00E5FF;
                color: #00E5FF;
                box-shadow: 0 0 12px rgba(0, 229, 255, 0.3);
                transform: translateY(-1px);
            }}
            button.btn-action.danger {{
                border-color: rgba(239, 68, 68, 0.4);
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(153, 27, 27, 0.4) 100%);
            }}
            button.btn-action.danger:hover {{
                border-color: #EF4444;
                color: #FCA5A5;
                box-shadow: 0 0 14px rgba(239, 68, 68, 0.45);
            }}
            .slider-row {{
                display: flex;
                flex-direction: column;
                gap: 3px;
                margin-top: 6px;
            }}
            .slider-label {{
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #94A3B8;
            }}
            input[type="range"] {{
                width: 100%;
                accent-color: #00E5FF;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                height: 5px;
                cursor: pointer;
            }}
            .mini-chart-canvas {{
                width: 100%;
                height: 50px;
                display: block;
            }}
            .guard-dispatch-card {{
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(239, 68, 68, 0.15);
                border: 1px dashed rgba(239, 68, 68, 0.5);
                border-radius: 6px;
                padding: 6px 10px;
                margin-top: 6px;
                font-size: 11px;
            }}
        </style>
    </head>
    <body>
        <div class="sim-wrapper">
            <div class="top-bar">
                <div class="brand">
                    <div class="brand-badge">⚡</div>
                    <div>
                        <div class="brand-title">ForceSight — Venue Crowd Surge & Evacuation Simulator</div>
                        <div class="brand-sub">Physical Continuous Inflow ➔ Stampede Chokepoint ➔ Exit Clearance</div>
                    </div>
                </div>
                <div class="top-actions">
                    <button id="btnSoundToggle" class="sound-toggle-btn active">
                        <span id="soundIcon">🔊</span> Audio Siren: ON
                    </button>
                    <div id="statusPill" class="status-pill status-nominal">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: currentColor;"></span>
                        <span id="statusLabel">NOMINAL FLOW</span>
                    </div>
                </div>
            </div>

            <div class="main-content">
                <div class="canvas-container" id="canvasBox">
                    <canvas id="simCanvas"></canvas>
                    <div class="hud-overlay" id="hud">
                        <span>FPS: <strong id="fpsVal">60</strong></span>
                        <span>VENUE OCCUPANCY: <strong id="agentCountVal" style="color: #00E5FF;">150</strong></span>
                        <span>EVACUATED: <strong id="evacCountVal" style="color: #10B981;">0</strong></span>
                        <span>EXIT GATE: <strong id="gateStateText" style="color: #00E5FF;">OPEN (110px)</strong></span>
                        <span>PEAK SECTOR: <strong id="peakSectorHud" style="color: #FCD34D;">C4</strong></span>
                    </div>
                    <div class="canvas-helper-tip">
                        💡 <strong>Interactive Arena</strong>: Click anywhere to drop deflecting <strong>Pillars</strong> (boon or barrier). Click a pillar to remove it. Watch people enter on left and exit on right!
                    </div>
                </div>

                <div class="right-pane">
                    <!-- Gauge & Sector Card -->
                    <div class="card">
                        <div class="card-title">
                            <span>PEAK STRESS INDEX</span>
                            <span class="sector-tag" id="sectorTag">SECTOR C4</span>
                        </div>
                        <div class="gauge-wrap">
                            <div class="psi-number" id="psiVal">18.4</div>
                            <div class="psi-unit">PSI (0 — 100)</div>
                            <div class="meter-bar-bg">
                                <div class="meter-bar-fill" id="meterFill"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Mini Momentum Chart -->
                    <div class="card">
                        <div class="card-title">MOMENTUM TIMELINE (dPSI/dt)</div>
                        <canvas id="momentumCanvas" class="mini-chart-canvas"></canvas>
                    </div>

                    <!-- Action Guidance & Guard Dispatch Alert -->
                    <div class="alert-box status-nominal" id="actionBanner">
                        <strong id="actionTitle">✅ NORMAL FLOW</strong><br>
                        <span id="actionDesc" style="font-size: 11px; opacity: 0.9;">Inflow matches discharge capacity. Ingress & exit flowing safely.</span>
                        <div id="dispatchBox" class="guard-dispatch-card" style="display: none;">
                            <span id="dispatchText">🚨 DISPATCH TO SECTOR C4</span>
                            <button id="btnAcknowledge" style="padding: 2px 8px; font-size: 10px; border-radius: 4px; background: #EF4444; color: white; border: none; cursor: pointer;">ACK</button>
                        </div>
                    </div>

                    <!-- Obstacles & Gate Control Panel -->
                    <div class="card">
                        <div class="card-title">PHYSICS & EXIT CONTROLS</div>
                        <div class="controls-panel">
                            <button id="btnToggleGate" class="btn-action">🚪 Lock Exit Gate</button>
                            <button id="btnSurge" class="btn-action danger">⚡ Trigger Inrush Stampede</button>
                            <button id="btnAddPillars" class="btn-action">🏛️ Add Deflection Columns</button>
                            <button id="btnClearPillars" class="btn-action">🧹 Clear Pillars</button>
                        </div>

                        <!-- Inflow Rate Slider -->
                        <div class="slider-row">
                            <div class="slider-label">
                                <span>Entry Inflow Rate (Arrivals/sec)</span>
                                <span id="inflowLabel">4 people/s</span>
                            </div>
                            <input type="range" id="inflowSlider" min="0" max="15" step="1" value="4">
                        </div>

                        <!-- Exit Bottleneck Size Slider -->
                        <div class="slider-row">
                            <div class="slider-label">
                                <span>Exit Bottleneck Width</span>
                                <span id="gateWidthLabel">110 px (Normal)</span>
                            </div>
                            <input type="range" id="gateWidthSlider" min="20" max="220" step="10" value="110">
                        </div>

                        <!-- Panic Push Velocity -->
                        <div class="slider-row">
                            <div class="slider-label">
                                <span>Crowd Panic Push Force</span>
                                <span id="speedLabel">1.2x (Normal)</span>
                            </div>
                            <input type="range" id="speedSlider" min="0.6" max="2.8" step="0.1" value="1.2">
                        </div>

                        <!-- Wall Crushing Friction -->
                        <div class="slider-row">
                            <div class="slider-label">
                                <span>Wall Crushing Friction Resistance</span>
                                <span id="frictionLabel">1.6x</span>
                            </div>
                            <input type="range" id="frictionSlider" min="0.5" max="3.0" step="0.1" value="1.6">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Audio Siren Synthesizer via Web Audio API
            let audioCtx = null;
            let sirenOsc = null;
            let sirenGain = null;
            let soundEnabled = true;
            let isSirenPlaying = false;

            function initAudio() {{
                if (!audioCtx) {{
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (AudioContext) audioCtx = new AudioContext();
                }}
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            }}

            function startSiren(isCritical) {{
                if (!soundEnabled) return;
                initAudio();
                if (!audioCtx) return;

                if (!isSirenPlaying) {{
                    sirenOsc = audioCtx.createOscillator();
                    sirenGain = audioCtx.createGain();
                    sirenOsc.type = 'sawtooth';
                    sirenGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                    sirenOsc.connect(sirenGain);
                    sirenGain.connect(audioCtx.destination);
                    sirenOsc.start();
                    isSirenPlaying = true;
                }}

                if (sirenOsc && audioCtx) {{
                    const now = audioCtx.currentTime;
                    const freq1 = isCritical ? 880 : 540;
                    const freq2 = isCritical ? 620 : 420;
                    const period = isCritical ? 0.35 : 0.7;

                    sirenOsc.frequency.cancelScheduledValues(now);
                    sirenOsc.frequency.setValueAtTime(freq1, now);
                    sirenOsc.frequency.linearRampToValueAtTime(freq2, now + period * 0.5);
                    sirenOsc.frequency.linearRampToValueAtTime(freq1, now + period);
                }}
            }}

            function stopSiren() {{
                if (isSirenPlaying && sirenOsc) {{
                    try {{
                        sirenOsc.stop();
                        sirenOsc.disconnect();
                    }} catch (e) {{}}
                    isSirenPlaying = false;
                    sirenOsc = null;
                }}
            }}

            // Sound Toggle UI
            const btnSound = document.getElementById('btnSoundToggle');
            btnSound.onclick = () => {{
                initAudio();
                soundEnabled = !soundEnabled;
                if (soundEnabled) {{
                    btnSound.className = 'sound-toggle-btn active';
                    btnSound.innerHTML = '<span>🔊</span> Audio Siren: ON';
                }} else {{
                    btnSound.className = 'sound-toggle-btn';
                    btnSound.innerHTML = '<span>🔇</span> Audio Siren: MUTED';
                    stopSiren();
                }}
            }};

            // Canvas Setup
            const canvas = document.getElementById('simCanvas');
            const ctx = canvas.getContext('2d');
            const mCanvas = document.getElementById('momentumCanvas');
            const mCtx = mCanvas.getContext('2d');

            function resizeCanvases() {{
                const box = document.getElementById('canvasBox');
                canvas.width = box.clientWidth;
                canvas.height = box.clientHeight;
                mCanvas.width = mCanvas.parentElement.clientWidth - 28;
                mCanvas.height = 50;
            }}
            window.addEventListener('resize', resizeCanvases);
            resizeCanvases();

            // Simulation Config & Variables
            let isRunning = true;
            let gateLocked = false;
            let exitGateWidth = 110;
            let inflowRatePerSec = 4; // Arrivals per second
            let speedMult = 1.2;
            let wallFriction = 1.6;
            let smoothedPsi = 18.0;
            let lastTime = performance.now();
            let frameCount = 0;
            let fps = 60;
            let totalEvacuated = 0;
            let spawnAccumulator = 0;
            const historyPsi = [];

            // Sectors Configuration: 4 Rows (A, B, C, D) x 5 Columns (1, 2, 3, 4, 5)
            const sectorRows = ['A', 'B', 'C', 'D'];
            const sectorCols = [1, 2, 3, 4, 5];

            // Obstacles / Pillars (Circular deflecting columns)
            let obstacles = [
                {{ x: 0, y: 0, r: 24 }} // Initial deflecting column
            ];

            function repositionInitialObstacles() {{
                obstacles[0].x = canvas.width * 0.58;
                obstacles[0].y = canvas.height * 0.50;
            }}
            repositionInitialObstacles();

            // Click to Place / Remove Obstacles
            canvas.addEventListener('click', (e) => {{
                initAudio();
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const clickX = (e.clientX - rect.left) * scaleX;
                const clickY = (e.clientY - rect.top) * scaleY;

                // Check if clicking existing obstacle to delete
                let removed = false;
                for (let i = 0; i < obstacles.length; i++) {{
                    if (Math.hypot(clickX - obstacles[i].x, clickY - obstacles[i].y) < obstacles[i].r + 10) {{
                        obstacles.splice(i, 1);
                        removed = true;
                        break;
                    }}
                }}
                if (!removed) {{
                    // Place new pillar
                    obstacles.push({{ x: clickX, y: clickY, r: 22 }});
                }}
            }});

            // Particle Class: Spawn at Entry Doors on Left, Escape at Exit on Right
            class Person {{
                constructor(w, h, startRandom = false) {{
                    const wallUpperY = h * 0.12;
                    const wallLowerY = h * 0.88;
                    const gateX = w * 0.78;

                    if (startRandom) {{
                        // Pre-populate chamber
                        this.x = Math.random() * (gateX * 0.8) + 30;
                        this.y = wallUpperY + 15 + Math.random() * (wallLowerY - wallUpperY - 30);
                    }} else {{
                        // Spawn at entry doors on left
                        this.x = -15 - Math.random() * 40;
                        this.y = wallUpperY + 20 + Math.random() * (wallLowerY - wallUpperY - 40);
                    }}

                    this.baseSpeed = 2.0 + Math.random() * 1.5;
                    this.vx = this.baseSpeed;
                    this.vy = 0;
                    this.radius = 7.5 + Math.random() * 3.0;
                    this.evacuated = false;
                }}
            }}

            let people = [];
            function initPeople() {{
                people = [];
                for (let i = 0; i < {initial_particles}; i++) {{
                    people.push(new Person(canvas.width, canvas.height, true));
                }}
            }}
            initPeople();

            // Photoelastic Birefringence Color Table (Michel-Levy Orders)
            function getPhotoelasticColor(s, alpha = 0.6) {{
                let r, g, b;
                if (s < 0.25) {{
                    const t = s / 0.25;
                    r = 15 + t * 10;
                    g = 45 + t * 115;
                    b = 100 + t * 140;
                }} else if (s < 0.50) {{
                    const t = (s - 0.25) / 0.25;
                    r = 25 + t * 220;
                    g = 160 + t * 55;
                    b = 240 - t * 200;
                }} else if (s < 0.75) {{
                    const t = (s - 0.50) / 0.25;
                    r = 245 - t * 10;
                    g = 215 - t * 185;
                    b = 40 + t * 15;
                }} else {{
                    const t = (s - 0.75) / 0.25;
                    r = 235 + t * 20;
                    g = 30 - t * 20;
                    b = 55 + t * 130;
                }}
                return `rgba(${{Math.round(r)}}, ${{Math.round(g)}}, ${{Math.round(b)}}, ${{alpha}})`;
            }}

            // Button Click Handlers
            document.getElementById('btnToggleGate').onclick = () => {{
                initAudio();
                gateLocked = !gateLocked;
                document.getElementById('btnToggleGate').innerText = gateLocked ? '🚪 Unlock Exit Gate' : '🚪 Lock Exit Gate';
                document.getElementById('gateStateText').innerText = gateLocked ? 'LOCKED (0px)' : `OPEN (${{exitGateWidth}}px)`;
                document.getElementById('gateStateText').style.color = gateLocked ? '#FF3366' : '#00E5FF';
            }};

            document.getElementById('btnSurge').onclick = () => {{
                initAudio();
                inflowRatePerSec = 14;
                speedMult = 2.4;
                gateLocked = false;
                exitGateWidth = 50; // Narrow bottleneck
                document.getElementById('inflowSlider').value = 14;
                document.getElementById('inflowLabel').innerText = '14 people/s (STAMPEDE INFLOW)';
                document.getElementById('speedSlider').value = 2.4;
                document.getElementById('speedLabel').innerText = '2.4x (HIGH PANIC)';
                document.getElementById('gateWidthSlider').value = 50;
                document.getElementById('gateWidthLabel').innerText = '50 px (NARROW CHOKEPOINT)';
                document.getElementById('gateStateText').innerText = 'CHOKEPOINT JAM (50px)';
                document.getElementById('gateStateText').style.color = '#FFB300';
            }};

            document.getElementById('btnAddPillars').onclick = () => {{
                initAudio();
                const w = canvas.width;
                const h = canvas.height;
                obstacles = [
                    {{ x: w * 0.40, y: h * 0.35, r: 24 }},
                    {{ x: w * 0.40, y: h * 0.65, r: 24 }},
                    {{ x: w * 0.65, y: h * 0.50, r: 26 }}
                ];
            }};

            document.getElementById('btnClearPillars').onclick = () => {{
                initAudio();
                obstacles = [];
            }};

            // Slider Listeners
            document.getElementById('inflowSlider').oninput = (e) => {{
                inflowRatePerSec = parseInt(e.target.value);
                document.getElementById('inflowLabel').innerText = `${{inflowRatePerSec}} people/s`;
            }};

            document.getElementById('gateWidthSlider').oninput = (e) => {{
                exitGateWidth = parseInt(e.target.value);
                document.getElementById('gateWidthLabel').innerText = `${{exitGateWidth}} px`;
                if (!gateLocked) {{
                    document.getElementById('gateStateText').innerText = `OPEN (${{exitGateWidth}}px)`;
                }}
            }};

            document.getElementById('speedSlider').oninput = (e) => {{
                speedMult = parseFloat(e.target.value);
                document.getElementById('speedLabel').innerText = `${{speedMult.toFixed(1)}}x`;
            }};

            document.getElementById('frictionSlider').oninput = (e) => {{
                wallFriction = parseFloat(e.target.value);
                document.getElementById('frictionLabel').innerText = `${{wallFriction.toFixed(1)}}x`;
            }};

            document.getElementById('btnAcknowledge').onclick = () => {{
                stopSiren();
            }};

            // Main Simulation Loop
            function updateAndRender() {{
                const now = performance.now();
                frameCount++;
                if (now - lastTime >= 1000) {{
                    fps = frameCount;
                    frameCount = 0;
                    lastTime = now;
                    document.getElementById('fpsVal').innerText = fps;
                }}

                if (isRunning) {{
                    const w = canvas.width;
                    const h = canvas.height;
                    const gateX = w * 0.78;
                    const gateY = h * 0.50;
                    const effectiveGateWidth = gateLocked ? 0 : exitGateWidth;
                    const wallUpperY = h * 0.12;
                    const wallLowerY = h * 0.88;

                    // 1. Continuous Inflow Spawn Generator
                    // Spawns new people at the left entry based on inflowRatePerSec
                    spawnAccumulator += (inflowRatePerSec / 60.0);
                    while (spawnAccumulator >= 1.0) {{
                        spawnAccumulator -= 1.0;
                        if (people.length < 450) {{
                            people.push(new Person(w, h, false));
                        }}
                    }}

                    // Grid Accumulator
                    const blockSize = 24;
                    const cols = Math.ceil(w / blockSize);
                    const rows = Math.ceil(h / blockSize);
                    const gridCount = new Float32Array(cols * rows);
                    const gridVx = new Float32Array(cols * rows);
                    const gridVy = new Float32Array(cols * rows);
                    const gridWallPressure = new Float32Array(cols * rows);

                    // 2. Advance Each Person through Physical Room
                    for (let i = people.length - 1; i >= 0; i--) {{
                        const p = people[i];

                        // Target Navigation:
                        // Move towards exit gate opening (gateX, gateY)
                        let targetX = gateX;
                        let targetY = gateY;

                        // Once safely past the exit gate, keep moving right to clear out!
                        if (p.x > gateX) {{
                            targetX = w + 80;
                            targetY = p.y;
                        }}

                        const dx = targetX - p.x;
                        const dy = targetY - p.y;
                        const dist = Math.hypot(dx, dy) + 0.1;
                        const desiredVx = (dx / dist) * p.baseSpeed * speedMult;
                        const desiredVy = (dy / dist) * p.baseSpeed * speedMult;

                        p.vx += 0.22 * (desiredVx - p.vx);
                        p.vy += 0.22 * (desiredVy - p.vy);

                        // Hard Contact with Deflection Columns / Obstacles
                        for (let o = 0; o < obstacles.length; o++) {{
                            const obst = obstacles[o];
                            const odx = p.x - obst.x;
                            const ody = p.y - obst.y;
                            const oDist = Math.hypot(odx, ody);
                            const minDist = p.radius + obst.r;

                            if (oDist < minDist && oDist > 0.01) {{
                                const nx = odx / oDist;
                                const ny = ody / oDist;
                                const overlap = minDist - oDist;

                                p.x += nx * overlap;
                                p.y += ny * overlap;

                                const dot = p.vx * nx + p.vy * ny;
                                if (dot < 0) {{
                                    p.vx -= 1.4 * dot * nx;
                                    p.vy -= 1.4 * dot * ny;
                                }}
                            }}
                        }}

                        // Wall Collision (Top and Bottom Corridor Boundaries)
                        if (p.y - p.radius < wallUpperY) {{
                            p.y = wallUpperY + p.radius;
                            const pressurePush = Math.abs(p.vy) + 1.2 * wallFriction;
                            p.vy = Math.abs(p.vy) * 0.25;
                            p.vx *= Math.max(0.2, 1.0 - 0.25 * wallFriction);

                            const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                            const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                            gridWallPressure[gy * cols + gx] += pressurePush;
                        }} else if (p.y + p.radius > wallLowerY) {{
                            p.y = wallLowerY - p.radius;
                            const pressurePush = Math.abs(p.vy) + 1.2 * wallFriction;
                            p.vy = -Math.abs(p.vy) * 0.25;
                            p.vx *= Math.max(0.2, 1.0 - 0.25 * wallFriction);

                            const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                            const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                            gridWallPressure[gy * cols + gx] += pressurePush;
                        }}

                        // Exit Barrier Wall Hard Collision
                        // Solid wall everywhere EXCEPT inside the exit gate slot!
                        const isAtGateLine = p.x + p.radius >= gateX && p.x - p.radius <= gateX + 16;
                        const isOutsideGateOpening = Math.abs(p.y - gateY) > (effectiveGateWidth * 0.5 - 2);

                        if (isAtGateLine && isOutsideGateOpening) {{
                            p.x = gateX - p.radius;
                            const contactPressure = Math.abs(p.vx) * 2.8 * wallFriction;
                            p.vx = -Math.abs(p.vx) * 0.1;
                            // High lateral shear & turbulent crush sliding
                            p.vy += (Math.random() - 0.5) * (7.0 * speedMult);

                            const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                            const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                            gridWallPressure[gy * cols + gx] += contactPressure;
                        }}

                        // Compression Funnel (Particles piling up behind exit chokepoint)
                        if (p.x >= gateX - 220 && p.x <= gateX && isOutsideGateOpening) {{
                            p.vx *= 0.35;
                            p.vy += (Math.random() - 0.5) * (6.5 * speedMult);
                        }}

                        // Integrate Position
                        p.x += p.vx;
                        p.y += p.vy;

                        // Exit Clearance: When person reaches the far right, they have successfully evacuated!
                        if (p.x > w + 20) {{
                            people.splice(i, 1);
                            totalEvacuated++;
                            continue;
                        }}

                        // Bin into Grid
                        const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                        const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                        const gIdx = gy * cols + gx;
                        gridCount[gIdx]++;
                        gridVx[gIdx] += p.vx;
                        gridVy[gIdx] += p.vy;
                    }}

                    // Update Evacuated & Occupancy HUD
                    document.getElementById('agentCountVal').innerText = people.length;
                    document.getElementById('evacCountVal').innerText = totalEvacuated;

                    // 3. Evaluate Photoelastic Stress Field & Pinpoint Sector
                    let maxStress = 0;
                    let hotspotX = gateX - 40;
                    let hotspotY = gateY;

                    const stressField = new Float32Array(cols * rows);
                    for (let gy = 0; gy < rows; gy++) {{
                        for (let gx = 0; gx < cols; gx++) {{
                            const idx = gy * cols + gx;
                            const count = gridCount[idx];
                            if (count > 0 || gridWallPressure[idx] > 0) {{
                                const meanVx = count > 0 ? gridVx[idx] / count : 0;
                                const meanVy = count > 0 ? gridVy[idx] / count : 0;
                                const rho = Math.min(1.0, count / 5.5);

                                // Velocity variance in cell
                                let variance = 0;
                                for (let i = 0; i < people.length; i++) {{
                                    const px = Math.floor(people[i].x / blockSize);
                                    const py = Math.floor(people[i].y / blockSize);
                                    if (px === gx && py === gy) {{
                                        variance += Math.pow(people[i].vx - meanVx, 2) + Math.pow(people[i].vy - meanVy, 2);
                                    }}
                                }}
                                const varNorm = count > 0 ? Math.min(1.0, (variance / count) / 10.0) : 0;
                                const coupled = rho * varNorm;

                                const wallCrush = Math.min(1.0, gridWallPressure[idx] / 6.0);
                                const isNearExit = Math.abs(gx * blockSize - gateX) < 140;
                                const stag = isNearExit && (effectiveGateWidth < 60) ? 0.40 : 0.05;

                                const s = Math.min(100, (rho * 28 + varNorm * 22 + coupled * 30 + stag * 20 + wallCrush * 35) * 1.05);
                                stressField[idx] = s;
                                if (s > maxStress) {{
                                    maxStress = s;
                                    hotspotX = (gx + 0.5) * blockSize;
                                    hotspotY = (gy + 0.5) * blockSize;
                                }}
                            }}
                        }}
                    }}

                    // Asymmetric EMA smoothing
                    const alpha = maxStress > smoothedPsi ? 0.35 : 0.08;
                    smoothedPsi = alpha * maxStress + (1 - alpha) * smoothedPsi;

                    historyPsi.push(smoothedPsi);
                    if (historyPsi.length > 80) historyPsi.shift();

                    // Sector Coordinate Math (Rows A-D, Cols 1-5)
                    const sectorColIdx = Math.min(4, Math.max(0, Math.floor((hotspotX / w) * 5)));
                    const sectorRowIdx = Math.min(3, Math.max(0, Math.floor(((hotspotY - wallUpperY) / (wallLowerY - wallUpperY)) * 4)));
                    const peakSectorName = `${{sectorRows[sectorRowIdx]}}${{sectorCols[sectorColIdx]}}`;

                    // Update UI Telemetry & Audio Siren
                    updateTelemetry(smoothedPsi, peakSectorName);

                    // 4. Render Polariscope Darkfield & Interference Fringes
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#060B18';
                    ctx.fillRect(0, 0, w, h);

                    // Draw Sector Grid Overlay
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.lineWidth = 1;
                    const secW = w / 5;
                    const secH = (wallLowerY - wallUpperY) / 4;

                    for (let c = 1; c < 5; c++) {{
                        ctx.beginPath();
                        ctx.moveTo(c * secW, wallUpperY);
                        ctx.lineTo(c * secW, wallLowerY);
                        ctx.stroke();
                    }}
                    for (let r = 1; r < 4; r++) {{
                        ctx.beginPath();
                        ctx.moveTo(0, wallUpperY + r * secH);
                        ctx.lineTo(w, wallUpperY + r * secH);
                        ctx.stroke();
                    }}

                    // Sector Coordinate Labels (A1, A2...)
                    ctx.font = '10px JetBrains Mono';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    for (let r = 0; r < 4; r++) {{
                        for (let c = 0; c < 5; c++) {{
                            const label = `${{sectorRows[r]}}${{sectorCols[c]}}`;
                            ctx.fillText(label, c * secW + 8, wallUpperY + r * secH + 16);
                        }}
                    }}

                    // Entry & Exit Portal Labels
                    ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
                    ctx.font = '11px JetBrains Mono';
                    ctx.fillText('➔ INGRESS (ENTRY)', 15, wallUpperY - 8);
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
                    ctx.fillText('EVACUATION EXIT ➔', gateX - 40, wallUpperY - 8);

                    // Continuous Photoelastic Stress Fringes
                    for (let gy = 0; gy < rows; gy++) {{
                        for (let gx = 0; gx < cols; gx++) {{
                            const s = stressField[gy * cols + gx];
                            if (s > 4) {{
                                const normS = s / 100.0;
                                const rad = blockSize * 1.6;
                                const px = (gx + 0.5) * blockSize;
                                const py = (gy + 0.5) * blockSize;

                                const grad = ctx.createRadialGradient(px, py, 2, px, py, rad);
                                grad.addColorStop(0, getPhotoelasticColor(normS, Math.min(0.88, 0.22 + normS * 0.75)));
                                grad.addColorStop(1, 'rgba(6, 11, 24, 0)');

                                ctx.fillStyle = grad;
                                ctx.beginPath();
                                ctx.arc(px, py, rad, 0, Math.PI * 2);
                                ctx.fill();
                            }}
                        }}
                    }}

                    // Iso-Stress Contour Rings
                    if (smoothedPsi > 42) {{
                        ctx.strokeStyle = smoothedPsi >= 75 ? 'rgba(255, 51, 102, 0.75)' : 'rgba(255, 179, 0, 0.65)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.ellipse(hotspotX, hotspotY, 68, 48, 0, 0, Math.PI * 2);
                        ctx.stroke();

                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.ellipse(hotspotX, hotspotY, 105, 75, 0, 0, Math.PI * 2);
                        ctx.stroke();
                    }}

                    // Solid Structural Walls
                    ctx.fillStyle = '#1E293B';
                    ctx.fillRect(0, 0, w, wallUpperY);
                    ctx.strokeStyle = '#00E5FF';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, wallUpperY);
                    ctx.lineTo(w, wallUpperY);
                    ctx.stroke();

                    ctx.fillRect(0, wallLowerY, w, h - wallLowerY);
                    ctx.beginPath();
                    ctx.moveTo(0, wallLowerY);
                    ctx.lineTo(w, wallLowerY);
                    ctx.stroke();

                    // Exit Gate Barrier Wall
                    ctx.strokeStyle = gateLocked ? '#FF3366' : '#00E5FF';
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    // Upper wall segment
                    ctx.moveTo(gateX, wallUpperY);
                    ctx.lineTo(gateX, gateY - effectiveGateWidth * 0.5);
                    // Lower wall segment
                    ctx.moveTo(gateX, gateY + effectiveGateWidth * 0.5);
                    ctx.lineTo(gateX, wallLowerY);
                    ctx.stroke();

                    // Deflection Pillars / Columns
                    for (let o = 0; o < obstacles.length; o++) {{
                        const obst = obstacles[o];
                        ctx.fillStyle = '#0F172A';
                        ctx.beginPath();
                        ctx.arc(obst.x, obst.y, obst.r, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.strokeStyle = '#00E5FF';
                        ctx.lineWidth = 3;
                        ctx.stroke();

                        ctx.fillStyle = '#38BDF8';
                        ctx.beginPath();
                        ctx.arc(obst.x, obst.y, obst.r * 0.45, 0, Math.PI * 2);
                        ctx.fill();
                    }}

                    // Render Crowd Particles with Photoelastic Highlights
                    for (let i = 0; i < people.length; i++) {{
                        const p = people[i];
                        const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                        const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                        const s = stressField[gy * cols + gx];

                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

                        if (s >= 70) {{
                            ctx.fillStyle = '#FF3366';
                            ctx.shadowColor = '#FF3366';
                            ctx.shadowBlur = 10;
                        }} else if (s >= 45) {{
                            ctx.fillStyle = '#FFB300';
                            ctx.shadowColor = '#FFB300';
                            ctx.shadowBlur = 6;
                        }} else {{
                            ctx.fillStyle = '#E2E8F0';
                            ctx.shadowBlur = 0;
                        }}

                        ctx.fill();
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }}

                    // Highlight Active Sector and Pulse Hotspot
                    if (smoothedPsi > 45) {{
                        const activeSecX = sectorColIdx * secW;
                        const activeSecY = wallUpperY + sectorRowIdx * secH;
                        ctx.strokeStyle = smoothedPsi >= 75 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(245, 158, 11, 0.75)';
                        ctx.lineWidth = 2.5;
                        ctx.strokeRect(activeSecX, activeSecY, secW, secH);

                        const pulse = 20 + 8 * Math.sin(now * 0.008);
                        ctx.strokeStyle = '#FF3366';
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.arc(hotspotX, hotspotY, pulse, 0, Math.PI * 2);
                        ctx.stroke();
                    }}

                    // Render Sparkline
                    renderMomentumChart();
                }}

                requestAnimationFrame(updateAndRender);
            }}

            function updateTelemetry(psi, peakSector) {{
                const psiElem = document.getElementById('psiVal');
                const meterFill = document.getElementById('meterFill');
                const statusPill = document.getElementById('statusPill');
                const statusLabel = document.getElementById('statusLabel');
                const sectorTag = document.getElementById('sectorTag');
                const peakSectorHud = document.getElementById('peakSectorHud');
                const banner = document.getElementById('actionBanner');
                const actionTitle = document.getElementById('actionTitle');
                const actionDesc = document.getElementById('actionDesc');
                const dispatchBox = document.getElementById('dispatchBox');
                const dispatchText = document.getElementById('dispatchText');

                psiElem.innerText = psi.toFixed(1);
                meterFill.style.width = Math.min(100, psi) + '%';
                sectorTag.innerText = `SECTOR ${{peakSector}}`;
                peakSectorHud.innerText = peakSector;

                if (psi >= 75) {{
                    psiElem.style.color = '#FF3366';
                    psiElem.style.textShadow = '0 0 25px rgba(255, 51, 102, 0.6)';
                    meterFill.style.background = '#FF3366';
                    statusPill.className = 'status-pill status-critical';
                    statusLabel.innerText = 'CRITICAL SURGE';
                    banner.className = 'alert-box status-critical';
                    actionTitle.innerText = `🚨 STAMPEDE CRUSH DANGER IN SECTOR ${{peakSector}}`;
                    actionDesc.innerText = 'Inflow vastly exceeds exit discharge! Room pressure critical. Widen exit or halt entry!';
                    dispatchBox.style.display = 'flex';
                    dispatchText.innerText = `🚨 DISPATCH MARSHALS IMMEDIATELY ➔ SECTOR ${{peakSector}}`;

                    startSiren(true);

                }} else if (psi >= 50) {{
                    psiElem.style.color = '#FFB300';
                    psiElem.style.textShadow = '0 0 20px rgba(255, 179, 0, 0.5)';
                    meterFill.style.background = '#FFB300';
                    statusPill.className = 'status-pill status-warning';
                    statusLabel.innerText = 'ELEVATED WARNING';
                    banner.className = 'alert-box status-warning';
                    actionTitle.innerText = `⚠️ ELEVATED COMPRESSION AT SECTOR ${{peakSector}}`;
                    actionDesc.innerText = 'Chokepoint bottleneck forming. Slow incoming arrivals to allow discharge.';
                    dispatchBox.style.display = 'flex';
                    dispatchText.innerText = `⚠️ ADVISORY ALERT ➔ MONITOR SECTOR ${{peakSector}}`;

                    startSiren(false);

                }} else {{
                    psiElem.style.color = '#00E5FF';
                    psiElem.style.textShadow = '0 0 20px rgba(0, 229, 255, 0.4)';
                    meterFill.style.background = '#00E5FF';
                    statusPill.className = 'status-pill status-nominal';
                    statusLabel.innerText = 'NOMINAL FLOW';
                    banner.className = 'alert-box status-nominal';
                    actionTitle.innerText = '✅ NORMAL FLOW';
                    actionDesc.innerText = 'Inflow matches discharge capacity. Ingress & exit flowing safely.';
                    dispatchBox.style.display = 'none';

                    stopSiren();
                }}
            }}

            function renderMomentumChart() {{
                mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
                if (historyPsi.length < 2) return;

                const mw = mCanvas.width;
                const mh = mCanvas.height;

                mCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                mCtx.lineWidth = 1;
                mCtx.beginPath();
                mCtx.moveTo(0, mh * 0.5);
                mCtx.lineTo(mw, mh * 0.5);
                mCtx.moveTo(0, mh * 0.25);
                mCtx.lineTo(mw, mh * 0.25);
                mCtx.stroke();

                mCtx.beginPath();
                const step = mw / (historyPsi.length - 1);
                for (let i = 0; i < historyPsi.length; i++) {{
                    const x = i * step;
                    const y = mh - (historyPsi[i] / 100.0) * mh;
                    if (i === 0) mCtx.moveTo(x, y);
                    else mCtx.lineTo(x, y);
                }}

                const latest = historyPsi[historyPsi.length - 1];
                mCtx.strokeStyle = latest >= 75 ? '#FF3366' : (latest >= 50 ? '#FFB300' : '#00E5FF');
                mCtx.lineWidth = 2.2;
                mCtx.stroke();
            }}

            requestAnimationFrame(updateAndRender);
        </script>
    </body>
    </html>
    """
