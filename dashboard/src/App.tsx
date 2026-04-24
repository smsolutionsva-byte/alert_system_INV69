import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth'
import { AudioLines, FileText, HeartPulse, Radar, Siren, Wifi, WifiOff } from 'lucide-react'
import { AlertsTable } from '@/components/alerts-table'
import { HeartbeatChart } from '@/components/heartbeat-chart'
import { LoginPage } from '@/components/login-page'
import { Card, CardContent } from '@/components/ui/card'
import { auth, googleProvider } from '@/lib/firebase'
import { useAlerts } from '@/lib/useAlerts'

function shouldUseRedirectAuth(): boolean {
  const ua = navigator.userAgent || ''
  const isAndroidWebView = /\bwv\b|; wv\)/i.test(ua)
  const isIosWebView = /iPhone|iPad|iPod/i.test(ua) && /AppleWebKit(?!.*Safari)/i.test(ua)
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua)

  return isAndroidWebView || isIosWebView || isMobile
}

interface DashboardShellProps {
  user: User
  onSignOut: () => Promise<void>
}

function DashboardShell({ user, onSignOut }: DashboardShellProps) {
  const { alerts, heartbeatSeries, connected, telemetry } = useAlerts()
  const heartSensorEnabled = telemetry?.isHeartSensorEnabled !== false

  const latest = alerts[0]
  const latestBpm = telemetry?.heartbeatBpm ?? heartbeatSeries[heartbeatSeries.length - 1]?.bpm ?? 0
  const latestSound = telemetry?.soundDb ?? latest?.soundLevel ?? 0
  const openComplaints = alerts.filter((item) => item.complaintStatus !== 'closed').length

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-cyan-500/20 bg-[#051733]/70 p-5 shadow-[0_24px_70px_rgba(0,8,28,0.7)] backdrop-blur-xl sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-end gap-2 text-sm text-slate-300">
          <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1">{user.email ?? 'Authenticated User'}</span>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-rose-400/40 bg-rose-500/20 px-3 py-1 font-medium text-rose-100 transition hover:bg-rose-500/35"
          >
            Sign Out
          </button>
        </div>

        <div className="flex items-start gap-3">
          <HeartPulse className="mt-1 size-8 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cyan-300 sm:text-5xl">IoT Safety Network</h1>
            <p className="mt-1 text-lg text-slate-100 sm:text-[34px]">Domestic Violence Alert and Complaint Tracking Dashboard</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border-l-4 border-cyan-400 bg-[#0a1b3f]/90 px-4 py-3 text-[17px] text-slate-300">
          Real-time monitoring of emergency buttons, abnormal sound patterns, and heartbeat spikes from field devices.
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-xl border border-sky-500/20 bg-[#081a3b] py-0 shadow-md shadow-black/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm uppercase tracking-wider text-slate-400">Connection Status</p>
                {connected ? <Wifi className="size-8 text-emerald-400" /> : <WifiOff className="size-8 text-rose-400" />}
              </div>
              <p className={`mt-2 text-4xl font-semibold ${connected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {connected ? 'Online' : 'Offline'}
              </p>
              <p className={`mt-2 flex items-center gap-2 text-base ${connected ? 'text-emerald-300' : 'text-rose-300'}`}>
                <span className={`size-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {connected ? 'Connected to Firebase' : 'Awaiting Connection'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-sky-500/20 bg-[#081a3b] py-0 shadow-md shadow-black/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm uppercase tracking-wider text-slate-400">Current Heartbeat</p>
                <HeartPulse className="size-8 text-emerald-400" />
              </div>
              <p className="mt-2 text-4xl font-semibold text-emerald-400">{latestBpm} bpm</p>
              <p className="mt-2 flex items-center gap-2 text-base text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400" />
                Normal Range
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-sky-500/20 bg-[#081a3b] py-0 shadow-md shadow-black/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm uppercase tracking-wider text-slate-400">Sound Level</p>
                <AudioLines className="size-8 text-cyan-300" />
              </div>
              <p className="mt-2 text-4xl font-semibold text-cyan-300">{Math.round(latestSound)} dB</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-sky-500/20 bg-[#081a3b] py-0 shadow-md shadow-black/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm uppercase tracking-wider text-slate-400">Open Complaints</p>
                <FileText className="size-8 text-sky-400" />
              </div>
              <p className="mt-2 text-4xl font-semibold text-sky-400">{openComplaints}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr,0.8fr]">
        <HeartbeatChart points={heartbeatSeries} sensorEnabled={heartSensorEnabled} />

        <aside className="rounded-xl border border-sky-500/20 bg-[#081a3b] p-6 shadow-md shadow-black/30">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-cyan-300 sm:text-4xl">
            <Radar className="size-6" />
            Latest Alert
          </h2>
          {latest ? (
            <div className="mt-6 space-y-3 text-base text-slate-300">
              <div className="flex items-center gap-2 text-rose-300">
                <Siren className="size-4" />
                <span className="font-medium uppercase tracking-wide">{latest.alertType}</span>
              </div>
              <p>{latest.message}</p>
              <p>
                Device: <span className="font-medium text-slate-100">{latest.deviceId}</span>
              </p>
              <p>
                Status: <span className="font-medium text-slate-100">{latest.complaintStatus}</span>
              </p>
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center text-center">
              <Radar className="size-24 text-slate-600" />
              <p className="mt-8 text-2xl text-slate-300">Waiting for the first signal from Raspberry Pi devices</p>
            </div>
          )}
        </aside>
      </section>

      <div className="mt-6">
        <AlertsTable alerts={alerts} />
      </div>
    </main>
  )
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [stayInBrowser, setStayInBrowser] = useState(false)
  const [autoReturnTriggered, setAutoReturnTriggered] = useState(false)
  const [isMobileReturnFlow] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('mobile') === '1'
  })
  const [returnToAppUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('app') || 'inv69app://auth-complete'
  })

  useEffect(() => {
    if (!user || !isMobileReturnFlow || stayInBrowser || autoReturnTriggered) {
      return
    }

    setAutoReturnTriggered(true)

    const timer = window.setTimeout(() => {
      window.location.href = returnToAppUrl
    }, 450)

    return () => window.clearTimeout(timer)
  }, [autoReturnTriggered, isMobileReturnFlow, returnToAppUrl, stayInBrowser, user])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function handleGoogleLogin(): Promise<void> {
    setSigningIn(true)
    setAuthError(null)

    try {
      if (shouldUseRedirectAuth()) {
        await signInWithRedirect(auth, googleProvider)
        return
      }

      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      const code = (error as { code?: string })?.code

      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider)
        return
      }

      setAuthError('Google sign-in failed. Please try again from a secure browser session.')
    } finally {
      setSigningIn(false)
    }
  }

  async function handleSignOut(): Promise<void> {
    await signOut(auth)
  }

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 text-slate-200">
        Checking secure session...
      </main>
    )
  }

  if (!user) {
    return <LoginPage loading={signingIn} error={authError} onGoogleLogin={handleGoogleLogin} />
  }

  if (isMobileReturnFlow && !stayInBrowser) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-2xl border border-cyan-500/25 bg-[#071935]/85 p-7 text-center shadow-[0_24px_60px_rgba(1,8,24,0.75)] backdrop-blur">
          <h1 className="text-2xl font-semibold text-cyan-300">Login Successful</h1>
          <p className="mt-2 text-slate-300">Returning to your app. If it does not open automatically, tap the button below.</p>

          <div className="mt-6 flex flex-col items-stretch gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = returnToAppUrl
              }}
              className="min-h-11 rounded-xl border border-cyan-400/45 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/35"
            >
              Open App
            </button>

            <button
              type="button"
              onClick={() => {
                setStayInBrowser(true)
                window.history.replaceState({}, document.title, window.location.pathname)
              }}
              className="min-h-11 rounded-xl border border-slate-500/45 bg-slate-600/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-600/35"
            >
              Continue In Browser
            </button>
          </div>
        </section>
      </main>
    )
  }

  return <DashboardShell user={user} onSignOut={handleSignOut} />
}

export default App
