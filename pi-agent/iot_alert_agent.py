"""Raspberry Pi Zero 2 W IoT alert sender for domestic violence rescue workflows."""

from __future__ import annotations

import os
import signal
import sys
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Deque

import firebase_admin
import RPi.GPIO as GPIO
from firebase_admin import credentials, firestore
from dotenv import load_dotenv


@dataclass
class Config:
    firebase_credential_path: str
    firebase_project_id: str
    device_id: str
    button_gpio: int
    sound_gpio: int
    heartbeat_gpio: int
    poll_interval_seconds: float
    button_debounce_seconds: float
    sound_trigger_window: int
    heartbeat_high_bpm: int
    heartbeat_low_bpm: int


class IoTAlertAgent:
    def __init__(self, config: Config) -> None:
        self.config = config
        self._stop = False
        self._last_button_press = 0.0
        self._sound_window: Deque[int] = deque(maxlen=config.sound_trigger_window)
        self._last_heartbeat_edge = 0.0
        self._current_bpm = 0

        self.db = self._init_firebase()
        self._init_gpio()

    def _init_firebase(self) -> firestore.Client:
        if not firebase_admin._apps:
            cred = credentials.Certificate(self.config.firebase_credential_path)
            firebase_admin.initialize_app(
                cred,
                {
                    'projectId': self.config.firebase_project_id,
                },
            )
        return firestore.client()

    def _init_gpio(self) -> None:
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.config.button_gpio, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(self.config.sound_gpio, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
        GPIO.setup(self.config.heartbeat_gpio, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

    def _record_heartbeat_edge(self) -> None:
        now = time.time()
        if self._last_heartbeat_edge > 0:
            interval = now - self._last_heartbeat_edge
            if interval > 0:
                bpm = int(60.0 / interval)
                if 30 <= bpm <= 220:
                    self._current_bpm = bpm
        self._last_heartbeat_edge = now

    def _read_button(self) -> bool:
        # Button wired active low (pressed => GPIO.LOW)
        pressed = GPIO.input(self.config.button_gpio) == GPIO.LOW
        if not pressed:
            return False

        now = time.time()
        if now - self._last_button_press < self.config.button_debounce_seconds:
            return False

        self._last_button_press = now
        return True

    def _read_sound_trigger(self) -> bool:
        sound_state = 1 if GPIO.input(self.config.sound_gpio) == GPIO.HIGH else 0
        self._sound_window.append(sound_state)

        if len(self._sound_window) < self._sound_window.maxlen:
            return False

        # Require sustained high readings to filter spikes/noise.
        return sum(self._sound_window) >= max(2, self.config.sound_trigger_window - 1)

    def _read_heartbeat_abnormal(self) -> bool:
        current = GPIO.input(self.config.heartbeat_gpio)
        if current == GPIO.HIGH:
            self._record_heartbeat_edge()

        if self._current_bpm == 0:
            return False

        return (
            self._current_bpm >= self.config.heartbeat_high_bpm
            or self._current_bpm <= self.config.heartbeat_low_bpm
        )

    def _build_alert_payload(
        self,
        alert_type: str,
        message: str,
        sound_level: int,
    ) -> dict:
        created_at = int(time.time() * 1000)
        return {
            'createdAt': created_at,
            'deviceId': self.config.device_id,
            'alertType': alert_type,
            'message': message,
            'complaintStatus': 'new',
            'heartbeatBpm': self._current_bpm if self._current_bpm > 0 else None,
            'soundLevel': sound_level,
            'createdAtIso': datetime.now(timezone.utc).isoformat(),
        }

    def _push_alert(self, payload: dict) -> None:
        self.db.collection('alerts').add(payload)
        print(f"[{payload['createdAtIso']}] alert pushed: {payload['alertType']}")

    def run(self) -> None:
        print('IoT alert agent started. Press CTRL+C to stop.')
        try:
            while not self._stop:
                button_trigger = self._read_button()
                sound_trigger = self._read_sound_trigger()
                heartbeat_trigger = self._read_heartbeat_abnormal()

                alert_type = None
                message = None

                if button_trigger and (sound_trigger or heartbeat_trigger):
                    alert_type = 'multi_sensor'
                    message = 'Manual SOS plus physiological/environmental anomaly detected.'
                elif button_trigger:
                    alert_type = 'manual'
                    message = 'Manual SOS button pressed by victim.'
                elif heartbeat_trigger:
                    alert_type = 'heartbeat'
                    message = 'Abnormal heartbeat trend detected.'
                elif sound_trigger:
                    alert_type = 'sound'
                    message = 'High-risk acoustic pattern detected.'

                if alert_type:
                    payload = self._build_alert_payload(
                        alert_type=alert_type,
                        message=message,
                        sound_level=sum(self._sound_window),
                    )
                    self._push_alert(payload)

                time.sleep(self.config.poll_interval_seconds)
        finally:
            GPIO.cleanup()
            print('GPIO cleaned up, agent stopped.')

    def stop(self, *_args: object) -> None:
        self._stop = True


def env_value(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None:
        raise RuntimeError(f'Missing required environment variable: {name}')
    return value


def load_config() -> Config:
    return Config(
        firebase_credential_path=env_value('FIREBASE_CREDENTIAL_PATH'),
        firebase_project_id=env_value('FIREBASE_PROJECT_ID'),
        device_id=env_value('DEVICE_ID', 'pi-zero-2w-01'),
        button_gpio=int(env_value('BUTTON_GPIO', '17')),
        sound_gpio=int(env_value('SOUND_GPIO', '27')),
        heartbeat_gpio=int(env_value('HEARTBEAT_GPIO', '22')),
        poll_interval_seconds=float(env_value('POLL_INTERVAL_SECONDS', '1.0')),
        button_debounce_seconds=float(env_value('BUTTON_DEBOUNCE_SECONDS', '1.5')),
        sound_trigger_window=int(env_value('SOUND_TRIGGER_WINDOW', '4')),
        heartbeat_high_bpm=int(env_value('HEARTBEAT_HIGH_BPM', '120')),
        heartbeat_low_bpm=int(env_value('HEARTBEAT_LOW_BPM', '45')),
    )


def main() -> int:
    try:
        load_dotenv()
        config = load_config()
        agent = IoTAlertAgent(config)
        signal.signal(signal.SIGINT, agent.stop)
        signal.signal(signal.SIGTERM, agent.stop)
        agent.run()
        return 0
    except Exception as exc:
        print(f'Fatal error: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
