# Phase 3: Photoelastic Birefringence Heatmap Overlay - Context

**Gathered:** October 27, 2026
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 implements the visual rendering engine of ForceSight: translating the continuous 2D stress field computed in Phase 2 into a photoelastic chromatic birefringence heatmap overlay (cool blue ➔ vivid amber ➔ deep crimson). It scales the grid via smooth bicubic upsampling, blends the chromatic fringes onto the original video stream with stress-weighted adaptive alpha transparency, and renders luminous glow blooms with concentric iso-stress contour rings around peak bottleneck hotspots.

</domain>

<decisions>
## Implementation Decisions

### Colormap Styling
- **D-01:** Implement a custom 3-stop perceptual chromatic colormap matching the physical regimes:
  - Nominal ($0 \le \text{PSI} < 50$): Cool Steel Blue (`#1E88E5` / BGR `[229, 136, 30]`)
  - Warning ($50 \le \text{PSI} < 75$): Vivid Amber/Yellow (`#FDD835` / BGR `[53, 216, 253]`)
  - Critical ($75 \le \text{PSI} \le 100$): Deep Crimson/Ruby (`#D32F2F` / BGR `[47, 47, 211]`)
  - Continuous linear interpolation in LAB or RGB color space across 256 LUT levels to prevent banding artifacts. — **Reversibility:** reversible

### Heatmap Alpha Blending
- **D-02:** Use a stress-weighted adaptive alpha channel:
  - Low-stress / nominal regions ($\text{PSI} < 20$) maintain minimal translucency ($\alpha \approx 0.15\text{--}0.20$) to preserve crisp visual clarity of individual faces and silhouettes.
  - High-stress / critical surge hotspots scale up opacity ($\alpha \approx 0.60\text{--}0.65$) to ensure danger is glaringly noticeable to security marshals.
  - Formula: $\alpha(S) = \alpha_{\min} + (\alpha_{\max} - \alpha_{\min}) \cdot (S / 100.0)^p$, with $\alpha_{\min} = 0.15$, $\alpha_{\max} = 0.65$, $p = 1.2$. — **Reversibility:** reversible

### Hotspot & Bottleneck Visualization
- **D-03:** Render a luminous bloom glow and concentric iso-stress contour rings around the primary hotspot coordinate (`hotspot_coords` from Phase 2):
  - Gaussian radial bloom centered at the peak coordinate with dynamic radius proportional to local stress spread.
  - Iso-stress contour lines drawn at 60%, 75%, and 90% of local peak stress. — **Reversibility:** reversible

### Spatial Upsampling & Interpolation
- **D-04:** Scale the coarse block stress grid (e.g. $18 \times 32$) to the native full-resolution video frame (e.g. $720 \times 1280$) using bicubic interpolation (`cv2.INTER_CUBIC`) followed by an edge-softening Gaussian blur ($k=15$) to create a smooth, continuous fluid-like appearance mimicking photoelastic materials under stress. — **Reversibility:** reversible

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Vision
- `.planning/PROJECT.md` — Project context and Digital Photoelastic Simulation core value
- `.planning/REQUIREMENTS.md` — Scope requirements PHOTO-01, PHOTO-02, PHOTO-03

### Phase 2 Outputs
- `src/physics/stress_engine.py` — `StressResult` providing `stress_map` (2D float32 [0.0, 100.0]) and `hotspot_coords`
- `src/physics/risk_state.py` — `AsymmetricEMA` for temporal smoothing of 2D maps and `RiskStateResult`
- `src/config.py` — Base configuration schemas

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ingestion/video_loader.py` — Provides `FrameData` containing `raw_rgb` (full resolution) and `gray_proxy`.
- `src/physics/stress_engine.py` — Produces 2D stress matrix `stress_map` and peak coordinate.
- `src/physics/risk_state.py` — `AsymmetricEMA.update_map()` keeps the 2D stress field temporally smooth before rendering.

### Integration Points
- `src/visualization/colormap.py` — Custom photoelastic 3-stop LUT generator and 2D field colorizer.
- `src/visualization/overlay.py` — Adaptive alpha blender, upsampler, and contour bloom renderer.
- `src/config.py` — Extend with `OverlayConfig`.

</code_context>

<specifics>
## Specific Ideas

- Ensure color mapping uses OpenCV BGR convention internally for zero-copy performance when blending with OpenCV frames, converting to RGB for dashboard display if needed.
- The overlay renderer should return both the blended frame and an isolated transparent RGBA overlay for UI flexibility.

</specifics>

<deferred>
## Deferred Ideas

- Streamlit canvas controls, interactive ROI polygon selectors, and audio sirens — deferred to Phase 4.

</deferred>

---

*Phase: 03-photoelastic-birefringence-heatmap-overlay*
