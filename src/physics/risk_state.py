"""Asymmetric temporal smoothing, 3-tier risk classification, and hysteresis debouncing."""

from dataclasses import dataclass
from enum import Enum
from typing import Optional

import numpy as np

from src.config import RiskConfig, SmoothingConfig


class RiskLevel(str, Enum):
    """Standardized operating regimes for crowd crush risk."""

    NOMINAL = "NOMINAL"  # PSI 0–49: normal flowing crowd, green state
    WARNING = "WARNING"  # PSI 50–74: compression mounting, throttle gates
    CRITICAL = "CRITICAL"  # PSI 75–100: severe crush danger, halt ingress immediately


@dataclass
class RiskStateResult:
    """Evaluated risk state with operational guidance."""

    level: RiskLevel
    smoothed_psi: float
    raw_psi: float
    action_recommended: str
    hold_counter: int
    in_hysteresis: bool


class AsymmetricEMA:
    """Exponential Moving Average filter with fast-attack rise and slow-decay fall.

    Responds swiftly to sudden crowd rushes (3–5 frames) while cooling down gradually
    (20–30 frames) to prevent premature all-clear signals while physical compression lingers.
    """

    def __init__(self, config: Optional[SmoothingConfig] = None) -> None:
        self.config = config or SmoothingConfig()
        self._value: Optional[float] = None
        self._map_value: Optional[np.ndarray] = None

    def update(self, current_value: float) -> float:
        """Update scalar EMA filter with asymmetric rise/fall alpha."""
        if self._value is None:
            self._value = float(current_value)
            return self._value

        if current_value >= self._value:
            alpha = self.config.alpha_rise
        else:
            alpha = self.config.alpha_fall

        self._value = float(alpha * current_value + (1.0 - alpha) * self._value)
        return self._value

    def update_map(self, current_map: np.ndarray) -> np.ndarray:
        """Update 2D spatial stress map using vectorized asymmetric EMA."""
        if self._map_value is None or self._map_value.shape != current_map.shape:
            self._map_value = current_map.astype(np.float32).copy()
            return self._map_value.copy()

        alpha_matrix = np.where(
            current_map >= self._map_value,
            self.config.alpha_rise,
            self.config.alpha_fall,
        ).astype(np.float32)

        self._map_value = (
            alpha_matrix * current_map + (1.0 - alpha_matrix) * self._map_value
        ).astype(np.float32)
        return self._map_value.copy()

    def reset(self) -> None:
        """Reset internal filter states."""
        self._value = None
        self._map_value = None


class RiskStateMachine:
    """Stateful hysteresis machine managing Nominal, Warning, and Critical transitions."""

    def __init__(
        self,
        risk_config: Optional[RiskConfig] = None,
        smoothing_config: Optional[SmoothingConfig] = None,
    ) -> None:
        self.risk_config = risk_config or RiskConfig()
        self.ema = AsymmetricEMA(smoothing_config)
        self.current_level = RiskLevel.NOMINAL
        self.hold_counter = 0

    def process(self, raw_psi: float) -> RiskStateResult:
        """Process instantaneous PSI, smooth temporally, and evaluate risk tier with hysteresis."""
        smoothed_psi = self.ema.update(raw_psi)

        warn_th = self.risk_config.warning_threshold
        crit_th = self.risk_config.critical_threshold
        buf = self.risk_config.hysteresis_buffer
        deescalate_frames = self.risk_config.deescalation_frames

        # 1. Escalation Checks (Instantaneous)
        if smoothed_psi >= crit_th:
            self.current_level = RiskLevel.CRITICAL
            self.hold_counter = 0
        elif smoothed_psi >= warn_th:
            if self.current_level == RiskLevel.NOMINAL:
                self.current_level = RiskLevel.WARNING
                self.hold_counter = 0

        # 2. De-escalation Checks (Debounced with Hysteresis Buffer)
        in_buffer_zone = False

        if self.current_level == RiskLevel.CRITICAL:
            recovery_target = crit_th - buf  # e.g., 70.0
            if smoothed_psi < recovery_target:
                self.hold_counter += 1
                in_buffer_zone = True
                if self.hold_counter >= deescalate_frames:
                    # Sustained drop: de-escalate
                    if smoothed_psi < (warn_th - buf):
                        self.current_level = RiskLevel.NOMINAL
                    else:
                        self.current_level = RiskLevel.WARNING
                    self.hold_counter = 0
            else:
                self.hold_counter = 0
                if smoothed_psi < crit_th:
                    in_buffer_zone = True

        elif self.current_level == RiskLevel.WARNING:
            recovery_target = warn_th - buf  # e.g., 45.0
            if smoothed_psi < recovery_target:
                self.hold_counter += 1
                in_buffer_zone = True
                if self.hold_counter >= deescalate_frames:
                    self.current_level = RiskLevel.NOMINAL
                    self.hold_counter = 0
            else:
                self.hold_counter = 0
                if smoothed_psi < warn_th:
                    in_buffer_zone = True

        # 3. Operational Actions Mapping
        action_map = {
            RiskLevel.NOMINAL: "NORMAL_FLOW",
            RiskLevel.WARNING: "THROTTLE_GATES",
            RiskLevel.CRITICAL: "HALT_INGRESS",
        }

        return RiskStateResult(
            level=self.current_level,
            smoothed_psi=smoothed_psi,
            raw_psi=raw_psi,
            action_recommended=action_map[self.current_level],
            hold_counter=self.hold_counter,
            in_hysteresis=in_buffer_zone,
        )

    def reset(self) -> None:
        """Reset state machine and temporal filters to nominal defaults."""
        self.ema.reset()
        self.current_level = RiskLevel.NOMINAL
        self.hold_counter = 0
