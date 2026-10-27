# ForceSight

## What This Is

ForceSight is a proactive computer vision and predictive crowd stress simulation system engineered to eliminate crowd surges, stampedes, and crushing incidents at structural bottlenecks (gates, barricades, turnstiles, and narrow passageways). It pioneers a **Digital Photoelastic Simulation**—using OpenCV optical flow and crowd density analytics to mimic how physical stress alters chromatic fringes in photoelastic materials under polarized light. The crowd video actively shifts colors (blue ➔ yellow ➔ deep red) in high-stress zones, quantifying localized crush risk through a standardized **Peak Stress Index (0 to 100)** so security marshals have an indisputable, glanceable early-warning dashboard to throttle ingress before dangerous thresholds are reached.

## Core Value

Making invisible crowd stress visible in real time through a Digital Photoelastic Heatmap and Peak Stress Index (0–100), giving security marshals indisputable, early-warning visual justification to throttle or divert crowds before dangerous physical crushes develop.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Ingest and process local benchmark video files (crowd test footage) frame-by-frame
- [ ] Run computer vision model (YOLO / head detection) to extract crowd density and spatial occupancy
- [ ] Calculate inter-frame motion vectors and velocity turbulence using OpenCV optical flow
- [ ] Compute the **Peak Stress Index (PSI: 0–100)** combining density and optical flow kinetic energy
- [ ] Render a real-time **Digital Photoelastic Heatmap Overlay** that dynamically shifts chromatic fringes (cool blue ➔ yellow ➔ deep crimson) over high-stress regions
- [ ] Provide a glanceable operator dashboard with PSI risk gauges (Nominal 0–49, Warning 50–74, Critical 75–100)
- [ ] Trigger high-contrast visual alert banners with concrete gate-throttling recommendations when PSI exceeds safety thresholds

### Out of Scope

- Hardware load-cell pressure simulation / kg measurements — replaced by pure computer vision Peak Stress Index (0–100)
- Live multi-camera RTSP / CCTV hardware streaming — deferred to pilot field trial phase (MVP uses local benchmark files)
- Automated physical barrier/gate interlocking — safety requires human marshal in the loop
- Mobile app / SMS push notifications — MVP is focused on a centralized gate marshal workstation

## Context

- **Team & Institution**: Developed by Bandi Sidhartha Reddy (Lead Developer) and Pavan Sai, Department of Computer Science and Engineering, VNR Vignana Jyothi Institute of Engineering and Technology (VNRVJIET), Hyderabad.
- **Problem Space**: At densities exceeding 4–5 people/m², crowd compressive force transfers mechanically across bodies like a shockwave. Compressive asphyxia occurs rapidly while the crowd appears calm on the periphery.
- **Primary Persona**: Karthik Reddy, 32-year-old security guard managing main entry gates at large events (college fests, sports events, concerts, and temple gatherings).
- **Scientific Analogy**: Digital Photoelasticity — photoelastic materials display colorful fringe bands under mechanical stress when viewed through polarized filters. ForceSight translates crowd density and optical flow velocity gradients into continuous chromatic stress fields directly on the video feed.

## Constraints

- **Input Modality**: Local pre-recorded benchmark video files (.mp4/.avi)
- **Modeling**: OpenCV Farnebäck / Lucas-Kanade optical flow + spatial density mapping feeding the 0–100 Peak Stress Index
- **Visuals**: Continuous photoelastic chromatic gradient (blue ➔ yellow ➔ deep red) blended onto video frames (no crude bounding boxes)
- **Interface**: Web dashboard (Streamlit) for real-time visualization

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Peak Stress Index (0–100) over kg pressure | Eliminates arbitrary/unverifiable load cell kg claims; provides an intuitive, normalized 0–100 safety scale | ✓ Good |
| Digital Photoelastic Simulation | Directly mimics physical stress birefringence (blue ➔ yellow ➔ crimson), providing an organic, glanceable visualization of stress shockwaves | ✓ Good |
| OpenCV Optical Flow + Density | Combines spatial compression (density) with kinetic agitation (velocity variance) to detect turbulent crowd shockwaves | ✓ Good |

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
*Last updated: October 27, 2026 after initialization (Photoelastic Simulation pivot)*
