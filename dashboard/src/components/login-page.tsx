import { AlertCircle, ShieldCheck } from 'lucide-react'

interface LoginPageProps {
  loading: boolean
  error: string | null
  onGoogleLogin: () => void
}

export function LoginPage({ loading, error, onGoogleLogin }: LoginPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-2xl border border-cyan-500/25 bg-[#071935]/85 p-8 shadow-[0_24px_60px_rgba(1,8,24,0.75)] backdrop-blur">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/10">
            <ShieldCheck className="size-7 text-cyan-300" />
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-cyan-300 sm:text-4xl">INV69 Secure Access</h1>
          <p className="mt-2 text-slate-300">Sign in with your Google account to access the domestic violence alert dashboard.</p>

          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl border border-cyan-400/45 bg-cyan-500/20 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/35 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Continue With Google'}
          </button>

          {error ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/15 px-4 py-2 text-sm text-rose-200">
              <AlertCircle className="size-4" />
              {error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
