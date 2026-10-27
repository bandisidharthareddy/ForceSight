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
