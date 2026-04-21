import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AlertEvent, HeartbeatPoint } from '@/lib/types'

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
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const alertRef = collection(db, 'alerts')
    const alertQuery = query(alertRef, orderBy('createdAt', 'desc'), limit(50))

    const stop = onSnapshot(
      alertQuery,
      (snapshot) => {
        setAlerts(snapshot.docs.map(mapAlertDoc))
        setConnected(true)
      },
      () => {
        setConnected(false)
      },
    )

    return () => stop()
  }, [])

  const heartbeatSeries = useMemo<HeartbeatPoint[]>(() => {
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
  }, [alerts])

  return { alerts, heartbeatSeries, connected }
}
