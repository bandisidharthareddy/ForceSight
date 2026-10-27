# Pitfalls Research

**Domain:** Computer Vision Crowd Density & Compressive Force Analytics
**Researched:** October 27, 2026
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Perspective Distortion & Uneven Pixel-to-Meter Scaling

**What goes wrong:**
In oblique CCTV camera angles (e.g. 30°–45° tilt down a queue corridor), people near the camera appear 4x larger in pixel space than people 20 meters away. Calculating density per square pixel makes the front look deceptively dense and the rear look sparse, even if the rear is where the crowd surge originates.

**Why it happens:**
Developers count heads per image pixel area without applying ground-plane homography or perspective normalization.

**How to avoid:**
Calibrate ground plane using a 4-point perspective transform (`cv2.getPerspectiveTransform`) or apply height-adaptive bounding box scaling where cell dimensions expand with perspective depth.

**Warning signs:**
Distant chokepoints show 0 kg pressure despite visible visual crowds; foreground guards show false critical alerts.

**Phase to address:**
Phase 2 (Spatial Grid & Ground Calibration).

---

### Pitfall 2: Severe Occlusion in High-Density Crowds (>5 persons/m²)

**What goes wrong:**
At dangerous densities, full bodies are 90% occluded—only heads and shoulders are visible. Full-body detectors (like standard COCO person models) fail, causing reported counts to drop precipitously just when the crowd is most dangerously compacted.

**Why it happens:**
Standard person detectors expect legs, torso, and full silhouette. In a crush, only head tops are visible.

**How to avoid:**
Focus detection specifically on heads/shoulders (either fine-tuned head detection weights or upper-body anchor boxes), or use density regression / point-based counting at high densities.

**Warning signs:**
Reported crowd count decreases as the crowd packs tighter together.

**Phase to address:**
Phase 1 & Phase 2 (Vision Detection Pipeline).

---

### Pitfall 3: Alert Flickering & Operator Alarm Fatigue

**What goes wrong:**
Force estimates fluctuate rapidly frame-by-frame due to detection jitter (e.g. bouncing between 248 kg and 253 kg). The dashboard flashes red, plays siren sounds, then goes green every 100ms. Gate marshals (Karthik) become annoyed and ignore or mute the system.

**Why it happens:**
Applying raw, instantaneous frame thresholding without temporal smoothing or hysteresis.

**How to avoid:**
Implement an exponential moving average (EMA) or rolling window across the last 15-30 frames, coupled with hysteresis thresholds (e.g., enter CRITICAL at >250 kg, exit only when falling below 200 kg for 2 seconds).

**Warning signs:**
Alert status toggles more than once per second on steady footage.

**Phase to address:**
Phase 3 (Alert State Machine & Physics Engine).

---

### Pitfall 4: Unphysical or Misleading Force Metrics ($kg$ vs $\text{N}$)

**What goes wrong:**
Presenting raw abstract physics metrics (e.g., "$3,200\text{ N/m}$" or "$14.2\text{ kPa}$") confuses on-ground security guards who cannot intuitively map Pascals to physical danger, or outputting wildly inflated numbers ($10,000\text{ kg}$) that erode credibility.

**Why it happens:**
Using arbitrary scaling constants rather than literature-grounded crowd dynamics (Helbing's formula and human chest crushing thresholds of 250–400 kg).

**How to avoid:**
Calibrate the force model against established biomechanical thresholds:
- Safe: 0–150 kg (free movement)
- Warning: 150–250 kg (crowd turbulence, difficulty moving, throttle advised)
- Critical: >250 kg (potential compressive asphyxiation, immediate barrier relief required)

**Warning signs:**
Marshals don't know what action to take when looking at the metric.

**Phase to address:**
Phase 3 (Force Engine Calibration) & Phase 4 (Dashboard UX).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using fixed uniform grid without perspective scaling | Easy 10-line implementation | Huge density errors at corridor back | Only during initial Phase 1 mock testing |
| Synchronous UI rendering with CV inference | Easy Streamlit setup | UI frame drops and sluggish button clicks | Acceptable for MVP; decouple in v2 |
| Hardcoded threshold values | Fast hardcoded logic | Cannot adjust for different venue layouts | Never; use external config/Pydantic models |

## "Looks Done But Isn't" Checklist

- [ ] **YOLO Detection:** Often misses people in dense clusters — verify against clips with packed crowds (>4 people/m²).
- [ ] **Heatmap Overlay:** Often covers video features completely — verify alpha transparency allows security to see actual humans beneath the heat colors.
- [ ] **Force Calculation:** Often spikes on single-frame detection blips — verify smoothed rolling average resists transient noise.
- [ ] **Dashboard Playback:** Often crashes on video end — verify graceful loop or replay capability.

---
*Pitfalls research for: ForceSight (Crowd Pressure Analytics)*
*Researched: October 27, 2026*
