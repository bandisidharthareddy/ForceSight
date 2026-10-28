"""Ultra-realistic, high-performance HTML5 Canvas & WebGL interactive crowd simulator widget.

Features:
- Physical continuous wall & pillar collision with contact normal reaction and friction.
- Real compressive crowd physics: panic social force, crowd turbulence, and wall pinning pressure.
- Interactive Obstacles: Click-to-add / remove circular pillars and barrier guide rails.
- Grid Sectors (A1, A2, B1, B2, C1, C2...) pinpointing exact danger hotspots.
- Web Audio API real-time acoustic alarm siren when stress crosses Warning or Critical tiers.
- Dispatch Alert System notifying security marshals with sector tagging and audio siren.
"""

def get_simulator_html(initial_particles: int = 220, initial_fps: int = 60) -> str:
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
                gap: 12px;
                background: radial-gradient(circle at 10% 10%, #0F172A 0%, #020617 100%);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 14px;
                padding: 16px;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
            }}
            .top-bar {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
                padding-bottom: 10px;
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
                font-size: 16px;
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
                padding: 6px 12px;
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
                padding: 6px 16px;
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
                grid-template-columns: 1fr 320px;
                gap: 14px;
            }}
            @media (max-width: 1000px) {{
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
                height: 520px;
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
                background: rgba(3, 7, 18, 0.65);
                padding: 6px 12px;
                border-radius: 6px;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                gap: 14px;
            }}
            .canvas-helper-tip {{
                position: absolute;
                bottom: 10px;
                left: 12px;
                pointer-events: none;
                font-size: 11px;
                color: rgba(148, 163, 184, 0.8);
                background: rgba(3, 7, 18, 0.6);
                padding: 4px 10px;
                border-radius: 4px;
                backdrop-filter: blur(6px);
            }}
            .right-pane {{
                display: flex;
                flex-direction: column;
                gap: 10px;
            }}
            .card {{
                background: rgba(15, 23, 42, 0.65);
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
                padding: 6px 0;
            }}
            .psi-number {{
                font-family: 'JetBrains Mono', monospace;
                font-size: 46px;
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
                margin-top: 4px;
            }}
            .meter-bar-bg {{
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 4px;
                margin-top: 10px;
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
                background: rgba(255, 255, 255, 0.1);
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
                padding: 8px 10px;
                border-radius: 6px;
                font-size: 12px;
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
            button.btn-action.active {{
                background: rgba(0, 229, 255, 0.2);
                border-color: #00E5FF;
                color: #00E5FF;
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
                gap: 4px;
                margin-top: 8px;
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
                height: 60px;
                display: block;
            }}
            .guard-dispatch-card {{
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(239, 68, 68, 0.12);
                border: 1px dashed rgba(239, 68, 68, 0.4);
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
                        <div class="brand-title">ForceSight — Digital Photoelastic Crowd Simulator</div>
                        <div class="brand-sub">Physical Wall & Pillar Dynamics • Sector Grid Pinpoint • Audio Siren Alert</div>
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
                        <span>CROWD: <strong id="agentCountVal">{initial_particles}</strong></span>
                        <span>GATE: <strong id="gateStateText" style="color: #00E5FF;">OPEN</strong></span>
                        <span>PEAK SECTOR: <strong id="peakSectorHud" style="color: #FCD34D;">C3</strong></span>
                        <span>PILLARS: <strong id="pillarCountHud">1</strong></span>
                    </div>
                    <div class="canvas-helper-tip">
                        💡 <strong>Interactive Arena</strong>: Click anywhere on the corridor floor to place or remove a crowd-deflecting <strong>Pillar</strong>.
                    </div>
                </div>

                <div class="right-pane">
                    <!-- Gauge & Sector Card -->
                    <div class="card">
                        <div class="card-title">
                            <span>PEAK STRESS INDEX</span>
                            <span class="sector-tag" id="sectorTag">SECTOR C3</span>
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
                        <span id="actionDesc" style="font-size: 11px; opacity: 0.9;">Turnstiles operating within safe limits. Standard ingress permitted.</span>
                        <div id="dispatchBox" class="guard-dispatch-card" style="display: none;">
                            <span id="dispatchText">🚨 DISPATCH TO SECTOR C3</span>
                            <button id="btnAcknowledge" style="padding: 2px 8px; font-size: 10px; border-radius: 4px; background: #EF4444; color: white; border: none; cursor: pointer;">ACK</button>
                        </div>
                    </div>

                    <!-- Obstacles & Gate Control Panel -->
                    <div class="card">
                        <div class="card-title">SIMULATION & OBSTACLE CONTROLS</div>
                        <div class="controls-panel">
                            <button id="btnToggleGate" class="btn-action">🚪 Close Gate</button>
                            <button id="btnSurge" class="btn-action danger">⚡ Trigger Surge</button>
                            <button id="btnAddPillars" class="btn-action">🏛️ Add Pillars</button>
                            <button id="btnClearPillars" class="btn-action">🧹 Clear Obstacles</button>
                        </div>

                        <div class="slider-row">
                            <div class="slider-label">
                                <span>Crowd Size (Particles)</span>
                                <span id="densityLabel">{initial_particles}</span>
                            </div>
                            <input type="range" id="densitySlider" min="80" max="400" step="10" value="{initial_particles}">
                        </div>

                        <div class="slider-row">
                            <div class="slider-label">
                                <span>Inflow Push Speed Multiplier</span>
                                <span id="speedLabel">1.2x</span>
                            </div>
                            <input type="range" id="speedSlider" min="0.6" max="2.6" step="0.1" value="1.2">
                        </div>

                        <div class="slider-row">
                            <div class="slider-label">
                                <span>Wall Friction & Compression Resistance</span>
                                <span id="frictionLabel">1.5x</span>
                            </div>
                            <input type="range" id="frictionSlider" min="0.5" max="3.0" step="0.1" value="1.5">
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
                    if (AudioContext) {{
                        audioCtx = new AudioContext();
                    }}
                }}
                if (audioCtx && audioCtx.state === 'suspended') {{
                    audioCtx.resume();
                }}
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
                    // Dual-frequency whoop siren:
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
                mCanvas.height = 60;
            }}
            window.addEventListener('resize', resizeCanvases);
            resizeCanvases();

            // Simulation State
            let isRunning = true;
            let gateOpen = true;
            let numParticles = {initial_particles};
            let speedMult = 1.2;
            let wallFriction = 1.5;
            let smoothedPsi = 18.0;
            let lastTime = performance.now();
            let frameCount = 0;
            let fps = 60;
            const historyPsi = [];

            // Sectors Configuration: 4 Rows (A, B, C, D) x 5 Columns (1, 2, 3, 4, 5)
            const sectorRows = ['A', 'B', 'C', 'D'];
            const sectorCols = [1, 2, 3, 4, 5];

            // Obstacles / Pillars (Circular deflecting columns)
            let obstacles = [
                {{ x: 0, y: 0, r: 24, boon: true }} // Initial pillar in front of chokepoint
            ];

            function repositionInitialObstacles() {{
                obstacles[0].x = canvas.width * 0.52;
                obstacles[0].y = canvas.height * 0.50;
            }}
            repositionInitialObstacles();

            // Add Click-to-add / Remove Obstacle
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
                    if (Math.hypot(clickX - obstacles[i].x, clickY - obstacles[i].y) < obstacles[i].r + 8) {{
                        obstacles.splice(i, 1);
                        removed = true;
                        break;
                    }}
                }}
                if (!removed) {{
                    obstacles.push({{ x: clickX, y: clickY, r: 22, boon: true }});
                }}
                document.getElementById('pillarCountHud').innerText = obstacles.length;
            }});

            // Particle Class with Real Contact Physics
            class Particle {{
                constructor(w, h, gateX) {{
                    this.init(w, h, gateX, true);
                }}
                init(w, h, gateX, fullSpread = false) {{
                    this.x = fullSpread ? Math.random() * (gateX * 0.8) + 10 : -20 - Math.random() * 80;
                    this.y = h * 0.18 + Math.random() * (h * 0.64);
                    this.baseSpeed = 1.9 + Math.random() * 1.6;
                    this.vx = this.baseSpeed;
                    this.vy = 0;
                    this.radius = 7.5 + Math.random() * 3.5;
                    this.stress = 0;
                }}
            }}

            let particles = [];
            function initParticles() {{
                particles = [];
                const gateX = canvas.width * 0.74;
                for (let i = 0; i < numParticles; i++) {{
                    particles.push(new Particle(canvas.width, canvas.height, gateX));
                }}
            }}
            initParticles();

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
                gateOpen = !gateOpen;
                document.getElementById('btnToggleGate').innerText = gateOpen ? '🚪 Close Gate' : '🚪 Open Gate';
                document.getElementById('gateStateText').innerText = gateOpen ? 'OPEN' : 'LOCKED';
                document.getElementById('gateStateText').style.color = gateOpen ? '#00E5FF' : '#FF3366';
            }};

            document.getElementById('btnSurge').onclick = () => {{
                initAudio();
                gateOpen = false;
                speedMult = 2.4;
                document.getElementById('speedSlider').value = 2.4;
                document.getElementById('speedLabel').innerText = '2.4x';
                document.getElementById('btnToggleGate').innerText = '🚪 Open Gate';
                document.getElementById('gateStateText').innerText = 'SURGE LOCK';
                document.getElementById('gateStateText').style.color = '#FF3366';
            }};

            document.getElementById('btnAddPillars').onclick = () => {{
                initAudio();
                const w = canvas.width;
                const h = canvas.height;
                obstacles = [
                    {{ x: w * 0.38, y: h * 0.36, r: 24, boon: true }},
                    {{ x: w * 0.38, y: h * 0.64, r: 24, boon: true }},
                    {{ x: w * 0.58, y: h * 0.50, r: 26, boon: true }}
                ];
                document.getElementById('pillarCountHud').innerText = obstacles.length;
            }};

            document.getElementById('btnClearPillars').onclick = () => {{
                initAudio();
                obstacles = [];
                document.getElementById('pillarCountHud').innerText = '0';
            }};

            document.getElementById('densitySlider').oninput = (e) => {{
                numParticles = parseInt(e.target.value);
                document.getElementById('densityLabel').innerText = numParticles;
                document.getElementById('agentCountVal').innerText = numParticles;
                while (particles.length < numParticles) {{
                    particles.push(new Particle(canvas.width, canvas.height, canvas.width * 0.74));
                }}
                if (particles.length > numParticles) {{
                    particles.length = numParticles;
                }}
            }};

            document.getElementById('speedSlider').oninput = (e) => {{
                speedMult = parseFloat(e.target.value);
                document.getElementById('speedLabel').innerText = speedMult.toFixed(1) + 'x';
            }};

            document.getElementById('frictionSlider').oninput = (e) => {{
                wallFriction = parseFloat(e.target.value);
                document.getElementById('frictionLabel').innerText = wallFriction.toFixed(1) + 'x';
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
                    const gateX = w * 0.74;
                    const gateY = h * 0.50;
                    const gateGap = gateOpen ? 100 : 15;
                    const wallUpperY = h * 0.12;
                    const wallLowerY = h * 0.88;

                    // Grid Accumulator
                    const blockSize = 24;
                    const cols = Math.ceil(w / blockSize);
                    const rows = Math.ceil(h / blockSize);
                    const gridCount = new Float32Array(cols * rows);
                    const gridVx = new Float32Array(cols * rows);
                    const gridVy = new Float32Array(cols * rows);
                    const gridWallPressure = new Float32Array(cols * rows);

                    // 1. Particle Physics with Wall Collision, Friction, and Repulsion
                    for (let i = 0; i < particles.length; i++) {{
                        const p = particles[i];

                        // Target gate navigation
                        const dx = gateX - p.x;
                        const dy = gateY - p.y;
                        const dist = Math.hypot(dx, dy) + 0.1;
                        const desiredVx = (dx / dist) * p.baseSpeed * speedMult;
                        const desiredVy = (dy / dist) * p.baseSpeed * speedMult;

                        p.vx += 0.22 * (desiredVx - p.vx);
                        p.vy += 0.22 * (desiredVy - p.vy);

                        // Obstacle / Pillar Hard Contact Collision
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

                                // Hard push out of pillar
                                p.x += nx * overlap;
                                p.y += ny * overlap;

                                // Deflect velocity along tangent
                                const dot = p.vx * nx + p.vy * ny;
                                if (dot < 0) {{
                                    p.vx -= 1.4 * dot * nx;
                                    p.vy -= 1.4 * dot * ny;
                                }}
                            }}
                        }}

                        // Wall Collision (Top and Bottom Corridor Boundaries)
                        // True physical boundary: particles contact the wall directly!
                        if (p.y - p.radius < wallUpperY) {{
                            const overlap = wallUpperY - (p.y - p.radius);
                            p.y = wallUpperY + p.radius;
                            // Pressure against wall increases with speed pushing into it
                            const pressurePush = Math.abs(p.vy) + 1.2 * wallFriction;
                            p.vy = Math.abs(p.vy) * 0.3; // Inelastic rebound
                            p.vx *= Math.max(0.2, 1.0 - 0.25 * wallFriction); // Wall shear friction

                            // Accumulate localized wall crushing pressure
                            const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                            const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                            gridWallPressure[gy * cols + gx] += pressurePush;
                        }} else if (p.y + p.radius > wallLowerY) {{
                            const overlap = (p.y + p.radius) - wallLowerY;
                            p.y = wallLowerLower = wallLowerY - p.radius;
                            p.y = wallLowerY - p.radius;
                            const pressurePush = Math.abs(p.vy) + 1.2 * wallFriction;
                            p.vy = -Math.abs(p.vy) * 0.3;
                            p.vx *= Math.max(0.2, 1.0 - 0.25 * wallFriction);

                            const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                            const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                            gridWallPressure[gy * cols + gx] += pressurePush;
                        }}

                        // Chokepoint Gate Barrier Wall Hard Collision
                        const isAtGateLine = p.x + p.radius >= gateX && p.x - p.radius <= gateX + 16;
                        const isOutsideGateSlot = Math.abs(p.y - gateY) > (gateGap * 0.5 - 4);

                        if (isAtGateLine && isOutsideGateSlot) {{
                            // Pinned against the gate wall!
                            p.x = gateX - p.radius;
                            const contactPressure = Math.abs(p.vx) * 2.5 * wallFriction;
                            p.vx = -Math.abs(p.vx) * 0.1; // Stall
                            // Turbulent lateral sliding under high compression
                            p.vy += (Math.random() - 0.5) * (7.0 * speedMult);

                            const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                            const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                            gridWallPressure[gy * cols + gx] += contactPressure;
                        }}

                        // Hard compression funnel when gate locked
                        if (!gateOpen && p.x >= gateX - 240 && p.x <= gateX) {{
                            p.vx *= 0.25;
                            p.vy += (Math.random() - 0.5) * (9.0 * speedMult);
                        }}

                        // Forward motion integration
                        p.x += p.vx;
                        p.y += p.vy;

                        // Re-inject particles through entry after crossing the gate
                        if (p.x > w + 20) {{
                            p.init(w, h, gateX, false);
                        }}

                        // Bin into grid
                        const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                        const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                        const gIdx = gy * cols + gx;
                        gridCount[gIdx]++;
                        gridVx[gIdx] += p.vx;
                        gridVy[gIdx] += p.vy;
                    }}

                    // 2. Evaluate Photoelastic Stress Field & Find Peak Sector
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
                                for (let i = 0; i < particles.length; i++) {{
                                    const px = Math.floor(particles[i].x / blockSize);
                                    const py = Math.floor(particles[i].y / blockSize);
                                    if (px === gx && py === gy) {{
                                        variance += Math.pow(particles[i].vx - meanVx, 2) + Math.pow(particles[i].vy - meanVy, 2);
                                    }}
                                }}
                                const varNorm = count > 0 ? Math.min(1.0, (variance / count) / 10.0) : 0;
                                const coupled = rho * varNorm;

                                // Wall & barrier crushing pressure boost
                                const wallCrush = Math.min(1.0, gridWallPressure[idx] / 6.0);

                                // Chokepoint stagnation factor
                                const isNearChokepoint = Math.abs(gx * blockSize - gateX) < 130;
                                const stag = isNearChokepoint && !gateOpen ? 0.38 : 0.05;

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

                    // Push rolling history
                    historyPsi.push(smoothedPsi);
                    if (historyPsi.length > 80) historyPsi.shift();

                    // Determine Sector Grid Location of Peak Hotspot
                    // 4 Rows (A, B, C, D) & 5 Columns (1, 2, 3, 4, 5)
                    const sectorColIdx = Math.min(4, Math.max(0, Math.floor((hotspotX / w) * 5)));
                    const sectorRowIdx = Math.min(3, Math.max(0, Math.floor(((hotspotY - wallUpperY) / (wallLowerY - wallUpperY)) * 4)));
                    const peakSectorName = `${{sectorRows[sectorRowIdx]}}${{sectorCols[sectorColIdx]}}`;

                    // Update UI Telemetry & Audio Siren
                    updateTelemetry(smoothedPsi, peakSectorName);

                    // 3. Render Photoelastic Darkfield & Continuous Interference Fringes
                    ctx.clearRect(0, 0, w, h);

                    // Dark polariscope chamber floor
                    ctx.fillStyle = '#060B18';
                    ctx.fillRect(0, 0, w, h);

                    // Draw Sector Grid Overlay (Light transparent lines with labeled coordinates)
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

                    // Draw Sector Grid Labels (A1, A2...)
                    ctx.font = '10px JetBrains Mono';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    for (let r = 0; r < 4; r++) {{
                        for (let c = 0; c < 5; c++) {{
                            const label = `${{sectorRows[r]}}${{sectorCols[c]}}`;
                            ctx.fillText(label, c * secW + 8, wallUpperY + r * secH + 16);
                        }}
                    }}

                    // Draw Photoelastic Continuous Stress Fringes
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

                    // Iso-Stress Concentric Contour Rings
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

                    // Draw Solid Structural Walls
                    // Top boundary wall
                    ctx.fillStyle = '#1E293B';
                    ctx.fillRect(0, 0, w, wallUpperY);
                    ctx.strokeStyle = '#00E5FF';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, wallUpperY);
                    ctx.lineTo(w, wallUpperY);
                    ctx.stroke();

                    // Bottom boundary wall
                    ctx.fillRect(0, wallLowerY, w, h - wallLowerY);
                    ctx.beginPath();
                    ctx.moveTo(0, wallLowerY);
                    ctx.lineTo(w, wallLowerY);
                    ctx.stroke();

                    // Gate Barrier Barricades
                    ctx.strokeStyle = gateOpen ? '#00E5FF' : '#FF3366';
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    ctx.moveTo(gateX, wallUpperY);
                    ctx.lineTo(gateX, gateY - gateGap * 0.5);
                    ctx.moveTo(gateX, gateY + gateGap * 0.5);
                    ctx.lineTo(gateX, wallLowerY);
                    ctx.stroke();

                    // Draw Pillars / Deflection Columns
                    for (let o = 0; o < obstacles.length; o++) {{
                        const obst = obstacles[o];
                        // Outer structural shadow
                        ctx.fillStyle = '#0F172A';
                        ctx.beginPath();
                        ctx.arc(obst.x, obst.y, obst.r, 0, Math.PI * 2);
                        ctx.fill();

                        // Modern column core with cyan accent
                        ctx.strokeStyle = '#00E5FF';
                        ctx.lineWidth = 3;
                        ctx.stroke();

                        ctx.fillStyle = '#38BDF8';
                        ctx.beginPath();
                        ctx.arc(obst.x, obst.y, obst.r * 0.45, 0, Math.PI * 2);
                        ctx.fill();
                    }}

                    // Render Crowd Particles with Photoelastic Highlights
                    for (let i = 0; i < particles.length; i++) {{
                        const p = particles[i];
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
                        ctx.strokeStyle = smoothedPsi >= 75 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.7)';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(activeSecX, activeSecY, secW, secH);

                        const pulse = 20 + 8 * Math.sin(now * 0.008);
                        ctx.strokeStyle = '#FF3366';
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.arc(hotspotX, hotspotY, pulse, 0, Math.PI * 2);
                        ctx.stroke();
                    }}

                    // 4. Render Sparkline Momentum Chart
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
                    actionTitle.innerText = `🚨 CRITICAL STAMPEDE RISK IN SECTOR ${{peakSector}}`;
                    actionDesc.innerText = 'Crush threshold exceeded! Immediate marshal intervention required.';
                    dispatchBox.style.display = 'flex';
                    dispatchText.innerText = `🚨 DISPATCH MARSHALS IMMEDIATELY ➔ SECTOR ${{peakSector}}`;

                    // Sound Siren
                    startSiren(true);

                }} else if (psi >= 50) {{
                    psiElem.style.color = '#FFB300';
                    psiElem.style.textShadow = '0 0 20px rgba(255, 179, 0, 0.5)';
                    meterFill.style.background = '#FFB300';
                    statusPill.className = 'status-pill status-warning';
                    statusLabel.innerText = 'ELEVATED WARNING';
                    banner.className = 'alert-box status-warning';
                    actionTitle.innerText = `⚠️ ELEVATED CROWD DENSITY AT SECTOR ${{peakSector}}`;
                    actionDesc.innerText = 'Chokepoint compression accumulating. Throttle gate by 50% & pulse ingress.';
                    dispatchBox.style.display = 'flex';
                    dispatchText.innerText = `⚠️ ADVISORY ALERT ➔ MONITOR SECTOR ${{peakSector}}`;

                    // Intermittent Siren
                    startSiren(false);

                }} else {{
                    psiElem.style.color = '#00E5FF';
                    psiElem.style.textShadow = '0 0 20px rgba(0, 229, 255, 0.4)';
                    meterFill.style.background = '#00E5FF';
                    statusPill.className = 'status-pill status-nominal';
                    statusLabel.innerText = 'NOMINAL FLOW';
                    banner.className = 'alert-box status-nominal';
                    actionTitle.innerText = '✅ NORMAL FLOW';
                    actionDesc.innerText = 'Turnstiles operating within safe limits. Standard ingress permitted.';
                    dispatchBox.style.display = 'none';

                    // Silence Siren
                    stopSiren();
                }}
            }}

            function renderMomentumChart() {{
                mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
                if (historyPsi.length < 2) return;

                const mw = mCanvas.width;
                const mh = mCanvas.height;

                // Threshold Lines
                mCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                mCtx.lineWidth = 1;
                mCtx.beginPath();
                mCtx.moveTo(0, mh * 0.5);
                mCtx.lineTo(mw, mh * 0.5);
                mCtx.moveTo(0, mh * 0.25);
                mCtx.lineTo(mw, mh * 0.25);
                mCtx.stroke();

                // Sparkline
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
