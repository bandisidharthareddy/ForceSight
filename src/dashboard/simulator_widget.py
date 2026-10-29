"""ForceSight Virtual Bench & Early-Warning Console.

Full-fidelity granular crowd dynamics simulation and physical photoelastic bench.
Implements the Helbing social-force model with normal contact compression,
tangential sliding friction, barrier load-cell integration, and Michel-Lévy isochromatic
optical birefringence fringes.
"""

def get_simulator_html(initial_particles: int = 115, initial_fps: int = 60) -> str:
    """Generate the complete, self-contained ForceSight control-room console HTML."""
    # We construct the HTML without f-string brackets to preserve JavaScript/CSS integrity.
    html_template = """<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>ForceSight Virtual Bench</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500&display=swap">
<style>
/* Layout: a control-room console. Stage left (live crowd), instrument rail right. Dark by design. */
:root {
  --bg:#0D1114; --panel:#141B21; --panel2:#1B242C; --line:#28343D; --line2:#3A4A56;
  --ink:#E8EFF4; --ink2:#93A4B1; --ink3:#64757F;
  --steel:#4FB3D9; --good:#3E9E6B; --warn:#D9A33C; --crit:#D4513A;
  --fd:"Barlow Condensed",'Arial Narrow',sans-serif;
  --fb:"IBM Plex Sans",system-ui,sans-serif;
  --fm:"IBM Plex Mono",ui-monospace,monospace;
  color-scheme:dark;
}
* { box-sizing:border-box; }
body {
  background:var(--bg);
  color:var(--ink);
  font-family:var(--fb);
  margin:0;
  padding:0;
  min-height:100%;
  -webkit-font-smoothing:antialiased;
}
.wrap {
  padding-left:max(16px,env(safe-area-inset-left,0px));
  padding-right:max(16px,env(safe-area-inset-right,0px));
  padding-block:14px 20px;
  max-width:1500px;
  margin:0 auto;
}

header {
  display:flex;
  flex-wrap:wrap;
  align-items:flex-end;
  gap:12px 20px;
  border-bottom:1px solid var(--line);
  padding-bottom:12px;
}
.brand {
  display:flex;
  align-items:baseline;
  gap:10px;
  min-width:0;
}
.brand h1 {
  font-family:var(--fd);
  font-weight:700;
  font-size:clamp(26px,4vw,38px);
  letter-spacing:.5px;
  margin:0;
  line-height:1;
  text-wrap:balance;
}
.brand .sub {
  font-family:var(--fd);
  font-size:15px;
  letter-spacing:2.4px;
  color:var(--ink3);
  text-transform:uppercase;
}
.tabs {
  display:flex;
  gap:0;
  border:1px solid var(--line2);
  border-radius:3px;
  overflow:hidden;
  margin-left:auto;
}
.tabs button {
  font-family:var(--fd);
  font-size:15px;
  letter-spacing:1.4px;
  text-transform:uppercase;
  background:transparent;
  color:var(--ink2);
  border:0;
  padding:8px 14px;
  cursor:pointer;
  transition:background 0.15s, color 0.15s;
}
.tabs button[aria-selected="true"] {
  background:var(--steel);
  color:#06181F;
  font-weight:600;
}
.tabs button:focus-visible {
  outline:2px solid var(--steel);
  outline-offset:-2px;
}

.grid {
  display:grid;
  grid-template-columns:minmax(0,1fr) 352px;
  gap:16px;
  margin-top:14px;
  align-items:start;
}
@media (max-width:900px) {
  .grid { grid-template-columns:minmax(0,1fr); }
}

.stage {
  min-width:0;
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:4px;
  overflow:hidden;
}
.toolbar {
  display:flex;
  flex-wrap:wrap;
  gap:10px 16px;
  align-items:center;
  padding:10px 12px;
  border-bottom:1px solid var(--line);
  background:var(--panel2);
}
.ctl {
  display:flex;
  align-items:center;
  gap:8px;
  min-width:0;
}
.ctl label {
  font-family:var(--fd);
  font-size:14px;
  letter-spacing:1.3px;
  text-transform:uppercase;
  color:var(--ink2);
  white-space:nowrap;
}
.ctl output {
  font-family:var(--fm);
  font-size:13px;
  color:var(--ink);
  min-width:48px;
}
input[type=range] {
  width:104px;
  accent-color:var(--steel);
}
button.btn {
  font-family:var(--fd);
  font-size:15px;
  letter-spacing:1.3px;
  text-transform:uppercase;
  background:var(--panel);
  color:var(--ink);
  border:1px solid var(--line2);
  border-radius:3px;
  padding:7px 12px;
  cursor:pointer;
  transition:border-color 0.15s, color 0.15s, background 0.15s;
}
button.btn:hover {
  border-color:var(--steel);
  color:#fff;
}
button.btn:focus-visible {
  outline:2px solid var(--steel);
  outline-offset:2px;
}
button.btn.danger {
  border-color:#6B2B20;
  color:#F0A292;
}
button.btn.danger:hover {
  background:var(--crit);
  color:#120605;
  border-color:var(--crit);
}
button.btn[aria-pressed="true"] {
  background:var(--steel);
  color:#06181F;
  border-color:var(--steel);
  font-weight:600;
}
.canvaswrap {
  position:relative;
  background:#080B0D;
}
canvas#view {
  display:block;
  width:100%;
  height:clamp(300px,54vh,560px);
}
.ramp {
  display:flex;
  align-items:center;
  gap:10px;
  padding:8px 12px;
  border-top:1px solid var(--line);
  background:var(--panel2);
  flex-wrap:wrap;
}
.ramp .bar {
  height:9px;
  width:170px;
  border-radius:2px;
}
.ramp span {
  font-family:var(--fd);
  font-size:13px;
  letter-spacing:1.2px;
  text-transform:uppercase;
  color:var(--ink3);
}

.rail {
  display:flex;
  flex-direction:column;
  gap:12px;
  min-width:0;
}
.alarm {
  border-radius:4px;
  padding:12px 14px;
  border:1px solid var(--line2);
  background:var(--panel);
  transition:border-color 0.25s, background 0.25s;
}
.alarm .state {
  font-family:var(--fd);
  font-size:30px;
  font-weight:700;
  letter-spacing:2px;
  line-height:1;
  text-transform:uppercase;
}
.alarm .adv {
  font-size:13px;
  color:var(--ink2);
  margin-top:6px;
  line-height:1.45;
}
.alarm[data-l="0"] {
  border-color:#1F4A36;
  background:linear-gradient(180deg,#10211A,#141B21);
}
.alarm[data-l="0"] .state { color:var(--good); }
.alarm[data-l="1"] {
  border-color:#5C4518;
  background:linear-gradient(180deg,#241C0C,#141B21);
}
.alarm[data-l="1"] .state { color:var(--warn); }
.alarm[data-l="2"] {
  border-color:#742B1E;
  background:linear-gradient(180deg,#2B0F0A,#141B21);
  animation:pulse 1.1s steps(2,end) infinite;
}
.alarm[data-l="2"] .state { color:var(--crit); }
@keyframes pulse {
  50% { border-color:var(--crit); background:linear-gradient(180deg,#45150D,#1A1115); }
}
@media (prefers-reduced-motion:reduce) {
  .alarm[data-l="2"] { animation:none; }
}

.tiles {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}
.tile {
  background:var(--panel);
  border:1px solid var(--line);
  border-left:3px solid var(--line2);
  border-radius:3px;
  padding:9px 10px;
}
.tile .k {
  font-family:var(--fd);
  font-size:12.5px;
  letter-spacing:1.3px;
  text-transform:uppercase;
  color:var(--ink3);
  line-height:1.1;
}
.tile .v {
  font-family:var(--fm);
  font-weight:600;
  font-size:21px;
  margin-top:3px;
  font-variant-numeric:tabular-nums;
}
.tile .u {
  font-family:var(--fm);
  font-size:11px;
  color:var(--ink3);
  margin-left:3px;
}
.tile .lim {
  font-family:var(--fm);
  font-size:10.5px;
  color:var(--ink3);
  margin-top:2px;
}
.tile[data-l="0"] { border-left-color:var(--good); }
.tile[data-l="0"] .v { color:var(--ink); }
.tile[data-l="1"] { border-left-color:var(--warn); }
.tile[data-l="1"] .v { color:var(--warn); }
.tile[data-l="2"] { border-left-color:var(--crit); }
.tile[data-l="2"] .v { color:var(--crit); }

.card {
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:3px;
  padding:11px 12px;
}
.card h2 {
  font-family:var(--fd);
  font-size:14px;
  letter-spacing:1.6px;
  text-transform:uppercase;
  color:var(--ink2);
  margin:0 0 9px;
  font-weight:600;
}
.pl {
  display:flex;
  align-items:center;
  gap:9px;
  margin-bottom:7px;
}
.pl .nm {
  font-family:var(--fd);
  font-size:13.5px;
  letter-spacing:1px;
  color:var(--ink2);
  width:92px;
  flex:none;
}
.pl .track {
  flex:1;
  height:11px;
  background:#0B1013;
  border:1px solid var(--line);
  border-radius:2px;
  overflow:hidden;
  min-width:0;
}
.pl .fill {
  height:100%;
  width:0%;
  background:var(--good);
  transition:width .1s linear, background .2s;
}
.pl .num {
  font-family:var(--fm);
  font-size:12.5px;
  width:62px;
  text-align:right;
  flex:none;
  font-variant-numeric:tabular-nums;
}
canvas#chart {
  display:block;
  width:100%;
  height:122px;
  cursor:crosshair;
}
.chartnote {
  font-family:var(--fm);
  font-size:10.5px;
  color:var(--ink3);
  margin-top:5px;
  min-height:14px;
}
ol.log {
  list-style:none;
  margin:0;
  padding:0;
  font-family:var(--fm);
  font-size:11.5px;
  line-height:1.55;
  max-height:132px;
  overflow-y:auto;
}
ol.log li {
  display:flex;
  gap:8px;
  padding:2px 0;
  border-bottom:1px solid #1B2229;
}
ol.log .ts {
  color:var(--ink3);
  flex:none;
}
ol.log .m {
  min-width:0;
  color:var(--ink2);
}
ol.log li[data-l="1"] .m { color:var(--warn); }
ol.log li[data-l="2"] .m { color:var(--crit); }

footer {
  margin-top:16px;
  border-top:1px solid var(--line);
  padding-top:10px;
  font-size:12px;
  color:var(--ink3);
  line-height:1.6;
}
footer b {
  color:var(--ink2);
  font-weight:500;
}
</style>
</head>
<body>

<div class="wrap">
  <header>
    <div class="brand">
      <h1>ForceSight</h1>
      <span class="sub">Virtual bench &amp; early-warning console</span>
    </div>
    <div class="tabs" role="tablist" aria-label="Scenario">
      <button id="tabGate" role="tab" aria-selected="true">Venue gate</button>
      <button id="tabBench" role="tab" aria-selected="false">Lab bench</button>
    </div>
  </header>

  <div class="grid">
    <section class="stage">
      <div class="toolbar" id="toolbar">
        <div class="ctl"><label for="inflow">Inflow</label><input type="range" id="inflow" min="0" max="10" step="0.2" value="3.6"><output id="inflowO">3.6/s</output></div>
        <div class="ctl"><label for="gate">Gate</label><input type="range" id="gate" min="0.7" max="3.0" step="0.1" value="1.1"><output id="gateO">1.1 m</output></div>
        <div class="ctl"><label for="press">Press</label><input type="range" id="press" min="0" max="100" step="1" value="0"><output id="pressO">0 %</output></div>
        <button class="btn" id="pillar" aria-pressed="false">Pillar</button>
        <button class="btn" id="viewBtn" aria-pressed="false">Camera view</button>
        <button class="btn danger" id="surge">Surge</button>
        <button class="btn danger" id="stop">Stop entry</button>
        <button class="btn" id="auto" aria-pressed="false">Auto-stop</button>
        <button class="btn" id="sound" aria-pressed="true">Sound</button>
        <button class="btn" id="reset">Reset</button>
      </div>
      <div class="canvaswrap"><canvas id="view"></canvas></div>
      <div class="ramp">
        <span>Force on one person</span>
        <div class="bar" id="rampBar"></div>
        <span id="rampLo">0 N</span><span style="color:var(--line2)">&rarr;</span><span id="rampHi">1500 N+</span>
        <span id="modeNote" style="margin-left:auto;color:var(--ink2)"></span>
      </div>
    </section>

    <aside class="rail">
      <div class="alarm" id="alarm" data-l="0" role="status" aria-live="polite">
        <div class="state" id="alarmState">Safe</div>
        <div class="adv" id="alarmAdv">Flow is free. Normal entry.</div>
      </div>

      <div class="tiles">
        <div class="tile" id="tDen" data-l="0"><div class="k">Density</div><div class="v"><span id="vDen">0.0</span><span class="u">/m&sup2;</span></div><div class="lim">amber 4 &middot; red 6</div></div>
        <div class="tile" id="tPk" data-l="0"><div class="k">Peak force, one person</div><div class="v"><span id="vPk">0</span><span class="u">N</span></div><div class="lim">amber 800 &middot; red 2550</div></div>
        <div class="tile" id="tPr" data-l="0"><div class="k">Peak &divide; average force</div><div class="v"><span id="vPr">0.0</span><span class="u">&times;</span></div><div class="lim">amber 3 &middot; red 5</div></div>
        <div class="tile" id="tFl" data-l="0"><div class="k" id="kFl">Through gate</div><div class="v"><span id="vFl">0</span><span class="u" id="uFl">/min</span></div><div class="lim" id="lFl">people leaving</div></div>
      </div>

      <div class="card">
        <h2 id="hwTitle">Barrier sensing panels</h2>
        <div class="pl"><span class="nm" id="p1n">P1 above gate</span><span class="track"><span class="fill" id="p1f"></span></span><span class="num" id="p1v">0.00 kN</span></div>
        <div class="pl"><span class="nm" id="p2n">P2 below gate</span><span class="track"><span class="fill" id="p2f"></span></span><span class="num" id="p2v">0.00 kN</span></div>
        <div class="pl" id="row3" style="margin-bottom:0"><span class="nm" id="p3n">Load cell total</span><span class="track"><span class="fill" id="p3f"></span></span><span class="num" id="p3v">0.00 kN</span></div>
      </div>

      <div class="card">
        <h2>Peak force on one person &middot; last 40 s</h2>
        <canvas id="chart"></canvas>
        <div class="chartnote" id="chartNote">Dashed line: 2550 N, the force at which ribs fracture.</div>
      </div>

      <div class="card">
        <h2>Event log</h2>
        <ol class="log" id="log"></ol>
      </div>
    </aside>
  </div>

  <footer>
    <b>What this is.</b> A live granular simulation. Each disc is one person, 0.42&ndash;0.52 m across, 60&ndash;85 kg. Contact forces use the Helbing social-force model (A&nbsp;=&nbsp;2000&nbsp;N, B&nbsp;=&nbsp;0.08&nbsp;m, k&nbsp;=&nbsp;1.2&times;10&#8309;&nbsp;kg/s&sup2;); each disc is shaded by the total contact force it carries, which is what the photoelastic bench shows as fringes. Peak &divide; average is the project’s own measure: crush injuries come from the worst-loaded person, not the average one. In the field the comparable published metric is crowd pressure, &rho;&nbsp;&times;&nbsp;Var(v), read from video (Helbing, Johansson &amp; Al-Abideen, 2007; turbulence above 0.02&nbsp;s&#8315;&sup2;). The 2550&nbsp;N rib-fracture figure is from Kroll et&nbsp;al. Thresholds are editable in the source and are set for teaching, not for operational use.
  </footer>
</div>

<script>
(function(){
"use strict";
var $ = function(id){ return document.getElementById(id); };
var view = $("view"), vx = view.getContext("2d");
var chart = $("chart"), cx = chart.getContext("2d");

/* ---------- constants ---------- */
var PH = {A:2000, B:0.08, KN:1.2e5, KT:2.4e5, TAU:0.5, G:0};
var TH = {den:[4,6], pk:[800,2550], pr:[3,5]};
var MAXV = 6, SUB = 8, FMAX = 24000;

/* isochromatic (photoelastic) colour sequence, by fringe order */
var ISO = [
  [0,10,13,16], [0.22,38,46,52], [0.42,120,126,124], [0.58,232,231,214],
  [0.78,241,214,113], [0.98,235,148,58], [1.14,206,70,58], [1.30,168,60,130],
  [1.46,68,92,186], [1.62,58,150,170], [1.82,92,176,110], [2.02,206,196,90],
  [2.24,224,140,70], [2.46,198,82,92], [2.68,120,96,176], [2.95,80,150,168]
];

function isoCol(n){
  if(n > 2.95){ n = 1.30 + ((n - 1.30) % 1.65); }
  for(var i = 1; i < ISO.length; i++){
    if(n <= ISO[i][0]){
      var a = ISO[i-1], b = ISO[i], t = (n - a[0]) / (b[0] - a[0]);
      return "rgb(" + Math.round(a[1] + (b[1] - a[1]) * t) + "," +
                      Math.round(a[2] + (b[2] - a[2]) * t) + "," +
                      Math.round(a[3] + (b[3] - a[3]) * t) + ")";
    }
  }
  return "rgb(80,150,168)";
}

/* sequential amber ramp on dark, for the plain force view */
function forceCol(u){
  u = u < 0 ? 0 : u > 1 ? 1 : u;
  var s = [
    [0,24,33,41], [0.3,92,74,46], [0.62,206,150,56], [0.85,242,196,86], [1,255,236,170]
  ];
  for(var i = 1; i < s.length; i++){
    if(u <= s[i][0]){
      var a = s[i-1], b = s[i], t = (u - a[0]) / (b[0] - a[0]);
      return "rgb(" + Math.round(a[1] + (b[1] - a[1]) * t) + "," +
                      Math.round(a[2] + (b[2] - a[2]) * t) + "," +
                      Math.round(a[3] + (b[3] - a[3]) * t) + ")";
    }
  }
  return "rgb(255,236,170)";
}

/* ---------- state ---------- */
var S = {
  scene:"gate", agents:[], t:0, spawnAcc:0, inflow:3.6, gateW:1.1, pillar:false,
  press:0, photo:false, autoStop:false, sound:true, surgeT:0,
  escaped:0, escWin:[], panels:[0,0,0], lvl:0, log:[], hist:[], histAcc:0,
  plateY:0, pileTop:0,
  m:{den:0, pk:0, mean:0, pr:0, flow:0}
};
var SC = {};   /* scene geometry */

function sceneGate(){
  SC = {w:14, h:7, wallX:10.4, type:"gate"};
  SC.gy0 = (SC.h - S.gateW) / 2;
  SC.gy1 = (SC.h + S.gateW) / 2;
  SC.box = {x0:8.0, y0:1.5, x1:10.4, y1:5.5};
  SC.pillar = {x:9.35, y:SC.h/2 + 0.70, r:0.33};
}
function sceneBench(){
  SC = {w:8, h:7, type:"bench"};
  SC.box = {x0:0, y0:0, x1:8, y1:7};
}

function mkAgent(x, y){
  var r = 0.21 + Math.random() * 0.05;
  return {x:x, y:y, vx:0, vy:0, sx:0, sy:0, r:r, m:60 + Math.random() * 25, f:0, fx:0, fy:0};
}

var INITIAL_COUNT = __INITIAL_PARTICLES__;

function reset(){
  S.agents = []; S.t = 0; S.escaped = 0; S.escWin = []; S.spawnAcc = 0;
  S.hist = []; S.log = []; S.surgeT = 0; S.panels = [0,0,0]; S.lvl = 0;
  if(S.scene === "gate"){
    sceneGate();
    for(var i = 0; i < INITIAL_COUNT; i++){
      S.agents.push(mkAgent(0.4 + Math.random() * 7.4, 0.5 + Math.random() * (SC.h - 1)));
    }
  } else {
    sceneBench();
    /* a full cell, packed like a crowd: no in-plane gravity, the plate supplies the squeeze */
    var rb = 0.255, dx = 2 * rb + 0.004, dy = dx * 0.88, row = 0;
    for(var yy = 1.25; yy <= SC.h - rb; yy += dy){
      for(var xx = rb + 0.12 + (row % 2 ? dx / 2 : 0); xx <= SC.w - rb - 0.12; xx += dx){
        var ag = mkAgent(xx + (Math.random() - 0.5) * 0.03, yy + (Math.random() - 0.5) * 0.03);
        ag.r = (row + Math.round(xx / dx)) % 3 === 2 ? 0.185 : rb;
        S.agents.push(ag);
      }
      row++;
    }
    S.plateY = -2;
    for(var k = 0; k < 80; k++) step(1/160);
    S.pileTop = SC.h;
    for(var q = 0; q < S.agents.length; q++){
      var a2 = S.agents[q];
      if(a2.y - a2.r < S.pileTop) S.pileTop = a2.y - a2.r;
    }
    S.plateY = S.pileTop - 0.02;
    S.press = 0;
    $("press").value = 0;
    $("pressO").textContent = "0 %";
  }
  pushLog(0, "Simulation reset. " + (S.scene === "gate" ? "Venue gate scenario." : "Lab bench scenario."));
  renderLog();
}

/* ---------- geometry helpers ---------- */
function segs(){
  if(SC.type === "gate") return [
    [0, 0, SC.w, 0], [0, SC.h, SC.w, SC.h], [0, 0, 0, SC.h],
    [SC.wallX, 0, SC.wallX, SC.gy0], [SC.wallX, SC.gy1, SC.wallX, SC.h]
  ];
  return [
    [0, 0, 0, SC.h], [SC.w, 0, SC.w, SC.h], [0, SC.h, SC.w, SC.h], [0, S.plateY, SC.w, S.plateY]
  ];
}

/* ---------- physics ---------- */
function step(dt){
  var A = S.agents, n = A.length, i, j, a, b;
  var cell = 0.62, gw = Math.ceil(SC.w / cell) + 1, gh = Math.ceil(SC.h / cell) + 1, grid = {};
  for(i = 0; i < n; i++){
    a = A[i]; a.fx = 0; a.fy = 0; a.f = 0;
    var gi = ((a.x / cell) | 0) * gh + ((a.y / cell) | 0);
    (grid[gi] || (grid[gi] = [])).push(i);
  }
  var v0 = (SC.type === "gate") ? (S.surgeT > 0 ? 2.6 : 1.05) : 0;
  var sg = segs();

  for(i = 0; i < n; i++){
    a = A[i];
    if(SC.type === "gate"){
      var ty, tx;
      if(a.x < SC.wallX - 0.25){
        tx = SC.wallX + 0.1;
        ty = Math.min(Math.max(a.y, SC.gy0 + 0.22), SC.gy1 - 0.22);
      } else {
        tx = SC.wallX + 5;
        ty = a.y;
      }
      var dx = tx - a.x, dy = ty - a.y, dl = Math.hypot(dx, dy) || 1;
      a.fx += a.m * (v0 * dx / dl - a.vx) / PH.TAU;
      a.fy += a.m * (v0 * dy / dl - a.vy) / PH.TAU;
      if(S.pillar){
        var px = a.x - SC.pillar.x, py = a.y - SC.pillar.y, pd = Math.hypot(px, py) || 1, pg = pd - a.r - SC.pillar.r;
        var pf = Math.min(PH.A * Math.exp(-pg / PH.B), 5 * PH.A);
        a.fx += pf * px / pd;
        a.fy += pf * py / pd;
        if(pg < 0){
          var pc = Math.min(PH.KN * (-pg), FMAX);
          a.fx += pc * px / pd;
          a.fy += pc * py / pd;
          a.f += pc;
        }
      }
    } else {
      a.fy += a.m * PH.G; /* the applied push dominates */
    }

    var cxi = (a.x / cell) | 0, cyi = (a.y / cell) | 0;
    for(var ox = -1; ox <= 1; ox++){
      for(var oy = -1; oy <= 1; oy++){
        var lst = grid[(cxi + ox) * gh + (cyi + oy)];
        if(!lst) continue;
        for(var q = 0; q < lst.length; q++){
          j = lst[q];
          if(j <= i) continue;
          b = A[j];
          var ddx = a.x - b.x, ddy = a.y - b.y, d = Math.hypot(ddx, ddy);
          if(d > 1.6 || d === 0) continue;
          var nx = ddx / d, ny = ddy / d, gap = d - (a.r + b.r);
          var fs = Math.min(PH.A * Math.exp(-gap / PH.B), 5 * PH.A);
          var fnx = fs * nx, fny = fs * ny;
          if(gap < 0){
            var fc = Math.min(PH.KN * (-gap), FMAX);
            fnx += fc * nx;
            fny += fc * ny;
            var tx2 = -ny, ty2 = nx, dvt = (b.vx - a.vx) * tx2 + (b.vy - a.vy) * ty2;
            var ft = Math.min(PH.KT * (-gap) * dvt, FMAX);
            fnx += ft * tx2;
            fny += ft * ty2;
            a.f += fc;
            b.f += fc;
          }
          a.fx += fnx; a.fy += fny;
          b.fx -= fnx; b.fy -= fny;
        }
      }
    }

    for(var s = 0; s < sg.length; s++){
      var S0 = sg[s], ax = S0[0], ay = S0[1], bx = S0[2], by = S0[3];
      var ex = bx - ax, ey = by - ay, L2 = ex * ex + ey * ey || 1;
      var u = ((a.x - ax) * ex + (a.y - ay) * ey) / L2;
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      var qx = ax + u * ex, qy = ay + u * ey, wx = a.x - qx, wy = a.y - qy, wd = Math.hypot(wx, wy);
      if(wd > 1.0) continue;
      if(wd === 0){ wd = 0.001; wx = 0.001; }
      var wn = a.r - wd;
      var wf = Math.min(PH.A * Math.exp(wn / PH.B), 5 * PH.A);
      a.fx += wf * wx / wd;
      a.fy += wf * wy / wd;
      if(wn > 0){
        var wc = Math.min(PH.KN * wn, FMAX);
        a.fx += wc * wx / wd;
        a.fy += wc * wy / wd;
        a.f += wc;
        if(SC.type === "gate" && ax === SC.wallX){
          if(qy < SC.gy0) S.panels[0] += wc * dt; else S.panels[1] += wc * dt;
        } else if(SC.type === "bench"){
          if(ay === S.plateY && by === S.plateY) S.panels[0] += wc * dt;
          else if(ay === SC.h && by === SC.h) S.panels[1] += wc * dt;
        }
      }
    }
  }

  for(i = 0; i < n; i++){
    a = A[i];
    a.vx += a.fx / a.m * dt;
    a.vy += a.fy / a.m * dt;
    var sp = Math.hypot(a.vx, a.vy);
    if(sp > MAXV){ a.vx *= MAXV / sp; a.vy *= MAXV / sp; }
    var sk = Math.min(1, dt / 0.9);
    a.sx += (a.vx - a.sx) * sk;
    a.sy += (a.vy - a.sy) * sk;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if(a.x < 0.05) a.x = 0.05;
    if(a.y < -3) a.y = -3;
    if(a.y > SC.h + 3) a.y = SC.h + 3;
  }

  if(SC.type === "gate"){
    for(i = A.length - 1; i >= 0; i--){
      if(A[i].x > SC.w - 0.4){
        A.splice(i, 1);
        S.escaped++;
        S.escWin.push(S.t);
      }
    }
  }
}

/* ---------- metrics ---------- */
function measure(dtReal){
  var bx = SC.box, A = S.agents, sum = 0, n = 0, pk = 0, i, a;
  for(i = 0; i < A.length; i++){
    a = A[i];
    if(a.x >= bx.x0 && a.x <= bx.x1 && a.y >= bx.y0 && a.y <= bx.y1){
      n++; sum += a.f;
      if(a.f > pk) pk = a.f;
    }
  }
  var area = (bx.x1 - bx.x0) * (bx.y1 - bx.y0), den = n / area;
  var mean = n ? sum / n : 0, ratio = mean > 20 ? pk / mean : 0;
  var k = 1 - Math.exp(-dtReal / 0.45);
  S.m.den += (den - S.m.den) * k;
  S.m.pk += (pk - S.m.pk) * k;
  S.m.mean += (mean - S.m.mean) * k;
  S.m.pr += (ratio - S.m.pr) * k;
  while(S.escWin.length && S.escWin[0] < S.t - 10) S.escWin.shift();
  S.m.flow = S.escWin.length * 6;
}

function lvlOf(v, t){ return v >= t[1] ? 2 : v >= t[0] ? 1 : 0; }

/* ---------- audio ---------- */
var AC = null;
function beep(){
  if(!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if(AC.state === "suspended") AC.resume();
    for(var i = 0; i < 2; i++){
      var o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + i * 0.22;
      o.type = "square";
      o.frequency.setValueAtTime(880, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.17);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0);
      o.stop(t0 + 0.2);
    }
  } catch(e){}
}

/* ---------- log ---------- */
function clock(){
  var s = Math.floor(S.t);
  return ("0" + Math.floor(s / 60) % 60).slice(-2) + ":" + ("0" + s % 60).slice(-2);
}

function pushLog(l, m){
  S.log.unshift({t:clock(), l:l, m:m});
  if(S.log.length > 40) S.log.pop();
}

function renderLog(){
  var h = "";
  for(var i = 0; i < Math.min(S.log.length, 12); i++){
    var e = S.log[i];
    h += '<li data-l="' + e.l + '"><span class="ts">' + e.t + '</span><span class="m">' + e.m + '</span></li>';
  }
  $("log").innerHTML = h;
}

/* ---------- drawing ---------- */
var DPR = 1, VW = 0, VH = 0;
function fit(c){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  var r = c.getBoundingClientRect();
  c.width = Math.max(1, Math.round(r.width * DPR));
  c.height = Math.max(1, Math.round(r.height * DPR));
  return r;
}

function draw(){
  var r = view.getBoundingClientRect();
  VW = r.width; VH = r.height;
  if(!(VW > 40 && VH > 40)) return;
  if(view.width !== Math.round(VW * DPR) || view.height !== Math.round(VH * DPR)) fit(view);
  var g = vx;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.fillStyle = S.photo ? "#05070A" : "#080B0D";
  g.fillRect(0, 0, VW, VH);

  var pad = 14, sc = Math.max(0.5, Math.min((VW - pad * 2) / SC.w, (VH - pad * 2) / SC.h));
  var ox = (VW - SC.w * sc) / 2, oy = (VH - SC.h * sc) / 2;
  function X(x){ return ox + x * sc; }
  function Y(y){ return oy + y * sc; }

  if(!S.photo){
    g.strokeStyle = "#111a20";
    g.lineWidth = 1;
    g.beginPath();
    for(var gx = 0; gx <= SC.w; gx++){ g.moveTo(X(gx), Y(0)); g.lineTo(X(gx), Y(SC.h)); }
    for(var gy = 0; gy <= SC.h; gy++){ g.moveTo(X(0), Y(gy)); g.lineTo(X(SC.w), Y(gy)); }
    g.stroke();
  }

  /* arena floor */
  g.fillStyle = S.photo ? "#04070B" : "#0B1116";
  g.fillRect(X(0), Y(0), SC.w * sc, SC.h * sc);
  g.strokeStyle = "#1E2A33";
  g.lineWidth = 1;
  g.strokeRect(X(0), Y(0), SC.w * sc, SC.h * sc);

  /* measurement zone */
  if(!S.photo){
    g.setLineDash([5, 4]);
    g.strokeStyle = "#2E4654";
    g.lineWidth = 1;
    g.strokeRect(X(SC.box.x0), Y(SC.box.y0), (SC.box.x1 - SC.box.x0) * sc, (SC.box.y1 - SC.box.y0) * sc);
    g.setLineDash([]);
    g.fillStyle = "#4B6472";
    g.font = "600 10px 'IBM Plex Mono',monospace";
    g.fillText("MEASUREMENT ZONE", X(SC.box.x0), Y(SC.box.y0) - 6);
  }

  /* walls + hardware */
  var pmax = 4000;
  if(SC.type === "gate"){
    g.lineCap = "butt";
    g.strokeStyle = "#55646F";
    g.lineWidth = Math.max(4, 0.16 * sc);
    g.beginPath();
    g.moveTo(X(SC.wallX), Y(0)); g.lineTo(X(SC.wallX), Y(SC.gy0));
    g.moveTo(X(SC.wallX), Y(SC.gy1)); g.lineTo(X(SC.wallX), Y(SC.h));
    g.stroke();

    /* sensing panels on the crowd-facing side */
    var pl = [[SC.gy0 - 2.2, SC.gy0, S.panels[0]], [SC.gy1, SC.gy1 + 2.2, S.panels[1]]];
    for(var p = 0; p < 2; p++){
      var u = Math.min(pl[p][2] / pmax, 1);
      g.fillStyle = u > 0.62 ? "#D4513A" : u > 0.25 ? "#D9A33C" : "#3E9E6B";
      g.globalAlpha = 0.25 + 0.75 * u;
      g.fillRect(X(SC.wallX) - Math.max(5, 0.12 * sc) - 2, Y(pl[p][0]), Math.max(5, 0.12 * sc), (pl[p][1] - pl[p][0]) * sc);
      g.globalAlpha = 1;
    }
    if(S.pillar){
      g.fillStyle = "#3C4A54";
      g.strokeStyle = "#6C7D88";
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(X(SC.pillar.x), Y(SC.pillar.y), Math.max(0.5, SC.pillar.r * sc), 0, 6.2832);
      g.fill();
      g.stroke();
    }
    g.fillStyle = "#3E9E6B";
    g.font = "600 11px 'IBM Plex Mono',monospace";
    g.fillText("EXIT →", X(SC.wallX) + 8, Y(SC.h / 2) + 4);
  } else {
    g.strokeStyle = "#55646F";
    g.lineWidth = Math.max(4, 0.12 * sc);
    g.beginPath();
    g.moveTo(X(0), Y(0)); g.lineTo(X(0), Y(SC.h));
    g.lineTo(X(SC.w), Y(SC.h)); g.lineTo(X(SC.w), Y(0));
    g.stroke();

    g.fillStyle = "#8C8678";
    g.fillRect(X(0.1), Y(S.plateY) - Math.max(6, 0.14 * sc), (SC.w - 0.2) * sc, Math.max(6, 0.14 * sc));
    g.fillStyle = "#6E747D";
    g.font = "600 10px 'IBM Plex Mono',monospace";
    g.fillText("PRESS PLATE", X(0.25), Y(S.plateY) - Math.max(10, 0.18 * sc));

    var uu = Math.min(S.panels[1] / 30000, 1);
    g.fillStyle = uu > 0.62 ? "#D4513A" : uu > 0.25 ? "#D9A33C" : "#3E9E6B";
    g.globalAlpha = 0.3 + 0.7 * uu;
    g.fillRect(X(0), Y(SC.h) + 3, SC.w * sc, Math.max(5, 0.1 * sc));
    g.globalAlpha = 1;
    g.fillStyle = "#6E747D";
    g.fillText("LOAD CELL", X(0.25), Y(SC.h) + Math.max(18, 0.1 * sc + 16));
  }

  /* agents */
  var A = S.agents, FS = 400;
  for(var i = 0; i < A.length; i++){
    var a = A[i], rr = Math.max(0.5, a.r * sc);
    if(S.photo){ g.fillStyle = isoCol(a.f / FS); }
    else { g.fillStyle = forceCol(a.f / 1500); }
    g.beginPath();
    g.arc(X(a.x), Y(a.y), rr, 0, 6.2832);
    g.fill();
    if(!S.photo){
      g.strokeStyle = "rgba(10,14,18,.85)";
      g.lineWidth = 1;
      g.stroke();
    } else if(rr > 5){
      g.strokeStyle = "rgba(0,0,0,.55)";
      g.lineWidth = 1;
      g.stroke();
    }
  }

  if(S.surgeT > 0){
    g.fillStyle = "rgba(212,81,58,.1)";
    g.fillRect(X(0), Y(0), SC.w * sc, SC.h * sc);
    g.fillStyle = "#D4513A";
    g.font = "700 13px 'Barlow Condensed',sans-serif";
    g.fillText("SURGE FROM THE BACK", X(0.35), Y(0) + 20);
  }
}

/* ---------- chart ---------- */
var hoverX = null;
function drawChart(){
  var r = chart.getBoundingClientRect(), w = r.width, h = r.height;
  if(!(w > 60 && h > 40)) return;
  if(chart.width !== Math.round(w * DPR) || chart.height !== Math.round(h * DPR)){
    chart.width = Math.round(w * DPR);
    chart.height = Math.round(h * DPR);
  }
  var g = cx;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.clearRect(0, 0, w, h);
  var L = 34, R = 6, T = 8, B = 16, pw = w - L - R, ph = h - T - B;
  var ymax = 3000;
  for(var i = 0; i < S.hist.length; i++){
    if(S.hist[i].p > ymax) ymax = S.hist[i].p;
  }
  ymax = Math.ceil(ymax / 1000) * 1000;
  function Y(v){ return T + ph - (v / ymax) * ph; }
  function X(i){ return L + (i / 399) * pw; }

  g.strokeStyle = "#1D2932";
  g.lineWidth = 1;
  g.fillStyle = "#5A6B76";
  g.font = "10px 'IBM Plex Mono',monospace";
  for(var t = 0; t <= ymax; t += ymax / 3){
    g.beginPath();
    g.moveTo(L, Y(t));
    g.lineTo(w - R, Y(t));
    g.stroke();
    g.fillText(Math.round(t / 1000 * 10) / 10 + "k", 2, Y(t) + 3);
  }

  g.setLineDash([4, 3]);
  g.strokeStyle = "#D4513A";
  g.beginPath();
  g.moveTo(L, Y(2550));
  g.lineTo(w - R, Y(2550));
  g.stroke();
  g.setLineDash([]);

  if(S.hist.length > 1){
    var off = 400 - S.hist.length;
    g.beginPath();
    g.moveTo(X(off), Y(0));
    for(var k = 0; k < S.hist.length; k++){
      g.lineTo(X(off + k), Y(Math.min(S.hist[k].p, ymax)));
    }
    g.lineTo(X(399), Y(0));
    g.closePath();
    var grd = g.createLinearGradient(0, T, 0, T + ph);
    grd.addColorStop(0, "rgba(79,179,217,.26)");
    grd.addColorStop(1, "rgba(79,179,217,.02)");
    g.fillStyle = grd;
    g.fill();

    g.beginPath();
    for(var k2 = 0; k2 < S.hist.length; k2++){
      var px = X(off + k2), py = Y(Math.min(S.hist[k2].p, ymax));
      k2 ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.strokeStyle = "#4FB3D9";
    g.lineWidth = 2;
    g.lineJoin = "round";
    g.stroke();

    var lastPoint = S.hist[S.hist.length - 1];
    g.fillStyle = "#4FB3D9";
    g.beginPath();
    g.arc(X(399), Y(Math.min(lastPoint.p, ymax)), 4, 0, 6.2832);
    g.fill();
    g.strokeStyle = "#141B21";
    g.lineWidth = 2;
    g.stroke();

    if(hoverX !== null){
      var idx = Math.round((hoverX - L) / pw * 399);
      var hi = idx - off;
      if(hi >= 0 && hi < S.hist.length){
        var hx = X(idx), hy = Y(Math.min(S.hist[hi].p, ymax));
        g.strokeStyle = "#3A4A56";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(hx, T);
        g.lineTo(hx, T + ph);
        g.stroke();
        g.fillStyle = "#E8EFF4";
        g.beginPath();
        g.arc(hx, hy, 3.5, 0, 6.2832);
        g.fill();
        $("chartNote").textContent = (S.hist[hi].t).toFixed(0) + " s — peak " + Math.round(S.hist[hi].p) + " N · average " + Math.round(S.hist[hi].m) + " N · ratio " + (S.hist[hi].m > 5 ? (S.hist[hi].p / S.hist[hi].m).toFixed(1) : "–") + "×";
      }
    }
  }
}

chart.addEventListener("mousemove", function(e){ hoverX = e.offsetX; });
chart.addEventListener("mouseleave", function(){
  hoverX = null;
  $("chartNote").textContent = "Dashed line: 2550 N, the force at which ribs fracture.";
});

/* ---------- UI ---------- */
var ADV = [
  ["Safe", "Flow is free. Normal entry."],
  ["Caution", "Compression building. Hold entry and widen the gate."],
  ["Danger", "Stop entry now. Do not push the queue forward."]
];
var ADVB = [
  ["Light", "Barely loaded. No chains have formed yet."],
  ["Loaded", "Chains forming. A few discs carry most of the push."],
  ["Crushing", "One disc is past the rib-fracture force. This is the crowd-crush regime."]
];

function ui(){
  var ld = lvlOf(S.m.den, TH.den), lp = lvlOf(S.m.pk, TH.pk), lr = S.m.pk > 200 ? lvlOf(S.m.pr, TH.pr) : 0;
  var L = Math.max(ld, lp, lr);
  $("tDen").setAttribute("data-l", ld); $("vDen").textContent = S.m.den.toFixed(1);
  $("tPk").setAttribute("data-l", lp);  $("vPk").textContent = Math.round(S.m.pk);
  $("tPr").setAttribute("data-l", lr);  $("vPr").textContent = S.m.pr.toFixed(1);
  $("vFl").textContent = SC.type === "gate" ? Math.round(S.m.flow) : Math.round(S.m.mean);
  var al = $("alarm");
  if(L !== S.lvl){
    var AD = SC.type === "gate" ? ADV : ADVB;
    al.setAttribute("data-l", L);
    $("alarmState").textContent = AD[L][0];
    $("alarmAdv").textContent = AD[L][1];
    var why = [];
    if(ld === L && L) why.push("density " + S.m.den.toFixed(1) + "/m²");
    if(lp === L && L) why.push("peak " + Math.round(S.m.pk) + " N");
    if(lr === L && L) why.push("one person taking " + S.m.pr.toFixed(1) + "× the average");
    pushLog(L, (L === 2 ? "DANGER — " : L === 1 ? "CAUTION — " : "Cleared — ") + (why.length ? why.join(", ") : "all metrics normal"));
    if(L === 2){
      beep();
      if(S.autoStop && S.inflow > 0){
        S.inflow = 0;
        $("inflow").value = 0;
        $("inflowO").textContent = "0.0/s";
        pushLog(2, "AUTO-STOP: entry closed by the system.");
      }
    }
    renderLog();
    S.lvl = L;
  }

  if(SC.type === "gate") S.panels[2] = S.panels[0] + S.panels[1];
  var pm = SC.type === "gate" ? [4000, 4000, 8000] : [30000, 30000, 1];
  for(var p = 0; p < 3; p++){
    var u = Math.min(S.panels[p] / pm[p], 1);
    $("p" + (p + 1) + "f").style.width = (u * 100).toFixed(1) + "%";
    $("p" + (p + 1) + "f").style.background = u > 0.62 ? "var(--crit)" : u > 0.25 ? "var(--warn)" : "var(--good)";
    $("p" + (p + 1) + "v").textContent = (S.panels[p] / 1000).toFixed(2) + " kN";
  }
}

/* ---------- loop ---------- */
var last = 0;
function frame(ts){
  var dt = Math.min((ts - last) / 1000 || 0.016, 1 / 25);
  last = ts;
  if(S.surgeT > 0) S.surgeT -= dt;
  S.panels = [0, 0, 0];
  var sub = dt / SUB;
  for(var i = 0; i < SUB; i++){
    if(SC.type === "gate"){
      S.spawnAcc += S.inflow * sub;
      while(S.spawnAcc >= 1 && S.agents.length < 240){
        S.spawnAcc -= 1;
        S.agents.push(mkAgent(0.35 + Math.random() * 0.5, 0.5 + Math.random() * (SC.h - 1.0)));
      }
      if(S.spawnAcc > 1) S.spawnAcc = 1;
    }
    step(sub);
    S.t += sub;
  }
  for(var p = 0; p < 3; p++) S.panels[p] /= dt;
  measure(dt);
  S.histAcc += dt;
  if(S.histAcc > 0.1){
    S.histAcc = 0;
    S.hist.push({t:S.t, p:S.m.pk, m:S.m.mean});
    if(S.hist.length > 400) S.hist.shift();
  }
  draw();
  drawChart();
  ui();
  requestAnimationFrame(frame);
}

/* ---------- controls ---------- */
function mode(){
  var gate = S.scene === "gate";
  $("inflow").parentNode.style.display = gate ? "" : "none";
  $("gate").parentNode.style.display = gate ? "" : "none";
  $("press").parentNode.style.display = gate ? "none" : "";
  $("pillar").style.display = gate ? "" : "none";
  $("surge").style.display = gate ? "" : "none";
  $("stop").style.display = gate ? "" : "none";
  $("auto").style.display = gate ? "" : "none";
  $("hwTitle").textContent = gate ? "Barrier sensing panels" : "Bench hardware";
  $("p1n").textContent = gate ? "P1 above gate" : "Press plate";
  $("p2n").textContent = gate ? "P2 below gate" : "Floor reaction";
  $("p3n").textContent = "P1 + P2 total";
  $("row3").hidden = !gate;
  $("kFl").textContent = gate ? "Through gate" : "Average force";
  $("uFl").textContent = gate ? "/min" : "N";
  $("lFl").textContent = gate ? "people leaving" : "mean over all discs";
  $("modeNote").textContent = S.photo ? "Camera view: colours are photoelastic fringe orders" : "Plan view: brightness is force carried";
  $("rampBar").style.background = S.photo
    ? "linear-gradient(90deg," + isoCol(0) + "," + isoCol(0.6) + "," + isoCol(1.0) + "," + isoCol(1.5) + "," + isoCol(2.1) + "," + isoCol(2.7) + ")"
    : "linear-gradient(90deg," + forceCol(0) + "," + forceCol(.35) + "," + forceCol(.7) + "," + forceCol(1) + ")";
}

$("inflow").oninput = function(){
  S.inflow = +this.value;
  $("inflowO").textContent = (+this.value).toFixed(1) + "/s";
};
$("gate").oninput = function(){
  S.gateW = +this.value;
  $("gateO").textContent = (+this.value).toFixed(1) + " m";
  SC.gy0 = (SC.h - S.gateW) / 2;
  SC.gy1 = (SC.h + S.gateW) / 2;
};
$("press").oninput = function(){
  S.press = +this.value;
  $("pressO").textContent = this.value + " %";
  S.plateY = S.pileTop - 0.04 + (S.press / 100) * 0.50;
};
$("pillar").onclick = function(){
  S.pillar = !S.pillar;
  this.setAttribute("aria-pressed", S.pillar);
  pushLog(0, S.pillar ? "Pillar placed 1.0 m before the gate." : "Pillar removed.");
  renderLog();
};
$("viewBtn").onclick = function(){
  S.photo = !S.photo;
  this.setAttribute("aria-pressed", S.photo);
  this.textContent = S.photo ? "Plan view" : "Camera view";
  mode();
};
$("surge").onclick = function(){
  S.surgeT = 4;
  beep();
  pushLog(2, "Surge: people at the back pushed forward.");
  renderLog();
};
$("stop").onclick = function(){
  S.inflow = 0;
  $("inflow").value = 0;
  $("inflowO").textContent = "0.0/s";
  pushLog(2, "MARSHAL: entry stopped by hand.");
  renderLog();
};
$("auto").onclick = function(){
  S.autoStop = !S.autoStop;
  this.setAttribute("aria-pressed", S.autoStop);
};
$("sound").onclick = function(){
  S.sound = !S.sound;
  this.setAttribute("aria-pressed", S.sound);
  if(S.sound) beep();
};
$("reset").onclick = function(){ reset(); };

function tab(which){
  S.scene = which;
  $("tabGate").setAttribute("aria-selected", which === "gate");
  $("tabBench").setAttribute("aria-selected", which === "bench");
  reset();
  mode();
}
$("tabGate").onclick = function(){ tab("gate"); };
$("tabBench").onclick = function(){ tab("bench"); };

fit(view);
reset();
mode();
requestAnimationFrame(function(t){
  last = t;
  requestAnimationFrame(frame);
});
window.addEventListener("resize", function(){ fit(view); });
})();
</script>
</body>
</html>
"""
    return html_template.replace("__INITIAL_PARTICLES__", str(initial_particles))
