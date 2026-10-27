"""Streamlit command center dashboard for ForceSight crowd stress early-warning system."""

import os
import time
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import streamlit as st

from src.config import (
    DensityConfig,
    OpticalFlowConfig,
    OverlayConfig,
    RiskConfig,
    SmoothingConfig,
    StressConfig,
    VideoConfig,
)
from src.dashboard.components import (
    create_alert_banner_html,
    create_radial_gauge,
    create_risk_badge_html,
    create_time_series_chart,
)
from src.ingestion.video_loader import FrameData, VideoLoader
from src.pipeline import ForceSightPipeline, PipelineResult


def scan_benchmark_videos(directory: str = "data/benchmarks") -> list[str]:
    """Scan local directory for available benchmark video files."""
    bench_dir = Path(directory)
    if not bench_dir.exists():
        return ["data/benchmarks/synthetic_surge.mp4"]

    files = [str(f) for f in bench_dir.glob("*.mp4")] + [str(f) for f in bench_dir.glob("*.avi")]
    return sorted(files) if files else ["data/benchmarks/synthetic_surge.mp4"]


def init_session_state(video_path: str, pipeline_configs: dict) -> None:
    """Initialize or reset Streamlit session state."""
    reinit = False
    if "video_path" not in st.session_state or st.session_state.video_path != video_path:
        st.session_state.video_path = video_path
        reinit = True

    if reinit or "loader" not in st.session_state:
        st.session_state.loader = VideoLoader(video_path, config=VideoConfig(loop=True))
        st.session_state.stream = st.session_state.loader.stream_frames()
        st.session_state.pipeline = ForceSightPipeline(**pipeline_configs)
        st.session_state.history_frames = []
        st.session_state.history_psi = []
        st.session_state.is_playing = False
        st.session_state.last_result = None


def main() -> None:
    """Main execution function for ForceSight Streamlit command center."""
    st.set_page_config(
        page_title="ForceSight — Crowd Early-Warning Dashboard",
        page_icon="👁️",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    # Sidebar: Source Selection & Sensitivity Tuning
    st.sidebar.markdown("## ⚙️ **Control Panel**")

    video_files = scan_benchmark_videos()
    selected_video = st.sidebar.selectbox("Benchmark Video Source", options=video_files, index=0)

    st.sidebar.markdown("---")
    st.sidebar.markdown("### 🎛️ **Physics & Sensitivity Tuning**")

    w_density = st.sidebar.slider("Density Weight ($w_1$)", 10.0, 50.0, 30.0, 5.0)
    w_variance = st.sidebar.slider("Turbulence Weight ($w_2$)", 10.0, 50.0, 25.0, 5.0)
    warning_thresh = st.sidebar.slider("Warning Limit (PSI)", 40.0, 60.0, 50.0, 5.0)
    critical_thresh = st.sidebar.slider("Critical Limit (PSI)", 65.0, 85.0, 75.0, 5.0)
    alpha_max = st.sidebar.slider("Max Heatmap Opacity", 0.40, 0.90, 0.65, 0.05)
    target_fps = st.sidebar.slider("Target Playback FPS", 10, 60, 30, 5)

    pipeline_configs = dict(
        stress_config=StressConfig(w_density=w_density, w_variance=w_variance),
        risk_config=RiskConfig(warning_threshold=warning_thresh, critical_threshold=critical_thresh),
        overlay_config=OverlayConfig(alpha_max=alpha_max),
    )

    init_session_state(selected_video, pipeline_configs)

    # Main Command Center UI Header
    st.markdown(
        """
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div>
                <h1 style="margin: 0; font-size: 26px; color: #FFFFFF;">👁️ ForceSight — Crowd Stress Command Center</h1>
                <p style="margin: 0; font-size: 13px; color: #90CAF9;">
                    Proactive Digital Photoelastic Simulation & Early-Warning Bottleneck Mitigation
                </p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 2-Column Responsive Command Center
    col_video, col_telemetry = st.columns([65, 35])

    with col_video:
        video_placeholder = st.empty()

        # Playback Controls Bar
        ctrl1, ctrl2, ctrl3, ctrl4 = st.columns(4)
        if ctrl1.button("▶️ Play", use_container_width=True):
            st.session_state.is_playing = True
        if ctrl2.button("⏸️ Pause", use_container_width=True):
            st.session_state.is_playing = False
        step_clicked = ctrl3.button("⏭️ Step", use_container_width=True)
        if ctrl4.button("🔄 Rewind", use_container_width=True):
            st.session_state.loader.seek_frame(0)
            st.session_state.pipeline.reset()
            st.session_state.history_frames.clear()
            st.session_state.history_psi.clear()
            st.session_state.is_playing = False
            st.session_state.last_result = None

    with col_telemetry:
        banner_placeholder = st.empty()
        badge_placeholder = st.empty()
        gauge_placeholder = st.empty()
        chart_placeholder = st.empty()

    # Frame processing helper
    def process_and_render_next_frame():
        try:
            frame_data = next(st.session_state.stream)
        except StopIteration:
            st.session_state.stream = st.session_state.loader.stream_frames()
            frame_data = next(st.session_state.stream)

        res: PipelineResult = st.session_state.pipeline.process_frame(frame_data)
        st.session_state.last_result = res

        # Update rolling history (last 100 frames)
        st.session_state.history_frames.append(res.frame_idx)
        st.session_state.history_psi.append(res.smoothed_psi)
        if len(st.session_state.history_frames) > 100:
            st.session_state.history_frames.pop(0)
            st.session_state.history_psi.pop(0)

        # Render outputs:
        # Convert BGR blended frame to RGB for Streamlit canvas
        rgb_disp = cv2.cvtColor(res.blended_frame, cv2.COLOR_BGR2RGB)
        video_placeholder.image(rgb_disp, channels="RGB", use_container_width=True)

        # Update Telemetry Widgets
        banner_placeholder.markdown(create_alert_banner_html(res.risk_state), unsafe_allow_html=True)
        badge_placeholder.markdown(
            create_risk_badge_html(res.risk_state.level, res.risk_state.action_recommended),
            unsafe_allow_html=True,
        )
        gauge_placeholder.plotly_chart(
            create_radial_gauge(res.smoothed_psi, res.risk_state.level),
            use_container_width=True,
            config={"displayModeBar": False},
        )
        chart_placeholder.plotly_chart(
            create_time_series_chart(st.session_state.history_frames, st.session_state.history_psi),
            use_container_width=True,
            config={"displayModeBar": False},
        )

    # Initial or Static Render if Paused
    if not st.session_state.is_playing and not step_clicked:
        if st.session_state.last_result is None:
            process_and_render_next_frame()
        else:
            res = st.session_state.last_result
            rgb_disp = cv2.cvtColor(res.blended_frame, cv2.COLOR_BGR2RGB)
            video_placeholder.image(rgb_disp, channels="RGB", use_container_width=True)
            banner_placeholder.markdown(create_alert_banner_html(res.risk_state), unsafe_allow_html=True)
            badge_placeholder.markdown(
                create_risk_badge_html(res.risk_state.level, res.risk_state.action_recommended),
                unsafe_allow_html=True,
            )
            gauge_placeholder.plotly_chart(
                create_radial_gauge(res.smoothed_psi, res.risk_state.level),
                use_container_width=True,
                config={"displayModeBar": False},
            )
            chart_placeholder.plotly_chart(
                create_time_series_chart(st.session_state.history_frames, st.session_state.history_psi),
                use_container_width=True,
                config={"displayModeBar": False},
            )

    # Single Step
    if step_clicked:
        process_and_render_next_frame()

    # Continuous Streaming Loop
    if st.session_state.is_playing:
        while st.session_state.is_playing:
            start_time = time.time()
            process_and_render_next_frame()
            elapsed = time.time() - start_time
            sleep_time = max(0.001, (1.0 / target_fps) - elapsed)
            time.sleep(sleep_time)


if __name__ == "__main__":
    main()
