import { Activity, AudioLines, Shield, Siren, Wifi } from 'lucide-react'
import { AlertsTable } from '@/components/alerts-table'
import { HeartbeatChart } from '@/components/heartbeat-chart'
import { StatusPill } from '@/components/status-pill'
import { Card, CardContent } from '@/components/ui/card'
import { useAlerts } from '@/lib/useAlerts'

function App() {
  const { alerts, heartbeatSeries, connected } = useAlerts()

  const latest = alerts[0]
  const hasActiveAlert = alerts.some((item) => item.complaintStatus !== 'closed')
  const latestBpm = heartbeatSeries[heartbeatSeries.length - 1]?.bpm ?? 0
  const latestSound = latest?.soundLevel ?? 0

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl shadow-slate-300/30 backdrop-blur-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-rose-700">IoT Safety Network</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Domestic Violence Alert and Complaint Tracking Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              This console monitors emergency button events, abnormal sound patterns, and heartbeat spikes from field devices in real time.
            </p>
          </div>
          <StatusPill active={hasActiveAlert} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border border-slate-200/70 bg-white/85 py-0">
            <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm">Connection</span>
              <Wifi className="size-4" />
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900">{connected ? 'Live' : 'Offline'}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/70 bg-white/85 py-0">
            <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm">Current Heartbeat</span>
              <Activity className="size-4" />
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900">{latestBpm} bpm</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/70 bg-white/85 py-0">
            <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm">Sound Level</span>
              <AudioLines className="size-4" />
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900">{latestSound}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/70 bg-white/85 py-0">
            <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm">Open Complaints</span>
              <Shield className="size-4" />
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {alerts.filter((item) => item.complaintStatus !== 'closed').length}
            </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <HeartbeatChart points={heartbeatSeries} />

        <aside className="rounded-2xl border border-white/50 bg-white/85 p-6 shadow-sm backdrop-blur">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Latest Alert</h2>
          {latest ? (
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2 text-rose-600">
                <Siren className="size-4" />
                <span className="font-medium uppercase tracking-wide">{latest.alertType}</span>
              </div>
              <p>{latest.message}</p>
              <p>
                Device: <span className="font-medium text-slate-900">{latest.deviceId}</span>
              </p>
              <p>
                Status: <span className="font-medium text-slate-900">{latest.complaintStatus}</span>
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Waiting for the first signal from Raspberry Pi devices.</p>
          )}
        </aside>
      </section>

      <div className="mt-8">
        <AlertsTable alerts={alerts} />
      </div>
    </main>
  )
}

export default App
