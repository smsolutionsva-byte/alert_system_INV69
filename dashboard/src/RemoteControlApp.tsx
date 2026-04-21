import { useEffect, useMemo, useRef, useState } from 'react'
import { addDoc, collection, doc, setDoc } from 'firebase/firestore'
import { BellRing, HeartPulse, Mic, Wifi, WifiOff } from 'lucide-react'
import { db } from '@/lib/firebase'

const DEVICE_ID = 'remote-simulator-01'

// Reference anchors:
// - Resting heart rate for adults is commonly 60-100 bpm (AHA).
// - Normal conversation is often around 60-70 dBA and prolonged >=85 dBA can be harmful (NIDCD).
const RESTING_HEART_MIN = 64
const RESTING_HEART_MAX = 82
const STRESSED_HEART_TARGET = 108
const HEART_LIMIT_MAX = 142
const AMBIENT_DB_MIN = 30
const AMBIENT_DB_MAX = 38
const SOUND_MAX_DB = 88

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function RemoteControlApp() {
  const [heartbeatBpm, setHeartbeatBpm] = useState(0)
  const [soundDb, setSoundDb] = useState(0)
  const [isDeviceOnline, setIsDeviceOnline] = useState(false)
  const [isHeartSensorEnabled, setIsHeartSensorEnabled] = useState(false)
  const [isSoundSensorEnabled, setIsSoundSensorEnabled] = useState(false)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [soundHoldActive, setSoundHoldActive] = useState(false)
  const [heartBoost, setHeartBoost] = useState(0)
  const [statusMessage, setStatusMessage] = useState('Simulator is offline. Turn Device Online ON.')
  const [sendError, setSendError] = useState<string | null>(null)

  const lastSoundAlertAt = useRef(0)
  const lastHeartbeatAlertAt = useRef(0)
  const onlineRef = useRef(isDeviceOnline)
  const heartSensorRef = useRef(isHeartSensorEnabled)
  const soundSensorRef = useRef(isSoundSensorEnabled)
  const emergencyRef = useRef(isEmergencyMode)
  const soundHoldRef = useRef(soundHoldActive)
  const heartBoostRef = useRef(heartBoost)
  const heartbeatRef = useRef(heartbeatBpm)
  const soundRef = useRef(soundDb)

  const roundedHeartbeat = Math.round(heartbeatBpm)
  const roundedSound = Math.round(soundDb)

  const connectionHint = useMemo(() => {
    if (sendError) {
      return 'Write failed. Check Firestore rules for simulator writes.'
    }
    return 'Live writes are enabled to Firestore telemetry/live.'
  }, [sendError])

  async function pushAlert(alertType: 'manual' | 'sound' | 'heartbeat' | 'multi_sensor', message: string): Promise<void> {
    const now = Date.now()
    await addDoc(collection(db, 'alerts'), {
      createdAt: now,
      createdAtIso: new Date(now).toISOString(),
      deviceId: DEVICE_ID,
      source: 'remote-simulator',
      alertType,
      message,
      complaintStatus: 'new',
      heartbeatBpm: Math.round(heartbeatBpm),
      soundLevel: Math.round(soundDb),
    })
  }

  async function pushTelemetry(nextHeartbeat: number, nextSound: number, emergencyMode: boolean): Promise<void> {
    const now = Date.now()
    await setDoc(
      doc(db, 'telemetry', 'live'),
      {
        updatedAt: now,
        updatedAtIso: new Date(now).toISOString(),
        deviceId: DEVICE_ID,
        source: 'remote-simulator',
        heartbeatBpm: Math.round(nextHeartbeat),
        soundDb: Math.round(nextSound),
        isDeviceOnline,
        isHeartSensorEnabled,
        isSoundSensorEnabled,
        isEmergencyMode: emergencyMode,
      },
      { merge: true },
    )
  }

  function handleDeviceOnlineToggle(): void {
    const next = !isDeviceOnline
    setIsDeviceOnline(next)
    onlineRef.current = next

    if (!next) {
      setIsEmergencyMode(false)
      emergencyRef.current = false
      setSoundHoldActive(false)
      soundHoldRef.current = false
      setHeartBoost(0)
      heartBoostRef.current = 0
      setHeartbeatBpm(0)
      heartbeatRef.current = 0
      setSoundDb(0)
      soundRef.current = 0
      setStatusMessage('Device set to OFFLINE. Dashboard should show offline now.')
      return
    }

    setStatusMessage('Device is ONLINE. Enable sensors to stream live values.')
  }

  function handleHeartSensorToggle(): void {
    const next = !isHeartSensorEnabled
    setIsHeartSensorEnabled(next)
    heartSensorRef.current = next

    if (!next) {
      setHeartBoost(0)
      heartBoostRef.current = 0
      setHeartbeatBpm(0)
      heartbeatRef.current = 0
      setStatusMessage('Heart sensor OFF. Heartbeat value set to 0.')
      return
    }

    const baseline = randomBetween(RESTING_HEART_MIN, RESTING_HEART_MAX)
    setHeartbeatBpm(baseline)
    heartbeatRef.current = baseline
    setStatusMessage('Heart sensor ON. Resting heartbeat simulation started.')
  }

  function handleSoundSensorToggle(): void {
    const next = !isSoundSensorEnabled
    setIsSoundSensorEnabled(next)
    soundSensorRef.current = next

    if (!next) {
      setSoundHoldActive(false)
      soundHoldRef.current = false
      setSoundDb(0)
      soundRef.current = 0
      setStatusMessage('Sound sensor OFF. Sound value set to 0 dB.')
      return
    }

    const ambient = randomBetween(AMBIENT_DB_MIN, AMBIENT_DB_MAX)
    setSoundDb(ambient)
    soundRef.current = ambient
    setStatusMessage('Sound sensor ON. Ambient low dB simulation started.')
  }

  function handleEmergencyToggle(): void {
    if (!isDeviceOnline) {
      setStatusMessage('Turn Device Online ON before triggering emergency mode.')
      return
    }

    const next = !isEmergencyMode
    setIsEmergencyMode(next)
    emergencyRef.current = next

    if (next) {
      setHeartBoost((prev) => Math.min(prev + 16, 52))
      void pushAlert('manual', 'Emergency mode activated from remote simulator.').catch((error: unknown) => {
        setSendError(String(error))
      })
      setStatusMessage('Emergency mode ON. Alert pushed.')
    } else {
      setStatusMessage('Emergency mode OFF.')
    }
  }

  function handleHeartButton(): void {
    if (!isDeviceOnline || !isHeartSensorEnabled) {
      setStatusMessage('Enable Device Online and Heart Sensor first.')
      return
    }

    setHeartBoost((prev) => {
      const next = Math.min(prev + randomBetween(7, 14), 50)
      heartBoostRef.current = next
      return next
    })
    setStatusMessage('Heart-rate stress pulse triggered.')
  }

  useEffect(() => {
    onlineRef.current = isDeviceOnline
  }, [isDeviceOnline])

  useEffect(() => {
    heartSensorRef.current = isHeartSensorEnabled
  }, [isHeartSensorEnabled])

  useEffect(() => {
    soundSensorRef.current = isSoundSensorEnabled
  }, [isSoundSensorEnabled])

  useEffect(() => {
    emergencyRef.current = isEmergencyMode
  }, [isEmergencyMode])

  useEffect(() => {
    soundHoldRef.current = soundHoldActive
  }, [soundHoldActive])

  useEffect(() => {
    heartBoostRef.current = heartBoost
  }, [heartBoost])

  useEffect(() => {
    heartbeatRef.current = heartbeatBpm
  }, [heartbeatBpm])

  useEffect(() => {
    soundRef.current = soundDb
  }, [soundDb])

  useEffect(() => {
    const tick = window.setInterval(() => {
      const now = Date.now()

      const deviceOnline = onlineRef.current
      const heartSensorEnabled = heartSensorRef.current
      const soundSensorEnabled = soundSensorRef.current
      const emergencyMode = emergencyRef.current
      const soundHeld = soundHoldRef.current
      const currentBoost = heartBoostRef.current

      if (!deviceOnline) {
        heartbeatRef.current = 0
        soundRef.current = 0
        heartBoostRef.current = 0
        setHeartbeatBpm(0)
        setSoundDb(0)
        setHeartBoost(0)
        return
      }

      const currentHeartbeat = heartbeatRef.current
      const baseTarget = heartSensorEnabled
        ? emergencyMode
          ? STRESSED_HEART_TARGET + randomBetween(-4, 8)
          : randomBetween(RESTING_HEART_MIN, RESTING_HEART_MAX)
        : 0

      const boostedTarget = baseTarget + currentBoost
      const nextHeartbeat = heartSensorEnabled
        ? clamp(
            currentHeartbeat + (boostedTarget - currentHeartbeat) * 0.33 + randomBetween(-1.5, 1.6),
            58,
            HEART_LIMIT_MAX,
          )
        : 0

      const currentSound = soundRef.current
      const nextSound = soundSensorEnabled
        ? soundHeld
          ? clamp(currentSound + randomBetween(2.5, 5.5), AMBIENT_DB_MIN, SOUND_MAX_DB)
          : clamp(
              currentSound + (randomBetween(AMBIENT_DB_MIN, AMBIENT_DB_MAX) - currentSound) * 0.4,
              AMBIENT_DB_MIN,
              SOUND_MAX_DB,
            )
        : 0

      const nextBoost = heartSensorEnabled ? Math.max(0, currentBoost - 2.5) : 0

      heartbeatRef.current = nextHeartbeat
      soundRef.current = nextSound
      heartBoostRef.current = nextBoost
      setHeartbeatBpm(nextHeartbeat)
      setSoundDb(nextSound)
      setHeartBoost(nextBoost)

      if (heartSensorEnabled && nextHeartbeat >= 116 && now - lastHeartbeatAlertAt.current > 25000) {
        lastHeartbeatAlertAt.current = now
        void pushAlert('heartbeat', 'Elevated heartbeat pattern observed in simulator.').catch((error: unknown) => {
          setSendError(String(error))
        })
      }

      if (soundSensorEnabled && soundHeld && nextSound >= 72 && now - lastSoundAlertAt.current > 18000) {
        lastSoundAlertAt.current = now
        void pushAlert('sound', 'High-risk sound intensity detected in simulator.').catch((error: unknown) => {
          setSendError(String(error))
        })
      }
    }, 1000)

    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    void pushTelemetry(heartbeatBpm, soundDb, isEmergencyMode)
      .then(() => {
        setSendError(null)
      })
      .catch((error: unknown) => {
        setSendError(String(error))
      })
  }, [heartbeatBpm, soundDb, isEmergencyMode, isDeviceOnline, isHeartSensorEnabled, isSoundSensorEnabled])

  function startSoundHold(): void {
    if (!isDeviceOnline || !isSoundSensorEnabled) {
      setStatusMessage('Enable Device Online and Sound Sensor first.')
      return
    }

    soundHoldRef.current = true
    setSoundHoldActive(true)
  }

  function stopSoundHold(): void {
    soundHoldRef.current = false
    setSoundHoldActive(false)
  }

  const soundButtonEvents = {
    onMouseDown: startSoundHold,
    onMouseUp: stopSoundHold,
    onMouseLeave: stopSoundHold,
    onTouchStart: startSoundHold,
    onTouchEnd: stopSoundHold,
    onTouchCancel: stopSoundHold,
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 text-slate-100 sm:px-6">
      <section className="rounded-2xl border border-cyan-500/25 bg-[#071935]/85 p-5 shadow-[0_24px_60px_rgba(1,8,24,0.75)] backdrop-blur">
        <h1 className="text-2xl font-semibold text-cyan-300 sm:text-3xl">INV69 Remote Sensor Simulator</h1>
        <p className="mt-2 text-sm text-slate-300">
          Open this page from mobile to simulate Raspberry Pi sensor values remotely.
        </p>

        <div className="mt-4 grid gap-3 rounded-xl border border-cyan-500/20 bg-[#0b2148] p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Heartbeat</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-300">{roundedHeartbeat} bpm</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Sound</p>
            <p className="mt-1 text-3xl font-semibold text-cyan-300">{roundedSound} dB</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
            <p className="mt-1 text-sm text-slate-200">{statusMessage}</p>
            <p className="mt-1 text-xs text-slate-400">{connectionHint}</p>
            <p className="mt-2 text-xs text-slate-400">
              Device: {isDeviceOnline ? 'Online' : 'Offline'} | Heart Sensor: {isHeartSensorEnabled ? 'On' : 'Off'} | Sound Sensor:{' '}
              {isSoundSensorEnabled ? 'On' : 'Off'}
            </p>
            {sendError ? <p className="mt-2 text-xs text-rose-300">{sendError}</p> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={handleDeviceOnlineToggle}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/20 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/35"
          >
            {isDeviceOnline ? <Wifi className="size-5" /> : <WifiOff className="size-5" />}
            {isDeviceOnline ? 'Device Online' : 'Device Offline'}
          </button>

          <button
            type="button"
            onClick={handleHeartSensorToggle}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/35"
          >
            <HeartPulse className="size-5" />
            {isHeartSensorEnabled ? 'Heart Sensor ON' : 'Heart Sensor OFF'}
          </button>

          <button
            type="button"
            onClick={handleSoundSensorToggle}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/35"
          >
            <Mic className="size-5" />
            {isSoundSensorEnabled ? 'Sound Sensor ON' : 'Sound Sensor OFF'}
          </button>

          <button
            type="button"
            onClick={handleEmergencyToggle}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/20 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/35"
          >
            <BellRing className="size-5" />
            {isEmergencyMode ? 'Emergency ON' : 'Emergency Mode'}
          </button>

          <button
            type="button"
            onClick={handleHeartButton}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/35"
          >
            <HeartPulse className="size-5" />
            Heart Pulse
          </button>

          <button
            type="button"
            {...soundButtonEvents}
            className="flex min-h-16 items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/35"
          >
            <Mic className="size-5" />
            Hold for Sound
          </button>
        </div>
      </section>
    </main>
  )
}
