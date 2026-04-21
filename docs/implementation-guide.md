# End-to-End Implementation Guide

This guide matches the repository implementation using:
- Raspberry Pi Zero 2 W + GPIO sensors
- Python + firebase-admin
- Firestore for alert and complaint tracking
- React (Vite) + Tailwind + shadcn/ui + Tremor

## 1) Exact Frontend Initialization Commands

If recreating from scratch:

```powershell
cd "c:\Users\Red\Downloads\INV69 project"
npm create vite@latest dashboard -- --template react-ts
cd dashboard
npm install
npm install -D tailwindcss@3.4.17 postcss autoprefixer @types/node
npx tailwindcss init -p
npm install firebase @tremor/react recharts lucide-react clsx tailwind-merge class-variance-authority
npx shadcn@latest init
npx shadcn@latest add card badge table
```

## 2) Raspberry Pi Wiring

Use the exact map in `docs/wiring-pinout.md`.

GPIO summary:
- Push button: GPIO17 (active low)
- Sound sensor DO: GPIO27
- Heartbeat signal: GPIO22
- Power sensors from 3.3V and common GND

## 3) Firebase Setup

1. Create Firebase project.
2. Enable Firestore in production mode.
3. Create Firebase web app for dashboard and copy config values.
4. Create service account key for Pi agent.
5. Save service account JSON securely on Pi.
6. Apply rules from `docs/firebase-security-rules.md`.

## 4) Configure Dashboard

```powershell
cd "c:\Users\Red\Downloads\INV69 project\dashboard"
copy .env.example .env
```

Fill in values:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Run:

```powershell
npm run dev
```

Production build:

```powershell
npm run build
npm run preview
```

## 5) Configure Raspberry Pi Agent

```bash
cd ~/INV69-project/pi-agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `.env` values:
- `FIREBASE_CREDENTIAL_PATH=/home/pi/secrets/firebase-service-account.json`
- `FIREBASE_PROJECT_ID=your-project-id`
- `DEVICE_ID=pi-zero-2w-01`
- `BUTTON_GPIO=17`
- `SOUND_GPIO=27`
- `HEARTBEAT_GPIO=22`
- `POLL_INTERVAL_SECONDS=1.0`
- `BUTTON_DEBOUNCE_SECONDS=1.5`
- `SOUND_TRIGGER_WINDOW=4`
- `HEARTBEAT_HIGH_BPM=120`
- `HEARTBEAT_LOW_BPM=45`

Run agent:

```bash
python iot_alert_agent.py
```

## 6) How False Positives Are Reduced

The Python service includes:
- Button debounce window (`BUTTON_DEBOUNCE_SECONDS`) to avoid repeated triggers.
- Sound sliding window (`SOUND_TRIGGER_WINDOW`) to require sustained sound highs.
- Heartbeat bounds checks (`HEARTBEAT_LOW_BPM`, `HEARTBEAT_HIGH_BPM`) to ignore noise and detect only abnormal values.
- Multi-sensor escalation to tag high-confidence incidents.

## 7) Complaint Tracking Workflow

1. Pi pushes alert document to `alerts` collection.
2. Dashboard listens with Firestore `onSnapshot` and updates immediately.
3. Responder/admin updates `complaintStatus`.
4. Dashboard table reflects lifecycle: `new`, `in_progress`, `closed`.
