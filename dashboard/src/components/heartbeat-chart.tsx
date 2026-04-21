import { Card, LineChart } from '@tremor/react'
import type { HeartbeatPoint } from '@/lib/types'

interface HeartbeatChartProps {
  points: HeartbeatPoint[]
}

export function HeartbeatChart({ points }: HeartbeatChartProps) {
  const data = points.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    BPM: point.bpm,
  }))

  return (
    <Card className="rounded-2xl border border-white/50 bg-white/85 shadow-sm backdrop-blur">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">Heartbeat Stream</h2>
      <p className="mt-1 text-sm text-slate-600">Live heart-rate telemetry from connected rescue device.</p>
      <div className="mt-4">
        <LineChart
          className="h-72"
          data={data}
          index="time"
          categories={['BPM']}
          colors={['rose']}
          showLegend={false}
          yAxisWidth={48}
          minValue={40}
          maxValue={180}
          connectNulls
        />
      </div>
    </Card>
  )
}
