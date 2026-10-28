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
    """Inject ultra-modern responsive dark cyber-glass UI styling."""
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

        html, body, [class*="css"] {
            font-family: 'Inter', sans-serif;
        }

        .stApp {
            background: radial-gradient(circle at 10% 10%, #0B1120 0%, #030712 100%);
            color: #F8FAFC;
        }

        /* Modernized Sidebar */
        section[data-testid="stSidebar"] {
            background-color: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Glass Cards */
        .glass-panel {
            background: rgba(15, 23, 42, 0.65);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 16px;
            backdrop-filter: blur(12px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
            margin-bottom: 14px;
        }

        /* Action Buttons */
        .stButton > button {
            border-radius: 8px;
            font-weight: 600;
            letter-spacing: 0.5px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
            color: #FFFFFF;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .stButton > button:hover {
            border-color: #00E5FF;
            color: #00E5FF;
            box-shadow: 0 0 16px rgba(0, 229, 255, 0.35);
            transform: translateY(-1px);
        }

        /* Metrics */
        div[data-testid="stMetricValue"] {
            font-family: 'JetBrains Mono', monospace;
            font-size: 26px;
            color: #00E5FF;
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
        page_title="ForceSight — Digital Photoelastic Crowd Early-Warning",
        page_icon="⚡",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    inject_custom_css()

    # Sidebar: Mode Selection & Tuning
    st.sidebar.markdown(
        """
        <div style="display:flex; align-items:center; gap:8px; margin-bottom: 12px;">
            <span style="font-size:24px;">⚡</span>
            <span style="font-size:18px; font-weight:700; color:#FFFFFF; letter-spacing:0.5px;">ForceSight Core</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    app_mode = st.sidebar.radio(
        "Operation Mode",
        [
            "⚡ Real-Time Crowd Physics Simulator (60 FPS)",
            "📹 Benchmark Video Analyzer (Farnebäck CV)",
        ],
        index=0,
    )

    st.sidebar.markdown("---")

    if app_mode.startswith("⚡ Real-Time"):
        # Interactive Simulator Mode
        st.sidebar.markdown("### 🎛️ **Simulator Guidance**")
        st.sidebar.info(
            "This mode runs **direct physical crowd simulation at 60 FPS** on the client canvas.\n\n"
            "- **🚪 Gate Barrier**: Toggle chokepoint to simulate stampede crush.\n"
            "- **⚡ Surge Button**: Triggers rapid surge compression against the gate.\n"
            "- **Photoelastic Fringes**: Observe authentic Michel-Lévy chromatic fringe orders (darkfield ➔ amber ➔ crimson)."
        )

        initial_particles = st.sidebar.slider("Initial Crowd Density", 60, 350, 180, 10)

        # Header
        st.markdown(
            """
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 20px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <h2 style="margin: 0; font-size: 22px; color: #FFFFFF; font-weight: 800;">
                            ⚡ ForceSight — Pure Physical Crowd Simulator
                        </h2>
                        <p style="margin: 3px 0 0 0; font-size: 13px; color: #94A3B8;">
                            Direct Social-Force Engine • Michel-Lévy Photoelastic Birefringence • Real-Time 60 FPS Canvas
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: rgba(0, 229, 255, 0.15); border: 1px solid #00E5FF; color: #00E5FF; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;">
                            60 FPS HARDWARE ACCELERATED
                        </span>
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Render client-side 60 FPS simulator widget
        sim_html = get_simulator_html(initial_particles=initial_particles)
        components.html(sim_html, height=650, scrolling=False)

    else:
        # Benchmark Video Analysis Mode
        st.sidebar.markdown("### 📹 **Benchmark Video Source**")
        video_files = scan_benchmark_videos()
        selected_video = st.sidebar.selectbox("Benchmark Video", options=video_files, index=0)

        st.sidebar.markdown("---")
        st.sidebar.markdown("### 🎛️ **Vision & Physics Calibration**")
        w_density = st.sidebar.slider("Density Weight ($w_1$)", 10.0, 50.0, 30.0, 5.0)
        w_variance = st.sidebar.slider("Turbulence Weight ($w_2$)", 10.0, 50.0, 25.0, 5.0)
        warning_thresh = st.sidebar.slider("Warning Limit (PSI)", 40.0, 60.0, 50.0, 5.0)
        critical_thresh = st.sidebar.slider("Critical Limit (PSI)", 65.0, 85.0, 75.0, 5.0)
        target_fps = st.sidebar.slider("Target Playback FPS", 10, 45, 25, 5)

        pipeline_configs = dict(
            stress_config=StressConfig(w_density=w_density, w_variance=w_variance),
            risk_config=RiskConfig(warning_threshold=warning_thresh, critical_threshold=critical_thresh),
        )

        init_session_state(selected_video, pipeline_configs)

        st.markdown(
            """
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 20px; margin-bottom: 16px;">
                <h2 style="margin: 0; font-size: 22px; color: #FFFFFF; font-weight: 800;">
                    📹 ForceSight — Video Ingestion & Dense Optical Flow Analysis
                </h2>
                <p style="margin: 3px 0 0 0; font-size: 13px; color: #94A3B8;">
                    Farnebäck Dense Optical Flow • Coupled Helbing Stress Surface • Photoelastic Birefringence Blend
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        col_video, col_telemetry = st.columns([62, 38])

        with col_video:
            video_placeholder = st.empty()
            c1, c2, c3, c4 = st.columns(4)
            if c1.button("▶️ Play Video", key="btn_play", width="stretch"):
                st.session_state.is_playing = True
            if c2.button("⏸️ Pause", key="btn_pause", width="stretch"):
                st.session_state.is_playing = False
            step_clicked = c3.button("⏭️ Next Frame", key="btn_step", width="stretch")
            if c4.button("🔄 Rewind", key="btn_rewind", width="stretch"):
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
