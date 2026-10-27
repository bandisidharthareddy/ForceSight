# Phase 3: Photoelastic Birefringence Heatmap Overlay — Research

**Date:** October 27, 2026  
**Status:** Complete  

## Overview & Architecture

Phase 3 implements the visual presentation layer of the Digital Photoelastic Simulation:
1. **Custom 256-entry Color Lookup Table (LUT)**: Maps continuous stress indices in $[0, 100]$ to the 3-stop perceptual gradient (Steel Blue ➔ Amber ➔ Crimson).
2. **Smooth Bicubic Upsampling**: Expands the coarse block grid ($18 \times 32$) to arbitrary frame resolutions (e.g. $720 \times 1280$) using `cv2.INTER_CUBIC` followed by edge-softening Gaussian filtering.
3. **Stress-Weighted Adaptive Alpha Blending**: Blends the chromatic fringes over the raw crowd footage so calm regions remain translucent ($\alpha \approx 0.15$) and critical surge hotspots pop prominently ($\alpha \approx 0.65$).
4. **Hotspot Bloom & Iso-Stress Contours**: Renders a luminous radial flare and concentric contour rings around the primary compression coordinate.

---

## Technical Patterns & Findings

### 1. Custom OpenCV ColorMap / LUT
OpenCV allows custom colormaps using `cv2.applyColorMap(src_uint8, lut_256x1x3)`.
- Generating a 256-level LUT:
  - $0 \le i < 128$: Linear interpolation between Cool Steel Blue (`RGB(30, 136, 229)` / `BGR(229, 136, 30)`) and Vivid Amber (`RGB(253, 216, 53)` / `BGR(53, 216, 253)`).
  - $128 \le i \le 255$: Linear interpolation between Vivid Amber and Deep Crimson (`RGB(211, 47, 47)` / `BGR(47, 47, 211)`).
- Input: Scaled stress map `(stress_map / 100.0 * 255.0).astype(np.uint8)`.
- Output: 3-channel BGR colored heatmap.

### 2. Bicubic Upsampling and Softening
- Block grid from Phase 2 has shape $(H / \text{grid}, W / \text{grid})$.
- Upsample with `cv2.resize(stress_map, (target_w, target_h), interpolation=cv2.INTER_CUBIC)`.
- To eliminate block boundary stepping artifacts, apply a spatial Gaussian filter with $k=15$ ($\sigma \approx 3.0$).
- Clip result to strictly $[0.0, 100.0]$.

### 3. Vectorized Stress-Adaptive Alpha Blending
Using per-pixel alpha:
$$\alpha(x, y) = \alpha_{\min} + (\alpha_{\max} - \alpha_{\min}) \cdot \left(\frac{S(x, y)}{100.0}\right)^{1.2}$$
- `alpha_map = alpha_min + (alpha_max - alpha_min) * np.power(stress_upscaled / 100.0, 1.2)`
- Broadcast `alpha_3d = np.repeat(alpha_map[:, :, np.newaxis], 3, axis=2)`.
- Fast vectorized blend:
  `blended = (base_bgr * (1.0 - alpha_3d) + color_heatmap * alpha_3d).astype(np.uint8)`.
- Fast execution time: < 3.5ms on $720 \times 1280$ frame.

### 4. Hotspot Bloom and Contour Rings
- Locate `hotspot_coords = (row, col)` in grid coordinates; scale to target frame coordinates `(center_x, center_y)`.
- Bloom effect: create a radial distance mask $r = \sqrt{(x - c_x)^2 + (y - c_y)^2}$ and apply Gaussian decay $e^{-r^2 / (2 \sigma_b^2)}$.
- Iso-stress contours: threshold at $60\%$, $75\%$, and $90\%$ of peak stress, find boundaries using `cv2.findContours` or morphological gradients, and overlay thin colored outlines.

---

## Pitfalls & Mitigations

| Pitfall | Risk | Mitigation |
|---|---|---|
| Color banding in continuous gradient | Stepped color shifts look unnatural and distracting | Generate 256-step interpolated float LUT and smooth with Gaussian filter before colorizing |
| Excessive opacity obscuring crowd faces | Security marshals cannot identify individuals or barriers | Bound minimal alpha $\alpha_{\min} = 0.15$; only high-stress zones exceed $\alpha = 0.50$ |
| Heavy latency on full-HD upsampling | Dropped frames during playback | Keep grid resizing and alpha blending in vectorized float32 NumPy operations without per-pixel Python loops |
| BGR vs RGB mismatch | Red turns blue or amber turns teal in dashboard | Standardize internal engine on BGR (OpenCV native), with explicit `to_rgb()` export option for Streamlit/Pillow |

---

## Implementation Plan Outline

- **Wave 1 (03-01)**: Photoelastic colormap generator and continuous field upsampler (`src/visualization/colormap.py`).
- **Wave 2 (03-02)**: Adaptive alpha blender, hotspot bloom glow, and contour overlay (`src/visualization/overlay.py`).
