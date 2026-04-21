import { CircleDot, HeartPulse } from 'lucide-react'
import { Card, LineChart } from '@tremor/react'
import type { HeartbeatPoint } from '@/lib/types'

interface HeartbeatChartProps {
  points: HeartbeatPoint[]
  sensorEnabled: boolean
}

export function HeartbeatChart({ points, sensorEnabled }: HeartbeatChartProps) {
  const data = points.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    BPM: point.bpm,
  }))

  return (
    <Card className="rounded-xl border border-sky-500/20 bg-[#081a3b] p-6 shadow-md shadow-black/30">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-cyan-300">
          <HeartPulse className="size-6" />
          Live Heartbeat Stream
        </h2>
        <p className="flex items-center gap-2 text-base text-slate-300">
          <CircleDot className="size-4 text-emerald-400" />
          Real-time
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-sky-500/15 bg-[#06142f] p-3">
        {sensorEnabled && data.length > 0 ? (
          <LineChart
            className="h-[380px] [&_*]:!text-slate-300"
            data={data}
            index="time"
            categories={['BPM']}
            colors={['cyan']}
            showLegend={false}
            yAxisWidth={48}
            minValue={40}
            maxValue={180}
            connectNulls
          />
        ) : (
          <div className="flex h-[380px] items-center justify-center text-center text-slate-400">
            {sensorEnabled ? 'Waiting for heartbeat data...' : 'Heart sensor is OFF. No heartbeat line is shown.'}
          </div>
        )}
      </div>
    </Card>
  )
}
