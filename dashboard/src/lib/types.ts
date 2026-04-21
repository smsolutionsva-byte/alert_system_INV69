export type AlertLevel = 'safe' | 'warning' | 'critical'

export interface HeartbeatPoint {
  timestamp: number
  bpm: number
  source: 'live' | 'simulated'
}

export interface AlertEvent {
  id: string
  createdAt: number
  deviceId: string
  alertType: 'manual' | 'sound' | 'heartbeat' | 'multi_sensor'
  message: string
  complaintStatus: 'new' | 'in_progress' | 'closed'
  heartbeatBpm: number | null
  soundLevel: number | null
  resolvedAt?: number | null
}

export interface LiveTelemetry {
  updatedAt: number
  updatedAtIso: string
  deviceId: string
  source: 'pi-hardware' | 'remote-simulator'
  heartbeatBpm: number
  soundDb: number
  isEmergencyMode: boolean
}
