"""Telemetry components, Plotly figures, and alert banners for ForceSight Dashboard."""

from typing import List

import plotly.graph_objects as go

from src.physics.risk_state import RiskLevel, RiskStateResult


def create_radial_gauge(psi: float, risk_level: str = "NOMINAL") -> go.Figure:
    """Create a high-contrast semi-circular radial gauge (0–100) for Peak Stress Index.

    Args:
        psi: Peak Stress Index in range [0.0, 100.0].
        risk_level: Current risk level string ("NOMINAL", "WARNING", "CRITICAL").

    Returns:
        Plotly Figure object configured with 3 risk zones and dark mode layout.
    """
    clipped_psi = float(max(0.0, min(100.0, psi)))

    # Bar indicator color matching current regime
    if clipped_psi >= 75.0 or risk_level == "CRITICAL":
        bar_color = "#D32F2F"  # Deep Crimson
    elif clipped_psi >= 50.0 or risk_level == "WARNING":
        bar_color = "#FDD835"  # Vivid Amber
    else:
        bar_color = "#4CAF50"  # Cool Green

    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=round(clipped_psi, 1),
            number={"suffix": " PSI", "font": {"size": 32, "color": "#FFFFFF", "family": "Arial"}},
            title={"text": "<b>PEAK STRESS INDEX</b>", "font": {"size": 16, "color": "#E0E0E0"}},
            gauge={
                "axis": {"range": [0, 100], "tickwidth": 1, "tickcolor": "#B0BEC5", "dtick": 25},
                "bar": {"color": bar_color, "thickness": 0.3},
                "bgcolor": "rgba(255, 255, 255, 0.05)",
                "borderwidth": 1,
                "bordercolor": "rgba(255, 255, 255, 0.2)",
                "steps": [
                    {"range": [0, 50], "color": "rgba(76, 175, 80, 0.35)"},  # Nominal
                    {"range": [50, 75], "color": "rgba(255, 193, 7, 0.45)"},  # Warning
                    {"range": [75, 100], "color": "rgba(211, 47, 47, 0.55)"},  # Critical
                ],
                "threshold": {
                    "line": {"color": "#FF5252", "width": 4},
                    "thickness": 0.8,
                    "value": 75.0,
                },
            },
        )
    )

    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=20, r=20, t=40, b=20),
        height=220,
    )
    return fig


def create_time_series_chart(
    history_timestamps: List[float],
    history_psi: List[float],
) -> go.Figure:
    """Create a rolling time-series chart of PSI over time with danger threshold fences.

    Args:
        history_timestamps: List of frame indices or relative timestamps in seconds.
        history_psi: List of smoothed PSI values.

    Returns:
        Plotly Figure object displaying rolling stress momentum.
    """
    x_data = history_timestamps if history_timestamps else [0.0]
    y_data = history_psi if history_psi else [0.0]

    # Dynamic line color based on most recent value
    latest_val = y_data[-1] if y_data else 0.0
    if latest_val >= 75.0:
        line_color = "#FF5252"
    elif latest_val >= 50.0:
        line_color = "#FFD54F"
    else:
        line_color = "#64B5F6"

    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=x_data,
            y=y_data,
            mode="lines",
            name="Smoothed PSI",
            line=dict(color=line_color, width=2.5),
            fill="tozeroy",
            fillcolor="rgba(30, 136, 229, 0.15)",
        )
    )

    # Threshold horizontal reference lines
    fig.add_hline(
        y=50.0,
        line_dash="dash",
        line_color="#FFA000",
        annotation_text="Warning (50)",
        annotation_position="top left",
        annotation_font=dict(color="#FFA000", size=10),
    )
    fig.add_hline(
        y=75.0,
        line_dash="dash",
        line_color="#D32F2F",
        annotation_text="Critical (75)",
        annotation_position="top left",
        annotation_font=dict(color="#D32F2F", size=10),
    )

    fig.update_layout(
        title=dict(text="<b>STRESS TIMELINE (PSI over time)</b>", font=dict(color="#E0E0E0", size=13)),
        xaxis=dict(
            title="Timeline (Frames)",
            showgrid=True,
            gridcolor="rgba(255, 255, 255, 0.1)",
            color="#B0BEC5",
        ),
        yaxis=dict(
            title="Stress (PSI)",
            range=[0, 105],
            showgrid=True,
            gridcolor="rgba(255, 255, 255, 0.1)",
            color="#B0BEC5",
        ),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=20, r=20, t=35, b=20),
        height=180,
        showlegend=False,
    )
    return fig


def create_risk_badge_html(risk_level: str, action: str) -> str:
    """Generate high-contrast HTML pill badge for the current risk tier."""
    if risk_level == "CRITICAL" or risk_level == RiskLevel.CRITICAL:
        bg_color = "#B71C1C"
        border_color = "#FF5252"
        badge_text = "CRITICAL ALERT"
    elif risk_level == "WARNING" or risk_level == RiskLevel.WARNING:
        bg_color = "#E65100"
        border_color = "#FFB300"
        badge_text = "WARNING"
    else:
        bg_color = "#1B5E20"
        border_color = "#4CAF50"
        badge_text = "NOMINAL"

    html = f"""
    <div style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background-color: {bg_color};
        border: 2px solid {border_color};
        color: #FFFFFF;
        padding: 6px 14px;
        border-radius: 20px;
        font-weight: bold;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    ">
        <span>{badge_text}</span>
        <span style="opacity: 0.85; font-size: 12px;">• {action}</span>
    </div>
    """
    return html


def create_alert_banner_html(risk_state: RiskStateResult) -> str:
    """Generate a prominent full-width early-warning alert banner with operational instructions."""
    level = risk_state.level
    psi = round(risk_state.smoothed_psi, 1)

    if level == RiskLevel.CRITICAL:
        banner_bg = "linear-gradient(90deg, #B71C1C 0%, #880E4F 100%)"
        border_color = "#FF5252"
        icon = "🚨"
        headline = "CRITICAL SURGE DETECTED"
        instruction = "HALT INGRESS IMMEDIATELY — Open emergency diversion corridors & throttle turnstiles!"
        pulse_style = "box-shadow: 0 0 15px rgba(255, 82, 82, 0.6);"
    elif level == RiskLevel.WARNING:
        banner_bg = "linear-gradient(90deg, #E65100 0%, #F57F17 100%)"
        border_color = "#FFD54F"
        icon = "⚠️"
        headline = "ELEVATED CROWD COMPRESSION"
        instruction = "ACTION REQUIRED: THROTTLE GATES BY 50% — Slow intake until bottleneck clears."
        pulse_style = "box-shadow: 0 0 10px rgba(255, 179, 0, 0.4);"
    else:
        banner_bg = "linear-gradient(90deg, #1B5E20 0%, #2E7D32 100%)"
        border_color = "#81C784"
        icon = "✅"
        headline = "CROWD FLOW NOMINAL"
        instruction = "Normal crowd movement. Standard ingress flow permitted."
        pulse_style = ""

    html = f"""
    <div style="
        background: {banner_bg};
        border: 2px solid {border_color};
        border-radius: 8px;
        padding: 12px 18px;
        color: #FFFFFF;
        font-family: Arial, sans-serif;
        margin-bottom: 12px;
        {pulse_style}
    ">
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 16px; font-weight: bold; letter-spacing: 0.5px;">
                {icon} {headline}
            </div>
            <div style="font-size: 14px; background: rgba(0,0,0,0.3); padding: 3px 8px; border-radius: 4px;">
                PSI: {psi}
            </div>
        </div>
        <div style="margin-top: 6px; font-size: 13px; opacity: 0.95; line-height: 1.4;">
            {instruction}
        </div>
    </div>
    """
    return html
