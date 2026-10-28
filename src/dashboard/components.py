"""Telemetry components, Plotly figures, and modern UI components for ForceSight Dashboard."""

from typing import List, Union
import plotly.graph_objects as go
from src.physics.risk_state import RiskLevel, RiskStateResult


def create_radial_gauge(psi: float, risk_level: Union[str, RiskLevel] = "NOMINAL") -> go.Figure:
    """Create a sleek, modern radial gauge (0–100) for Peak Stress Index with dark glass aesthetics."""
    clipped_psi = float(max(0.0, min(100.0, psi)))
    level_str = risk_level.value if isinstance(risk_level, RiskLevel) else str(risk_level)

    if clipped_psi >= 75.0 or level_str == "CRITICAL":
        bar_color = "#FF3366"  # Vibrant Cyber Crimson
        glow_color = "rgba(255, 51, 102, 0.4)"
    elif clipped_psi >= 50.0 or level_str == "WARNING":
        bar_color = "#FFB300"  # Vivid Amber
        glow_color = "rgba(255, 179, 0, 0.4)"
    else:
        bar_color = "#00E5FF"  # Electric Cyan
        glow_color = "rgba(0, 229, 255, 0.4)"

    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=round(clipped_psi, 1),
            number={"suffix": " PSI", "font": {"size": 34, "color": "#FFFFFF", "family": "'Inter', 'Segoe UI', sans-serif"}},
            title={"text": "<span style='font-size:13px;letter-spacing:1.5px;color:#94A3B8;text-transform:uppercase;'>PEAK STRESS INDEX</span><br>", "font": {"size": 14}},
            gauge={
                "axis": {"range": [0, 100], "tickwidth": 1.5, "tickcolor": "#475569", "dtick": 25},
                "bar": {"color": bar_color, "thickness": 0.28},
                "bgcolor": "rgba(30, 41, 59, 0.6)",
                "borderwidth": 1,
                "bordercolor": "rgba(255, 255, 255, 0.1)",
                "steps": [
                    {"range": [0, 50], "color": "rgba(0, 229, 255, 0.12)"},
                    {"range": [50, 75], "color": "rgba(255, 179, 0, 0.18)"},
                    {"range": [75, 100], "color": "rgba(255, 51, 102, 0.28)"},
                ],
                "threshold": {
                    "line": {"color": "#FF3366", "width": 4},
                    "thickness": 0.85,
                    "value": 75.0,
                },
            },
        )
    )

    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=15, r=15, t=30, b=10),
        height=200,
    )
    return fig


def create_time_series_chart(
    history_timestamps: List[Union[int, float]],
    history_psi: List[float],
) -> go.Figure:
    """Create a sleek real-time rolling stress momentum line chart."""
    x_data = history_timestamps if history_timestamps else [0]
    y_data = history_psi if history_psi else [0.0]

    latest_val = y_data[-1] if y_data else 0.0
    if latest_val >= 75.0:
        line_color = "#FF3366"
        fill_color = "rgba(255, 51, 102, 0.15)"
    elif latest_val >= 50.0:
        line_color = "#FFB300"
        fill_color = "rgba(255, 179, 0, 0.15)"
    else:
        line_color = "#00E5FF"
        fill_color = "rgba(0, 229, 255, 0.12)"

    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=x_data,
            y=y_data,
            mode="lines",
            name="Smoothed PSI",
            line=dict(color=line_color, width=2.5, shape="spline"),
            fill="tozeroy",
            fillcolor=fill_color,
        )
    )

    # Reference Thresholds
    fig.add_hline(
        y=50.0,
        line_dash="dot",
        line_color="rgba(255, 179, 0, 0.7)",
        annotation_text="Warning (50)",
        annotation_position="top left",
        annotation_font=dict(color="#FFB300", size=10),
    )
    fig.add_hline(
        y=75.0,
        line_dash="dot",
        line_color="rgba(255, 51, 102, 0.8)",
        annotation_text="Critical (75)",
        annotation_position="top left",
        annotation_font=dict(color="#FF3366", size=10),
    )

    fig.update_layout(
        title=dict(
            text="<span style='font-size:12px;letter-spacing:1px;color:#94A3B8;'>MOMENTUM TIMELINE (dPSI/dt)</span>",
            font=dict(size=12),
        ),
        xaxis=dict(
            showgrid=True,
            gridcolor="rgba(255, 255, 255, 0.05)",
            color="#64748B",
            showticklabels=False,
        ),
        yaxis=dict(
            range=[0, 105],
            showgrid=True,
            gridcolor="rgba(255, 255, 255, 0.05)",
            color="#64748B",
            dtick=25,
        ),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=10, r=10, t=30, b=15),
        height=170,
        showlegend=False,
    )
    return fig


def create_risk_badge_html(risk_level: Union[str, RiskLevel], action: str = "") -> str:
    """Generate high-contrast neon badge with glassmorphism styling."""
    level_str = risk_level.value if isinstance(risk_level, RiskLevel) else str(risk_level)

    if level_str == "CRITICAL":
        bg_gradient = "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.4) 100%)"
        border = "1px solid #EF4444"
        glow = "box-shadow: 0 0 15px rgba(239, 68, 68, 0.35);"
        text_color = "#FCA5A5"
        label = "CRITICAL SURGE"
        dot_color = "#EF4444"
    elif level_str == "WARNING":
        bg_gradient = "linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.4) 100%)"
        border = "1px solid #F59E0B"
        glow = "box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);"
        text_color = "#FCD34D"
        label = "ELEVATED WARNING"
        dot_color = "#F59E0B"
    else:
        bg_gradient = "linear-gradient(135deg, rgba(16, 185, 129, 0.20) 0%, rgba(5, 150, 105, 0.3) 100%)"
        border = "1px solid #10B981"
        glow = "box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);"
        text_color = "#6EE7B7"
        label = "NOMINAL FLOW"
        dot_color = "#10B981"

    action_snippet = f"<span style='color: #E2E8F0; font-weight: normal; margin-left: 6px; font-size: 11px;'>• {action}</span>" if action else ""

    return f"""
    <div style="
        display: inline-flex;
        align-items: center;
        background: {bg_gradient};
        border: {border};
        {glow}
        padding: 5px 14px;
        border-radius: 9999px;
        backdrop-filter: blur(8px);
        margin-bottom: 8px;
    ">
        <span style="height: 8px; width: 8px; background-color: {dot_color}; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
        <span style="color: {text_color}; font-weight: 700; font-size: 12px; letter-spacing: 0.8px;">{label}</span>
        {action_snippet}
    </div>
    """


def create_alert_banner_html(risk_state: Union[RiskStateResult, dict]) -> str:
    """Generate modern operational early-warning instruction banner."""
    if isinstance(risk_state, dict):
        level_str = risk_state.get("level", "NOMINAL")
        action = risk_state.get("action", "")
    else:
        level_str = risk_state.level.value if isinstance(risk_state.level, RiskLevel) else str(risk_state.level)
        action = risk_state.action_recommended

    if level_str == "CRITICAL":
        msg = "HALT INGRESS IMMEDIATELY — Open emergency diversion corridors & throttle turnstiles!"
        if action and action != "HALT_INGRESS":
            msg = f"{action} — {msg}"
        return f"""
        <div style="
            background: linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(153, 27, 27, 0.45) 100%);
            border-left: 4px solid #EF4444;
            border-top: 1px solid rgba(239, 68, 68, 0.3);
            border-right: 1px solid rgba(239, 68, 68, 0.2);
            border-bottom: 1px solid rgba(239, 68, 68, 0.2);
            padding: 10px 14px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.25);
        ">
            <div style="font-size: 13px; font-weight: 700; color: #FCA5A5; display: flex; align-items: center; gap: 6px;">
                🚨 CRITICAL SURGE DETECTED
            </div>
            <div style="font-size: 12px; color: #FEE2E2; margin-top: 3px;">
                {msg}
            </div>
        </div>
        """
    elif level_str == "WARNING":
        msg = "ACTION REQUIRED: THROTTLE GATES BY 50% — Slow intake until bottleneck clears."
        if action and action != "THROTTLE_GATES":
            msg = f"{action} — {msg}"
        return f"""
        <div style="
            background: linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.4) 100%);
            border-left: 4px solid #F59E0B;
            border-top: 1px solid rgba(245, 158, 11, 0.3);
            border-right: 1px solid rgba(245, 158, 11, 0.2);
            border-bottom: 1px solid rgba(245, 158, 11, 0.2);
            padding: 10px 14px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        ">
            <div style="font-size: 13px; font-weight: 700; color: #FCD34D; display: flex; align-items: center; gap: 6px;">
                ⚠️ ELEVATED CROWD COMPRESSION
            </div>
            <div style="font-size: 12px; color: #FEF3C7; margin-top: 3px;">
                {msg}
            </div>
        </div>
        """
    else:
        return f"""
        <div style="
            background: linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 95, 70, 0.25) 100%);
            border-left: 4px solid #10B981;
            border-top: 1px solid rgba(16, 185, 129, 0.2);
            border-right: 1px solid rgba(16, 185, 129, 0.1);
            border-bottom: 1px solid rgba(16, 185, 129, 0.1);
            padding: 10px 14px;
            border-radius: 8px;
            margin-bottom: 10px;
        ">
            <div style="font-size: 13px; font-weight: 700; color: #6EE7B7; display: flex; align-items: center; gap: 6px;">
                ✅ NOMINAL FLOW (SAFE)
            </div>
            <div style="font-size: 12px; color: #D1FAE5; margin-top: 3px;">
                Standard ingress flow permitted — all turnstiles operating within safe thresholds.
            </div>
        </div>
        """
