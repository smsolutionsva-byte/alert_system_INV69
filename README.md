# IoT Based Domestic Violence Alert and Complaint Tracking System

This repository includes:
- `pi-agent/`: Raspberry Pi Zero 2 W Python service for sensor monitoring + Firebase pushes.
- `dashboard/`: React + Vite + Tailwind + Tremor monitoring dashboard.
- `docs/`: Wiring instructions and Firebase security rules.

Detailed step-by-step implementation is in `docs/implementation-guide.md`.

## 1) Project Structure

- `pi-agent/iot_alert_agent.py`: GPIO + false-positive filtering + Firestore push logic.
- `dashboard/src/App.tsx`: Main dashboard UI.
- `dashboard/src/lib/useAlerts.ts`: Firestore real-time listener.
- `docs/wiring-pinout.md`: Exact Pi wiring map.
- `docs/firebase-security-rules.md`: Production security rules and hardening notes.

## 2) Frontend Setup (Dashboard)

```powershell
cd "c:\Users\Red\Downloads\INV69 project\dashboard"
copy .env.example .env
# fill Firebase values in .env
npm install
npm run dev
```

### Optional shadcn/ui init (after alias + tailwind config already in repo)

```powershell
cd "c:\Users\Red\Downloads\INV69 project\dashboard"
npx shadcn@latest init
```

Choose Vite + TypeScript defaults and keep alias as `@/* -> src/*`.

## 3) Raspberry Pi Setup

```bash
cd ~/INV69-project/pi-agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# set env vars in .env
python iot_alert_agent.py
```

Required env vars:
- `FIREBASE_CREDENTIAL_PATH`
- `FIREBASE_PROJECT_ID`
- `DEVICE_ID`
- `BUTTON_GPIO`
- `SOUND_GPIO`
- `HEARTBEAT_GPIO`

## 4) Firebase Setup Steps

1. Create Firebase project.
2. Enable Firestore in production mode.
3. Create service account and download key JSON.
4. Place JSON on Pi at secure path (example `/home/pi/secrets/firebase-service-account.json`).
5. Apply rules from `docs/firebase-security-rules.md`.
6. Add web app in Firebase console and copy config values into `dashboard/.env`.

## 5) Complaint Tracking Flow

1. Pi pushes alerts into Firestore collection `alerts`.
2. Dashboard listens in real time using `onSnapshot`.
3. Responders update `complaintStatus` (`new`, `in_progress`, `closed`) via secured admin tooling.
4. Dashboard immediately reflects status changes.

## 6) Systemd Service (Pi, Optional)

Create `/etc/systemd/system/iot-alert-agent.service`:

```ini
[Unit]
Description=IoT Alert Agent
After=network-online.target

[Service]
User=pi
WorkingDirectory=/home/pi/INV69-project/pi-agent
EnvironmentFile=/home/pi/INV69-project/pi-agent/.env
ExecStart=/home/pi/INV69-project/pi-agent/.venv/bin/python /home/pi/INV69-project/pi-agent/iot_alert_agent.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable iot-alert-agent
sudo systemctl start iot-alert-agent
sudo systemctl status iot-alert-agent
```
