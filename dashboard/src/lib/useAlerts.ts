import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AlertEvent, HeartbeatPoint, LiveTelemetry } from '@/lib/types'

const SAMPLE_BPM = [72, 76, 81, 79, 84, 93, 90, 86, 95, 88, 83, 79, 76, 72]

function mapAlertDoc(doc: QueryDocumentSnapshot): AlertEvent {
  const data = doc.data() as Omit<AlertEvent, 'id'>
  return {
    id: doc.id,
    ...data,
  }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([])
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null)
  const [connected, setConnected] = useState(false)
  const [telemetryHistory, setTelemetryHistory] = useState<HeartbeatPoint[]>([])
  const [alertStreamOnline, setAlertStreamOnline] = useState(false)
  const [telemetryStreamOnline, setTelemetryStreamOnline] = useState(false)

  useEffect(() => {
    const alertRef = collection(db, 'alerts')
    const alertQuery = query(alertRef, orderBy('createdAt', 'desc'), limit(50))

    const stop = onSnapshot(
      alertQuery,
      (snapshot) => {
        setAlerts(snapshot.docs.map(mapAlertDoc))
        setAlertStreamOnline(true)
      },
      () => {
        setAlertStreamOnline(false)
      },
    )

    const telemetryRef = doc(db, 'telemetry', 'live')
    const stopTelemetry = onSnapshot(
      telemetryRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setTelemetryStreamOnline(true)
          return
        }

        const data = snapshot.data() as LiveTelemetry
        setTelemetry(data)
        setTelemetryHistory((prev) => {
          const nextPoint: HeartbeatPoint = {
            timestamp: data.updatedAt,
            bpm: data.heartbeatBpm,
            source: 'live',
          }

          const deduped = prev.filter((item) => item.timestamp !== nextPoint.timestamp)
          const next = [...deduped, nextPoint]
          return next.slice(-80)
        })
        setTelemetryStreamOnline(true)
      },
      () => {
        setTelemetryStreamOnline(false)
      },
    )

    return () => {
      stop()
      stopTelemetry()
    }
  }, [])

  useEffect(() => {
    setConnected(alertStreamOnline || telemetryStreamOnline)
  }, [alertStreamOnline, telemetryStreamOnline])

  const heartbeatSeries = useMemo<HeartbeatPoint[]>(() => {
    if (telemetryHistory.length > 0) {
      return telemetryHistory
    }

    const pointsFromAlerts = alerts
      .filter((event) => typeof event.heartbeatBpm === 'number')
      .slice()
      .reverse()
      .map((event) => ({
        timestamp: event.createdAt,
        bpm: event.heartbeatBpm ?? 0,
        source: 'live' as const,
      }))

    if (pointsFromAlerts.length > 0) {
      return pointsFromAlerts
    }

    const now = Date.now()
    return SAMPLE_BPM.map((bpm, index) => ({
      timestamp: now - (SAMPLE_BPM.length - index) * 5000,
      bpm,
      source: 'simulated' as const,
    }))
  }, [alerts, telemetryHistory])

  return { alerts, heartbeatSeries, connected, telemetry }
}
