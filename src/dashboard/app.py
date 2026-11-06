"""Streamlit command center dashboard for ForceSight crowd stress early-warning system."""

import os
import time
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import streamlit as st
import streamlit.components.v1 as components

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
from src.dashboard.simulator_widget import get_simulator_html
from src.ingestion.video_loader import FrameData, VideoLoader
from src.pipeline import ForceSightPipeline, PipelineResult


def scan_benchmark_videos(directory: str = "data/benchmarks") -> list[str]:
    """Scan local directory for available benchmark video files."""
    bench_dir = Path(directory)
    if not bench_dir.exists():
        return ["data/benchmarks/bottleneck_jam.mp4"]

    files = [str(f) for f in bench_dir.glob("*.mp4")] + [str(f) for f in bench_dir.glob("*.avi")]
    return sorted(files) if files else ["data/benchmarks/bottleneck_jam.mp4"]


def inject_custom_css():
    """Inject industrial control-room styling matching the virtual bench console."""
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500&display=swap');

        :root {
            --bg: #0D1114;
            --panel: #141B21;
            --panel2: #1B242C;
            --line: #28343D;
            --line2: #3A4A56;
            --ink: #E8EFF4;
            --ink2: #93A4B1;
            --ink3: #64757F;
            --steel: #4FB3D9;
            --good: #3E9E6B;
            --warn: #D9A33C;
            --crit: #D4513A;
            --fd: "Barlow Condensed", 'Arial Narrow', sans-serif;
            --fb: "IBM Plex Sans", system-ui, sans-serif;
            --fm: "IBM Plex Mono", ui-monospace, monospace;
        }

        html, body, [class*="css"] {
            font-family: var(--fb);
            color: var(--ink);
        }

        .stApp {
            background-color: var(--bg);
            color: var(--ink);
        }

        /* Control-Room Sidebar */
        section[data-testid="stSidebar"] {
            background-color: var(--panel);
            border-right: 1px solid var(--line);
        }

        section[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p,
        section[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] span {
            font-family: var(--fb);
            color: var(--ink2);
        }

        /* Clean Human-Engineered Buttons */
        .stButton > button {
            font-family: var(--fd);
            font-size: 14px;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            border-radius: 3px;
            border: 1px solid var(--line2);
            background-color: var(--panel2);
            color: var(--ink);
            transition: all 0.15s ease;
            box-shadow: none;
            padding: 6px 14px;
        }

        .stButton > button:hover {
            border-color: var(--steel);
            color: #FFFFFF;
            background-color: #222E38;
        }

        .stButton > button:focus-visible {
            outline: 2px solid var(--steel);
            outline-offset: 2px;
        }

        /* Form elements & sliders */
        div[data-baseweb="select"] > div {
            background-color: var(--panel2);
            border-color: var(--line2);
            color: var(--ink);
            border-radius: 3px;
        }

        div[data-testid="stSlider"] label {
            font-family: var(--fd);
            font-size: 13.5px;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            color: var(--ink2);
        }

        div[data-testid="stRadio"] label {
            font-family: var(--fb);
            color: var(--ink);
            font-size: 14px;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


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
    st.set_page_config(
        page_title="ForceSight Console",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    inject_custom_css()

    # Sidebar: System console navigation
    st.sidebar.markdown(
        """
        <div style="border-bottom: 1px solid #28343D; padding-bottom: 10px; margin-bottom: 14px;">
            <div style="font-family:'Barlow Condensed', sans-serif; font-size:22px; font-weight:700; letter-spacing:1px; color:#E8EFF4; text-transform:uppercase;">
                ForceSight
            </div>
            <div style="font-family:'Barlow Condensed', sans-serif; font-size:12px; letter-spacing:1.8px; color:#64757F; text-transform:uppercase;">
                Control Console
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    app_mode = st.sidebar.radio(
        "Console Mode",
        [
            "Virtual bench & crowd simulator",
            "Benchmark video analyzer",
        ],
        index=0,
    )

    st.sidebar.markdown("---")

    if app_mode.startswith("Virtual bench"):
        # Interactive Simulator Mode
        st.sidebar.markdown(
            """
            <div style="font-family:'Barlow Condensed', sans-serif; font-size:14px; letter-spacing:1.4px; color:#93A4B1; text-transform:uppercase; margin-bottom:8px;">
                Console Setup
            </div>
            """,
            unsafe_allow_html=True,
        )

        initial_particles = st.sidebar.slider("Initial crowd count", 40, 240, 115, 5)

        st.sidebar.markdown(
            r"""
            <div style="font-size:12px; color:#64757F; line-height:1.6; margin-top:14px;">
                <b>Physics engine:</b> Helbing social-force model with normal contact compression ($K_n$) and tangential sliding friction ($K_t$).
                <br><br>
                <b>Optical engine:</b> 16-step Michel-Lévy isochromatic fringe sequence modeling circular polariscope retardance ($\Delta$).
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Render client-side control-room console widget
        sim_html = get_simulator_html(initial_particles=initial_particles)
        components.html(sim_html, height=1080, scrolling=True)

    else:
        # Benchmark Video Analysis Mode
        st.sidebar.markdown(
            """
            <div style="font-family:'Barlow Condensed', sans-serif; font-size:14px; letter-spacing:1.4px; color:#93A4B1; text-transform:uppercase; margin-bottom:8px;">
                Source Video
            </div>
            """,
            unsafe_allow_html=True,
        )
        video_files = scan_benchmark_videos()
        selected_video = st.sidebar.selectbox("Benchmark file", options=video_files, index=0)

        st.sidebar.markdown("---")
        st.sidebar.markdown(
            """
            <div style="font-family:'Barlow Condensed', sans-serif; font-size:14px; letter-spacing:1.4px; color:#93A4B1; text-transform:uppercase; margin-bottom:8px;">
                Physics Calibration
            </div>
            """,
            unsafe_allow_html=True,
        )
        w_density = st.sidebar.slider("Density weight (w1)", 10.0, 50.0, 30.0, 5.0)
        w_variance = st.sidebar.slider("Turbulence weight (w2)", 10.0, 50.0, 25.0, 5.0)
        warning_thresh = st.sidebar.slider("Warning threshold (PSI)", 40.0, 60.0, 50.0, 5.0)
        critical_thresh = st.sidebar.slider("Critical threshold (PSI)", 65.0, 85.0, 75.0, 5.0)
        target_fps = st.sidebar.slider("Playback frame rate", 10, 45, 25, 5)

        pipeline_configs = dict(
            stress_config=StressConfig(w_density=w_density, w_variance=w_variance),
            risk_config=RiskConfig(warning_threshold=warning_thresh, critical_threshold=critical_thresh),
        )

        init_session_state(selected_video, pipeline_configs)

        st.markdown(
            """
            <div style="background:#141B21; border:1px solid #28343D; border-radius:4px; padding:12px 16px; margin-bottom:14px;">
                <div style="font-family:'Barlow Condensed', sans-serif; font-size:22px; font-weight:700; letter-spacing:0.8px; color:#E8EFF4; text-transform:uppercase;">
                    Video Ingestion & Dense Optical Flow Analysis
                </div>
                <div style="font-family:'IBM Plex Sans', sans-serif; font-size:13px; color:#93A4B1; margin-top:2px;">
                    Farnebäck optical flow &middot; Coupled Helbing stress surface &middot; Photoelastic birefringence blend
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        col_video, col_telemetry = st.columns([62, 38])

        with col_video:
            video_placeholder = st.empty()
            c1, c2, c3, c4 = st.columns(4)
            if c1.button("Play", key="btn_play", width="stretch"):
                st.session_state.is_playing = True
            if c2.button("Pause", key="btn_pause", width="stretch"):
                st.session_state.is_playing = False
            step_clicked = c3.button("Step", key="btn_step", width="stretch")
            if c4.button("Reset", key="btn_rewind", width="stretch"):
                st.session_state.loader.seek(0)
                st.session_state.stream = st.session_state.loader.stream_frames()
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

        def process_and_render_frame():
            try:
                frame_data = next(st.session_state.stream)
            except StopIteration:
                st.session_state.stream = st.session_state.loader.stream_frames()
                frame_data = next(st.session_state.stream)

            res: PipelineResult = st.session_state.pipeline.process_frame(frame_data)
            st.session_state.last_result = res

            st.session_state.history_frames.append(res.frame_idx)
            st.session_state.history_psi.append(res.smoothed_psi)
            if len(st.session_state.history_frames) > 80:
                st.session_state.history_frames.pop(0)
                st.session_state.history_psi.pop(0)

            rgb_disp = cv2.cvtColor(res.blended_frame, cv2.COLOR_BGR2RGB)
            video_placeholder.image(rgb_disp, channels="RGB", width="stretch")

            banner_placeholder.markdown(create_alert_banner_html(res.risk_state), unsafe_allow_html=True)
            badge_placeholder.markdown(
                create_risk_badge_html(res.risk_state.level, res.risk_state.action_recommended),
                unsafe_allow_html=True,
            )
            gauge_placeholder.plotly_chart(
                create_radial_gauge(res.smoothed_psi, res.risk_state.level),
                width="stretch",
                config={"displayModeBar": False},
                key=f"gauge_{res.frame_idx}",
            )
            chart_placeholder.plotly_chart(
                create_time_series_chart(st.session_state.history_frames, st.session_state.history_psi),
                width="stretch",
                config={"displayModeBar": False},
                key=f"chart_{res.frame_idx}",
            )

        if not st.session_state.is_playing and not step_clicked:
            if st.session_state.last_result is None:
                process_and_render_frame()
            else:
                res = st.session_state.last_result
                rgb_disp = cv2.cvtColor(res.blended_frame, cv2.COLOR_BGR2RGB)
                video_placeholder.image(rgb_disp, channels="RGB", width="stretch")
                banner_placeholder.markdown(create_alert_banner_html(res.risk_state), unsafe_allow_html=True)
                badge_placeholder.markdown(
                    create_risk_badge_html(res.risk_state.level, res.risk_state.action_recommended),
                    unsafe_allow_html=True,
                )
                gauge_placeholder.plotly_chart(
                    create_radial_gauge(res.smoothed_psi, res.risk_state.level),
                    width="stretch",
                    config={"displayModeBar": False},
                    key="gauge_static",
                )
                chart_placeholder.plotly_chart(
                    create_time_series_chart(st.session_state.history_frames, st.session_state.history_psi),
                    width="stretch",
                    config={"displayModeBar": False},
                    key="chart_static",
                )

        if step_clicked:
            process_and_render_frame()

        if st.session_state.is_playing:
            while st.session_state.is_playing:
                t0 = time.time()
                process_and_render_frame()
                dt = time.time() - t0
                time.sleep(max(0.001, (1.0 / target_fps) - dt))


if __name__ == "__main__":
    main()
