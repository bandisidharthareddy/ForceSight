"""Configuration schemas and default parameters for ForceSight."""

from pydantic import BaseModel, Field


class VideoConfig(BaseModel):
    """Configuration for video ingestion and proxy streaming."""

    proxy_width: int = Field(default=640, description="Width of low-resolution grayscale processing proxy")
    proxy_height: int = Field(default=360, description="Height of low-resolution grayscale processing proxy")
    loop: bool = Field(default=True, description="Whether to automatically rewind and loop playback upon EOF")
    default_benchmark_dir: str = Field(default="data/benchmarks", description="Default directory containing benchmark video files")


class OpticalFlowConfig(BaseModel):
    """Configuration for Farneback dense optical flow estimation."""

    pyr_scale: float = Field(default=0.5, description="Image scale (<1) to build pyramids for each frame")
    levels: int = Field(default=3, description="Number of pyramid layers including initial image")
    winsize: int = Field(default=15, description="Averaging window size; larger values increase robustness to image noise")
    iterations: int = Field(default=3, description="Number of iterations at each pyramid level")
    poly_n: int = Field(default=5, description="Size of the pixel neighborhood used to find polynomial expansion")
    poly_sigma: float = Field(default=1.2, description="Standard deviation of the Gaussian used to smooth derivatives")
    flags: int = Field(default=0, description="Operation flags for cv2.calcOpticalFlowFarneback")
    gaussian_blur_size: int = Field(default=5, description="Kernel size for pre-flow Gaussian smoothing (must be odd)")


class DensityConfig(BaseModel):
    """Configuration for spatial crowd density estimation."""

    block_size: int = Field(default=20, description="Spatial grid block size in pixels matching motion stats grid")
    edge_threshold_low: int = Field(default=50, description="Lower threshold for Canny edge detector")
    edge_threshold_high: int = Field(default=150, description="Upper threshold for Canny edge detector")
    edge_weight: float = Field(default=0.65, description="Weight of edge gradient energy in density calculation")
    flow_weight: float = Field(default=0.35, description="Weight of optical flow occupancy in density calculation")
    blur_ksize: int = Field(default=5, description="Gaussian blur kernel size for pre-edge smoothing")
    min_flow_thresh: float = Field(default=0.5, description="Minimum flow magnitude in pixels to count cell as active motion occupancy")


class StressConfig(BaseModel):
    """Configuration for coupled Helbing crowd stress field calculation and PSI normalization."""

    w_density: float = Field(default=30.0, description="Weight for spatial density")
    w_variance: float = Field(default=25.0, description="Weight for velocity variance")
    w_interaction: float = Field(default=35.0, description="Weight for coupled density * variance term")
    w_stagnation: float = Field(default=10.0, description="Weight for stagnation divergence term")
    scale_factor: float = Field(default=1.0, description="Overall scaling multiplier for stress calibration")
    percentile_psi: float = Field(default=95.0, description="Percentile of active cells used to compute instantaneous Peak Stress Index")
    max_expected_variance: float = Field(default=15.0, description="Expected maximum velocity variance for normalization")


class SmoothingConfig(BaseModel):
    """Configuration for asymmetric Exponential Moving Average (EMA) temporal smoothing."""

    alpha_rise: float = Field(default=0.35, description="Fast-attack alpha for rising stress surges")
    alpha_fall: float = Field(default=0.10, description="Slow-decay alpha for falling stress cooldown")


class RiskConfig(BaseModel):
    """Configuration for 3-tier risk classification and hysteresis debouncing."""

    warning_threshold: float = Field(default=50.0, description="PSI threshold for Warning regime")
    critical_threshold: float = Field(default=75.0, description="PSI threshold for Critical regime")
    hysteresis_buffer: float = Field(default=5.0, description="Hysteresis point buffer for downward recovery")
    deescalation_frames: int = Field(default=15, description="Consecutive frames below recovery threshold required to de-escalate")


class OverlayConfig(BaseModel):
    """Configuration for photoelastic heatmap rendering, alpha blending, and contour blooms."""

    alpha_min: float = Field(default=0.15, description="Minimum alpha transparency in nominal stress zones")
    alpha_max: float = Field(default=0.65, description="Maximum alpha transparency in critical surge zones")
    alpha_power: float = Field(default=1.2, description="Non-linear power scaling for adaptive alpha mapping")
    upsample_blur_ksize: int = Field(default=15, description="Gaussian kernel size for smoothing upsampled stress grid")
    hotspot_bloom_radius: int = Field(default=40, description="Pixel radius for radial Gaussian bloom at peak hotspot")
    hotspot_bloom_intensity: float = Field(default=0.35, description="Intensity factor for hotspot bloom additive blending")
    contour_levels: list[float] = Field(default=[0.60, 0.75, 0.90], description="Iso-stress contour ratios relative to local peak stress")
