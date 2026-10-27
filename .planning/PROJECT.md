# ForceSight

## What This Is

ForceSight is a proactive computer vision and predictive crowd pressure simulation system engineered to eliminate crowd surges, stampedes, and crushing incidents at structural bottlenecks (gates, barricades, turnstiles, and narrow passageways). It translates video crowd density analytics into an estimated mechanical force metric (kg) in real time, providing security marshals with a glanceable, color-coded early-warning dashboard to throttle ingress or divert crowds before dangerous thresholds are reached.

## Core Value

Making invisible crowd compressive force visible in real time to give security personnel indisputable, early-warning justification to throttle or divert crowds before dangerous crushes develop.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Ingest and process local benchmark video files (crowd test footage) frame-by-frame
- [ ] Run computer vision model to detect crowd density and head counts across spatial grid regions
- [ ] Compute mechanical compressive force metrics (kg / kg/m²) using empirical crowd physics equations
- [ ] Render a real-time, color-coded force heatmap overlay on the video feed
- [ ] Provide a glanceable operator dashboard with risk gauges (Safe, Warning, Critical)
- [ ] Trigger audible and visual throttle alerts when force approaches critical safety thresholds (e.g. >250 kg)

### Out of Scope

- Live multi-camera RTSP / CCTV hardware streaming — deferred to pilot field trial phase (MVP uses local benchmark files)
- Automated physical barrier/gate interlocking — safety requires human marshal in the loop
- Mobile app / SMS push notifications — MVP is focused on a centralized gate marshal workstation

## Context

- **Team & Institution**: Developed by Bandi Sidhartha Reddy (Lead Developer) and Pavan Sai, Department of Computer Science and Engineering, VNR Vignana Jyothi Institute of Engineering and Technology (VNRVJIET), Hyderabad.
- **Problem Space**: At densities exceeding 4–5 people/m², crowd compressive force transfers mechanically across bodies like a shockwave. People at the front can experience fatal compressive asphyxia at loads upwards of 250–400 kg while the crowd appears calm on the periphery.
- **Primary Persona**: Karthik Reddy, 32-year-old security guard managing main entry gates at large events (college fests, sports events, concerts, and temple gatherings).

## Constraints

- **Input Modality**: Local pre-recorded benchmark video files — isolates algorithm evaluation from camera streaming infrastructure
- **Modeling**: CV head/density detection combined with empirical crowd mechanics formulas
- **Interface**: Web dashboard (e.g., Streamlit / React + Python backend) for real-time visualization

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local video benchmark input | Eliminates external streaming complexity for MVP; standardizes testing against known crowd scenarios | — Pending |
| CV density + crowd physics force equation | Provides explainable, metric-driven mechanical pressure (kg) grounded in empirical human crowd dynamics | — Pending |
| Glanceable web dashboard with visual gauges | Gives gate marshals instant, unambiguous justification to throttle gates without second-guessing | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: October 27, 2026 after initialization*
