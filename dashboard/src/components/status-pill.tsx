import { ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusPillProps {
  active: boolean
}

export function StatusPill({ active }: StatusPillProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm',
        active
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-emerald-300 bg-emerald-50 text-emerald-700',
      )}
    >
      <span className="relative flex size-3">
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full',
            active ? 'animate-pingSoft bg-destructive/70' : 'bg-emerald-400/50',
          )}
        />
        <span
          className={cn(
            'relative inline-flex size-3 rounded-full',
            active ? 'bg-destructive' : 'bg-emerald-500',
          )}
        />
      </span>
      <ShieldAlert className="size-4" />
      {active ? 'Active Alert' : 'No Active Alert'}
    </div>
  )
}
