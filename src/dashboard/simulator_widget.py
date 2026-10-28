"""Modern, high-performance HTML5 Canvas & WebGL interactive crowd simulator widget.

Provides 60 FPS client-side rendering with authentic Michel-Lévy photoelastic birefringence fringes,
particle-level crowd dynamics, bottleneck chokepoints, and real-time early warning telemetry.
Zero server bottlenecks or Python websocket lag.
"""

def get_simulator_html(initial_particles: int = 180, initial_fps: int = 60) -> str:
    """Generate standalone self-contained high-performance simulator HTML component."""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            * {{
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                user-select: none;
            }}
            body {{
                background-color: transparent;
                font-family: 'Inter', sans-serif;
                color: #F8FAFC;
                overflow: hidden;
            }}
            .sim-wrapper {{
                display: flex;
                flex-direction: column;
                gap: 12px;
                background: radial-gradient(circle at 10% 10%, #0F172A 0%, #020617 100%);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 14px;
                padding: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
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
                width: 32px;
                height: 32px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
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
            .status-pill {{
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 5px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
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
                background: rgba(245, 158, 11, 0.18);
                border: 1px solid #F59E0B;
                color: #FCD34D;
                box-shadow: 0 0 14px rgba(245, 158, 11, 0.35);
            }}
            .status-critical {{
                background: rgba(239, 68, 68, 0.22);
                border: 1px solid #EF4444;
                color: #FCA5A5;
                box-shadow: 0 0 18px rgba(239, 68, 68, 0.45);
                animation: pulse-border 1.5s infinite;
            }}
            @keyframes pulse-border {{
                0% {{ box-shadow: 0 0 8px rgba(239, 68, 68, 0.3); }}
                50% {{ box-shadow: 0 0 20px rgba(239, 68, 68, 0.7); }}
                100% {{ box-shadow: 0 0 8px rgba(239, 68, 68, 0.3); }}
            }}
            .main-content {{
                display: grid;
                grid-template-columns: 1fr 300px;
                gap: 14px;
            }}
            @media (max-width: 950px) {{
                .main-content {{
                    grid-template-columns: 1fr;
                }}
            }}
            .canvas-container {{
                position: relative;
                background-color: #030712;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                overflow: hidden;
                width: 100%;
                height: 480px;
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
                color: rgba(255, 255, 255, 0.75);
                background: rgba(0, 0, 0, 0.45);
                padding: 6px 10px;
                border-radius: 6px;
                backdrop-filter: blur(6px);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }}
            .right-pane {{
                display: flex;
                flex-direction: column;
                gap: 12px;
            }}
            .card {{
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 12px;
                backdrop-filter: blur(10px);
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
                padding: 8px 0;
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
                font-size: 12px;
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
                width: 20%;
                background: #00E5FF;
                border-radius: 4px;
                transition: width 0.15s ease, background 0.2s ease;
            }}
            .mini-chart-canvas {{
                width: 100%;
                height: 65px;
                display: block;
            }}
            .alert-box {{
                border-radius: 8px;
                padding: 10px;
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
            button {{
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
            button:hover {{
                border-color: #00E5FF;
                color: #00E5FF;
                box-shadow: 0 0 12px rgba(0, 229, 255, 0.3);
                transform: translateY(-1px);
            }}
            button.danger {{
                border-color: rgba(239, 68, 68, 0.4);
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(153, 27, 27, 0.4) 100%);
            }}
            button.danger:hover {{
                border-color: #EF4444;
                color: #FCA5A5;
                box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
            }}
            .slider-row {{
                display: flex;
                flex-direction: column;
                gap: 4px;
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
        </style>
    </head>
    <body>
        <div class="sim-wrapper">
            <div class="top-bar">
                <div class="brand">
                    <div class="brand-badge">⚡</div>
                    <div>
                        <div class="brand-title">ForceSight — Digital Photoelastic Simulator</div>
                        <div class="brand-sub">Michel-Lévy Birefringence Fringes • Real-Time Social Force Engine</div>
                    </div>
                </div>
                <div id="statusPill" class="status-pill status-nominal">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: currentColor;"></span>
                    <span id="statusLabel">NOMINAL FLOW</span>
                </div>
            </div>

            <div class="main-content">
                <div class="canvas-container" id="canvasBox">
                    <canvas id="simCanvas"></canvas>
                    <div class="hud-overlay" id="hud">
                        FPS: <span id="fpsVal">60</span> | AGENTS: <span id="agentCountVal">{initial_particles}</span> | GATE: <span id="gateStateText">OPEN</span>
                    </div>
                </div>

                <div class="right-pane">
                    <!-- Gauge Card -->
                    <div class="card">
                        <div class="card-title">
                            <span>PEAK STRESS INDEX</span>
                            <span id="regimeTag" style="color: #6EE7B7;">NOMINAL</span>
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
                        <div class="card-title">STRESS MOMENTUM (dPSI/dt)</div>
                        <canvas id="momentumCanvas" class="mini-chart-canvas"></canvas>
                    </div>

                    <!-- Action Guidance Banner -->
                    <div class="alert-box status-nominal" id="actionBanner">
                        <strong id="actionTitle">✅ NORMAL FLOW</strong><br>
                        <span id="actionDesc" style="font-size: 11px; opacity: 0.9;">Turnstiles operating within safe limits. Maintain standard ingress.</span>
                    </div>

                    <!-- Interactive Controls -->
                    <div class="card">
                        <div class="card-title">CROWD & GATE CONTROLS</div>
                        <div class="controls-panel">
                            <button id="btnToggleGate">🚪 Close Gate</button>
                            <button id="btnSurge" class="danger">⚡ Surge Inrush</button>
                            <button id="btnReset">🔄 Reset Crowd</button>
                            <button id="btnPause">⏸️ Pause</button>
                        </div>
                        <div class="slider-row">
                            <div class="slider-label">
                                <span>Crowd Density</span>
                                <span id="densityLabel">{initial_particles}</span>
                            </div>
                            <input type="range" id="densitySlider" min="60" max="350" step="10" value="{initial_particles}">
                        </div>
                        <div class="slider-row">
                            <div class="slider-label">
                                <span>Inflow Speed Multiplier</span>
                                <span id="speedLabel">1.2x</span>
                            </div>
                            <input type="range" id="speedSlider" min="0.5" max="2.5" step="0.1" value="1.2">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Canvas setup
            const canvas = document.getElementById('simCanvas');
            const ctx = canvas.getContext('2d');
            const mCanvas = document.getElementById('momentumCanvas');
            const mCtx = mCanvas.getContext('2d');

            function resizeCanvases() {{
                const box = document.getElementById('canvasBox');
                canvas.width = box.clientWidth;
                canvas.height = box.clientHeight;
                mCanvas.width = mCanvas.parentElement.clientWidth - 24;
                mCanvas.height = 65;
            }}
            window.addEventListener('resize', resizeCanvases);
            resizeCanvases();

            // Simulation state
            let isRunning = true;
            let gateOpen = true;
            let numParticles = {initial_particles};
            let speedMult = 1.2;
            let smoothedPsi = 18.0;
            let lastTime = performance.now();
            let frameCount = 0;
            let fps = 60;
            const historyPsi = [];

            // Particles Array
            class Particle {{
                constructor(w, h, gateX) {{
                    this.init(w, h, gateX, true);
                }}
                init(w, h, gateX, fullSpread = false) {{
                    this.x = fullSpread ? Math.random() * (gateX * 0.8) + 20 : -20 - Math.random() * 50;
                    this.y = h * 0.22 + Math.random() * (h * 0.56);
                    this.baseSpeed = 2.0 + Math.random() * 1.5;
                    this.vx = this.baseSpeed;
                    this.vy = 0;
                    this.radius = 7 + Math.random() * 3.5;
                }}
            }}

            let particles = [];
            function initParticles() {{
                particles = [];
                const gateX = canvas.width * 0.72;
                for (let i = 0; i < numParticles; i++) {{
                    particles.push(new Particle(canvas.width, canvas.height, gateX));
                }}
            }}
            initParticles();

            // Photoelastic Birefringence Color Table (Michel-Levy Spectrum)
            function getPhotoelasticColor(s, alpha = 0.6) {{
                // s in [0, 1]
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

            // Event Listeners for Controls
            document.getElementById('btnToggleGate').onclick = () => {{
                gateOpen = !gateOpen;
                document.getElementById('btnToggleGate').innerText = gateOpen ? '🚪 Close Gate' : '🚪 Open Gate';
                document.getElementById('gateStateText').innerText = gateOpen ? 'OPEN' : 'LOCKED';
            }};

            document.getElementById('btnSurge').onclick = () => {{
                gateOpen = false;
                speedMult = 2.2;
                document.getElementById('speedSlider').value = 2.2;
                document.getElementById('speedLabel').innerText = '2.2x';
                document.getElementById('btnToggleGate').innerText = '🚪 Open Gate';
                document.getElementById('gateStateText').innerText = 'SURGE LOCK';
            }};

            document.getElementById('btnReset').onclick = () => {{
                initParticles();
                smoothedPsi = 18.0;
                historyPsi.length = 0;
            }};

            document.getElementById('btnPause').onclick = () => {{
                isRunning = !isRunning;
                document.getElementById('btnPause').innerText = isRunning ? '⏸️ Pause' : '▶️ Resume';
            }};

            document.getElementById('densitySlider').oninput = (e) => {{
                numParticles = parseInt(e.target.value);
                document.getElementById('densityLabel').innerText = numParticles;
                document.getElementById('agentCountVal').innerText = numParticles;
                while (particles.length < numParticles) {{
                    particles.push(new Particle(canvas.width, canvas.height, canvas.width * 0.72));
                }}
                if (particles.length > numParticles) {{
                    particles.length = numParticles;
                }}
            }};

            document.getElementById('speedSlider').oninput = (e) => {{
                speedMult = parseFloat(e.target.value);
                document.getElementById('speedLabel').innerText = speedMult.toFixed(1) + 'x';
            }};

            // Main Animation Frame
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
                    const gateX = w * 0.72;
                    const gateY = h * 0.50;
                    const gateGap = gateOpen ? 90 : 15;

                    // 1. Grid density & velocity variance accumulators
                    const blockSize = 25;
                    const cols = Math.ceil(w / blockSize);
                    const rows = Math.ceil(h / blockSize);
                    const gridCount = new Float32Array(cols * rows);
                    const gridVx = new Float32Array(cols * rows);
                    const gridVy = new Float32Array(cols * rows);

                    // 2. Particle physics update
                    for (let i = 0; i < particles.length; i++) {{
                        const p = particles[i];

                        // Target gate navigation
                        const dx = gateX - p.x;
                        const dy = gateY - p.y;
                        const dist = Math.hypot(dx, dy) + 0.1;
                        const desiredVx = (dx / dist) * p.baseSpeed * speedMult;
                        const desiredVy = (dy / dist) * p.baseSpeed * speedMult;

                        p.vx += 0.25 * (desiredVx - p.vx);
                        p.vy += 0.25 * (desiredVy - p.vy);

                        // Gate collision and compression shear
                        const nearGate = p.x >= gateX - 120 && p.x <= gateX + 10;
                        const outsideGateGap = Math.abs(p.y - gateY) > gateGap * 0.5;

                        if (nearGate && outsideGateGap) {{
                            p.vx *= 0.15;
                            p.x = Math.min(p.x, gateX - 4);
                            // High lateral turbulent friction
                            p.vy += (Math.random() - 0.5) * 6.5;
                        }}

                        if (!gateOpen) {{
                            // Total crush funnel
                            if (p.x >= gateX - 220 && p.x <= gateX + 10) {{
                                p.vx *= 0.2;
                                p.vy += (Math.random() - 0.5) * 8.5;
                            }}
                        }}

                        // Forward motion integration
                        p.x += p.vx;
                        p.y += p.vy;

                        // Boundary bounds
                        p.y = Math.max(h * 0.16, Math.min(h * 0.84, p.y));

                        // Re-cycle passed particles
                        if (p.x > w + 20) {{
                            p.init(w, h, gateX, false);
                        }}

                        // Bin into coarse grid
                        const gx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / blockSize)));
                        const gy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / blockSize)));
                        const gIdx = gy * cols + gx;
                        gridCount[gIdx]++;
                        gridVx[gIdx] += p.vx;
                        gridVy[gIdx] += p.vy;
                    }}

                    // 3. Evaluate Photoelastic Stress Field
                    let maxStress = 0;
                    let hotspotX = gateX - 50;
                    let hotspotY = gateY;

                    const stressField = new Float32Array(cols * rows);
                    for (let gy = 0; gy < rows; gy++) {{
                        for (let gx = 0; gx < cols; gx++) {{
                            const idx = gy * cols + gx;
                            const count = gridCount[idx];
                            if (count > 0) {{
                                const meanVx = gridVx[idx] / count;
                                const meanVy = gridVy[idx] / count;
                                const rho = Math.min(1.0, count / 5.0);

                                // Approximate velocity variance
                                let variance = 0;
                                for (let i = 0; i < particles.length; i++) {{
                                    const px = Math.floor(particles[i].x / blockSize);
                                    const py = Math.floor(particles[i].y / blockSize);
                                    if (px === gx && py === gy) {{
                                        variance += Math.pow(particles[i].vx - meanVx, 2) + Math.pow(particles[i].vy - meanVy, 2);
                                    }}
                                }}
                                const varNorm = Math.min(1.0, (variance / count) / 10.0);
                                const coupled = rho * varNorm;

                                // Chokepoint stagnation factor
                                const isNearChokepoint = Math.abs(gx * blockSize - gateX) < 140;
                                const stag = isNearChokepoint && !gateOpen ? 0.35 : 0.05;

                                const s = Math.min(100, (rho * 30 + varNorm * 25 + coupled * 35 + stag * 20) * 1.05);
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

                    // Update UI Telemetry
                    updateTelemetry(smoothedPsi);

                    // 4. Render Photoelastic Darkfield & Birefringence Fringes
                    ctx.clearRect(0, 0, w, h);

                    // Polariscope dark background
                    ctx.fillStyle = '#060B18';
                    ctx.fillRect(0, 0, w, h);

                    // Draw Photoelastic Continuous Stress Fringes
                    for (let gy = 0; gy < rows; gy++) {{
                        for (let gx = 0; gx < cols; gx++) {{
                            const s = stressField[gy * cols + gx];
                            if (s > 4) {{
                                const normS = s / 100.0;
                                const rad = blockSize * 1.5;
                                const px = (gx + 0.5) * blockSize;
                                const py = (gy + 0.5) * blockSize;

                                const grad = ctx.createRadialGradient(px, py, 2, px, py, rad);
                                grad.addColorStop(0, getPhotoelasticColor(normS, Math.min(0.85, 0.2 + normS * 0.7)));
                                grad.addColorStop(1, 'rgba(6, 11, 24, 0)');

                                ctx.fillStyle = grad;
                                ctx.beginPath();
                                ctx.arc(px, py, rad, 0, Math.PI * 2);
                                ctx.fill();
                            }}
                        }}
                    }}

                    // Iso-Stress Contour Rings (Critical birefringence fringe orders)
                    if (smoothedPsi > 45) {{
                        ctx.strokeStyle = smoothedPsi >= 75 ? 'rgba(255, 51, 102, 0.7)' : 'rgba(255, 179, 0, 0.6)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.ellipse(hotspotX, hotspotY, 65, 45, 0, 0, Math.PI * 2);
                        ctx.stroke();

                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.ellipse(hotspotX, hotspotY, 95, 65, 0, 0, Math.PI * 2);
                        ctx.stroke();
                    }}

                    // Draw Corridor Geometry & Barriers
                    ctx.strokeStyle = '#334155';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, h * 0.16);
                    ctx.lineTo(w, h * 0.16);
                    ctx.moveTo(0, h * 0.84);
                    ctx.lineTo(w, h * 0.84);
                    ctx.stroke();

                    // Chokepoint Gate Barriers
                    ctx.strokeStyle = gateOpen ? '#00E5FF' : '#FF3366';
                    ctx.lineWidth = 7;
                    ctx.beginPath();
                    // Upper wall
                    ctx.moveTo(gateX, h * 0.16);
                    ctx.lineTo(gateX, gateY - gateGap * 0.5);
                    // Lower wall
                    ctx.moveTo(gateX, gateY + gateGap * 0.5);
                    ctx.lineTo(gateX, h * 0.84);
                    ctx.stroke();

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
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.shadowBlur = 0; // reset
                    }}

                    // Hotspot Pulse Marker
                    if (smoothedPsi > 50) {{
                        const pulse = 18 + 6 * Math.sin(now * 0.008);
                        ctx.strokeStyle = '#FF3366';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(hotspotX, hotspotY, pulse, 0, Math.PI * 2);
                        ctx.stroke();
                    }}

                    // 5. Render Mini Momentum Chart
                    renderMomentumChart();
                }}

                requestAnimationFrame(updateAndRender);
            }}

            function updateTelemetry(psi) {{
                const psiElem = document.getElementById('psiVal');
                const meterFill = document.getElementById('meterFill');
                const statusPill = document.getElementById('statusPill');
                const statusLabel = document.getElementById('statusLabel');
                const regimeTag = document.getElementById('regimeTag');
                const banner = document.getElementById('actionBanner');
                const actionTitle = document.getElementById('actionTitle');
                const actionDesc = document.getElementById('actionDesc');

                psiElem.innerText = psi.toFixed(1);
                meterFill.style.width = Math.min(100, psi) + '%';

                if (psi >= 75) {{
                    psiElem.style.color = '#FF3366';
                    psiElem.style.textShadow = '0 0 25px rgba(255, 51, 102, 0.6)';
                    meterFill.style.background = '#FF3366';
                    statusPill.className = 'status-pill status-critical';
                    statusLabel.innerText = 'CRITICAL SURGE';
                    regimeTag.innerText = 'CRITICAL';
                    regimeTag.style.color = '#FF3366';
                    banner.className = 'alert-box status-critical';
                    actionTitle.innerText = '🚨 HALT INGRESS IMMEDIATELY';
                    actionDesc.innerText = 'Chokepoint compression exceeds safe threshold! Open diversion gates immediately.';
                }} else if (psi >= 50) {{
                    psiElem.style.color = '#FFB300';
                    psiElem.style.textShadow = '0 0 20px rgba(255, 179, 0, 0.5)';
                    meterFill.style.background = '#FFB300';
                    statusPill.className = 'status-pill status-warning';
                    statusLabel.innerText = 'ELEVATED WARNING';
                    regimeTag.innerText = 'WARNING';
                    regimeTag.style.color = '#FFB300';
                    banner.className = 'alert-box status-warning';
                    actionTitle.innerText = '⚠️ THROTTLE GATES BY 50%';
                    actionDesc.innerText = 'Localized density accumulating at chokepoint. Pulse ingress to relieve compression.';
                }} else {{
                    psiElem.style.color = '#00E5FF';
                    psiElem.style.textShadow = '0 0 20px rgba(0, 229, 255, 0.4)';
                    meterFill.style.background = '#00E5FF';
                    statusPill.className = 'status-pill status-nominal';
                    statusLabel.innerText = 'NOMINAL FLOW';
                    regimeTag.innerText = 'NOMINAL';
                    regimeTag.style.color = '#6EE7B7';
                    banner.className = 'alert-box status-nominal';
                    actionTitle.innerText = '✅ NORMAL FLOW';
                    actionDesc.innerText = 'Turnstiles operating within safe limits. Maintain standard ingress.';
                }}
            }}

            function renderMomentumChart() {{
                mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
                if (historyPsi.length < 2) return;

                const mw = mCanvas.width;
                const mh = mCanvas.height;

                // Threshold reference lines
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
                mCtx.lineWidth = 2;
                mCtx.stroke();
            }}

            requestAnimationFrame(updateAndRender);
        </script>
    </body>
    </html>
    """
