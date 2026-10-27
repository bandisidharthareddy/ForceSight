# Feature Research

**Domain:** Computer Vision Crowd Density & Compressive Force Analytics
**Researched:** October 27, 2026
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features security marshals and safety coordinators assume exist. Missing these makes the system incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Video File Ingestion & Playback | System must load and step through pre-recorded crowd bottleneck footage. | LOW | Support `.mp4`, `.avi` with play, pause, seek, and loop controls. |
| Real-Time Person / Head Detection | Visual bounding boxes or centroid markers confirming crowd is recognized. | MEDIUM | YOLO-based person/head detection tuned for downward/angled views. |
| Crowd Density Calculation (p/m²) | Standard metric used by event safety guidelines worldwide. | MEDIUM | Spatial grid counting mapped to calibrated square meters. |
| Mechanical Force Estimation (kg) | The core value proposition of ForceSight: converting density + motion into compressive force. | MEDIUM | Based on Helbing crowd pressure formulations and static body mass load transfer. |
| Glanceable Safety Status Gauges | Quick Green/Yellow/Red visual status for immediate situational awareness. | LOW | Color-coded status meter (Safe <150kg, Warning 150-250kg, Critical >250kg). |
| Visual Alert Banners & Warnings | Prominent warnings instructing the marshal to "THROTTLE GATE" or "HALT INGRESS". | LOW | Instant visual banner displayed over dashboard and video stream. |

### Differentiators (Competitive Advantage)

Features that set ForceSight apart from traditional CCTV crowd counters.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Compressive Force Heatmap Overlay | Visualizes invisible force concentrations directly on top of video frames using a dynamic thermal color spectrum (Blue -> Yellow -> Crimson). | MEDIUM | Gaussian density field weighted by velocity variance and directional crowd vectors. |
| Bottleneck Chokepoint ROI Selection | Allows the operator to define specific gate/turnstile choke zones (polygonal regions of interest). | MEDIUM | Focuses force calculations where crushing occurs rather than harmless open plazas. |
| Force Surge Timeline & Trend Plotting | Shows the derivative of pressure ($dP/dt$) to flag sudden shockwaves before peak force is hit. | LOW | Plotly rolling line graph of force over the past 30-60 seconds. |
| Simulated De-escalation Recommendation | Suggests concrete marshal actions (e.g. "Throttle ingress by 50%", "Divert Queue to Lane B"). | LOW | Rule-based decision logic tied to force thresholds and rate-of-climb. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for the MVP.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Automated Turnstile Interlocking | Eliminates human guard latency by locking gates automatically. | Major safety hazard: locking a gate during panic can trigger an immediate crush against the locked door. | Advisory throttle recommendations; keep human security marshal in the loop. |
| Facial Recognition / Individual ID | Tracks individual troublemakers in the crowd. | Severe privacy violations, high compute cost, irrelevant to fluid crowd crush mechanics. | Purely anonymous head/person detection and spatial heatmaps. |
| Complex 3D LiDAR / Multi-Sensor Fusion | High depth accuracy. | Expensive hardware barrier, requires specialized field installation not viable for rapid college fest adoption. | Standard RGB monocular video with 2D-to-ground homography calibration. |

## Feature Dependencies

```
[Video File Ingestion]
    └──requires──> [OpenCV Frame Decoder]
                        └──requires──> [YOLO Head/Person Detector]
                                            └──requires──> [Spatial Grid & Density Engine]
                                                                └──requires──> [Mechanical Force Model (kg)]
                                                                                    ├──feeds──> [Thermal Heatmap Overlay]
                                                                                    ├──feeds──> [Safety Gauge & Alert Banner]
                                                                                    └──feeds──> [Force Surge Timeline]
```

### Dependency Notes

- **Spatial Grid requires YOLO Detector:** Grid cell population relies on accurate detection centroids or bounding boxes.
- **Mechanical Force requires Spatial Density & Velocity:** Force calculation ($P = \rho \cdot \text{Var}(v)$) requires both local density ($\rho$) and inter-frame displacement vectors ($v$).
- **Heatmap & Gauges require Force Model:** Visual presentation layers cannot render until force values in kg are computed per grid cell.

## MVP Definition

### Launch With (v1)

- [ ] Video upload & playback engine for benchmark crowd clips (.mp4)
- [ ] YOLOv8/11 person detection pipeline with confidence threshold slider
- [ ] Spatial grid partition and local density estimation ($\text{persons/m}^2$)
- [ ] Compressive force calculation engine (outputting mechanical force in kg)
- [ ] Dynamic color-coded force heatmap overlay on video frames
- [ ] Real-time status gauge (Safe, Warning, Critical) with color indicators
- [ ] Visual alert banners with concrete gate throttle advisories

### Add After Validation (v1.x)

- [ ] Custom polygon ROI selector for interactive chokepoint definition
- [ ] Audio tone alerts for critical threshold breach
- [ ] Force trend graphs ($kg$ vs time) with rate-of-rise predictive warning

### Future Consideration (v2+)

- [ ] Live RTSP/IP camera streaming support
- [ ] Multi-camera handoff across consecutive chokepoints
- [ ] Mobile alert notifications for security marshals on perimeter patrol

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Video Ingestion & Playback | HIGH | LOW | P1 |
| YOLO Detection Pipeline | HIGH | MEDIUM | P1 |
| Density & Force Physics Engine | HIGH | MEDIUM | P1 |
| Force Heatmap Overlay | HIGH | MEDIUM | P1 |
| Safety Status Gauge & Banners | HIGH | LOW | P1 |
| Chokepoint ROI Calibration | HIGH | MEDIUM | P2 |
| Audio Alert Cues | MEDIUM | LOW | P2 |
| Historical Analytics Export | LOW | LOW | P3 |

## Sources

- Crowd Safety Standards: The UK Event Safety Guide ("The Purple Guide")
- Fruin, J. J. (1993). "The Causes and Prevention of Crowd Disasters"
- Helbing, D., Farkas, I., & Vicsek, T. (2000). "Simulating dynamical features of escape panic", *Nature*.

---
*Feature research for: ForceSight (Crowd Pressure Analytics)*
*Researched: October 27, 2026*
