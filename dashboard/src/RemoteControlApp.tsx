import { useEffect, useMemo, useRef, useState } from 'react'
import { addDoc, collection, doc, setDoc } from 'firebase/firestore'
import { BellRing, HeartPulse, Mic } from 'lucide-react'
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
  const [heartbeatBpm, setHeartbeatBpm] = useState(72)
  const [soundDb, setSoundDb] = useState(33)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [soundHoldActive, setSoundHoldActive] = useState(false)
  const [heartBoost, setHeartBoost] = useState(0)
  const [statusMessage, setStatusMessage] = useState('Ready. Remote simulator is connected.')
  const [sendError, setSendError] = useState<string | null>(null)

  const lastSoundAlertAt = useRef(0)
  const lastHeartbeatAlertAt = useRef(0)
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
        isEmergencyMode: emergencyMode,
      },
      { merge: true },
    )
  }

  function handleEmergencyToggle(): void {
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
    setHeartBoost((prev) => {
      const next = Math.min(prev + randomBetween(7, 14), 50)
      heartBoostRef.current = next
      return next
    })
    setStatusMessage('Heart-rate stress pulse triggered.')
  }

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

      const emergencyMode = emergencyRef.current
      const soundHeld = soundHoldRef.current
      const currentBoost = heartBoostRef.current

      const currentHeartbeat = heartbeatRef.current
      const baseTarget = emergencyMode
          ? STRESSED_HEART_TARGET + randomBetween(-4, 8)
          : randomBetween(RESTING_HEART_MIN, RESTING_HEART_MAX)

      const boostedTarget = baseTarget + currentBoost
      const nextHeartbeat = clamp(
        currentHeartbeat + (boostedTarget - currentHeartbeat) * 0.33 + randomBetween(-1.5, 1.6),
        58,
        HEART_LIMIT_MAX,
      )

      const currentSound = soundRef.current
      const nextSound = soundHeld
        ? clamp(currentSound + randomBetween(2.5, 5.5), AMBIENT_DB_MIN, SOUND_MAX_DB)
        : clamp(currentSound + (randomBetween(AMBIENT_DB_MIN, AMBIENT_DB_MAX) - currentSound) * 0.4, AMBIENT_DB_MIN, SOUND_MAX_DB)

      const nextBoost = Math.max(0, currentBoost - 2.5)

      heartbeatRef.current = nextHeartbeat
      soundRef.current = nextSound
      heartBoostRef.current = nextBoost
      setHeartbeatBpm(nextHeartbeat)
      setSoundDb(nextSound)
      setHeartBoost(nextBoost)

      if (nextHeartbeat >= 116 && now - lastHeartbeatAlertAt.current > 25000) {
        lastHeartbeatAlertAt.current = now
        void pushAlert('heartbeat', 'Elevated heartbeat pattern observed in simulator.').catch((error: unknown) => {
          setSendError(String(error))
        })
      }

      if (soundHeld && nextSound >= 72 && now - lastSoundAlertAt.current > 18000) {
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
  }, [heartbeatBpm, soundDb, isEmergencyMode])

  function startSoundHold(): void {
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
            {sendError ? <p className="mt-2 text-xs text-rose-300">{sendError}</p> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
