import type { AlertEvent } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, statusLabel } from '@/lib/formatters'

interface AlertsTableProps {
  alerts: AlertEvent[]
}

const statusClasses: Record<AlertEvent['complaintStatus'], string> = {
  new: 'border border-rose-500/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/15',
  in_progress: 'border border-amber-400/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/15',
  closed: 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15',
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-sky-500/20 bg-[#081a3b] shadow-md shadow-black/30">
      <header className="border-b border-sky-500/20 px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-cyan-300">Alert & Complaint History</h2>
        <p className="mt-1 text-sm text-slate-300">Track emergency signals and case progression in real time.</p>
      </header>

      <Table className="min-w-[760px] text-sm">
        <TableHeader className="bg-[#0d2047] text-slate-300">
          <TableRow>
            <TableHead className="px-6 py-3 font-medium">Time</TableHead>
            <TableHead className="px-6 py-3 font-medium">Device</TableHead>
            <TableHead className="px-6 py-3 font-medium">Type</TableHead>
            <TableHead className="px-6 py-3 font-medium">Heartbeat</TableHead>
            <TableHead className="px-6 py-3 font-medium">Complaint Status</TableHead>
            <TableHead className="px-6 py-3 font-medium">Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((event) => (
            <TableRow key={event.id} className="border-sky-500/20 text-slate-200 hover:bg-[#0d224c]">
              <TableCell className="whitespace-nowrap px-6 py-3">{formatDateTime(event.createdAt)}</TableCell>
              <TableCell className="px-6 py-3">{event.deviceId}</TableCell>
              <TableCell className="px-6 py-3 uppercase tracking-wide text-slate-300">{event.alertType}</TableCell>
              <TableCell className="px-6 py-3">{event.heartbeatBpm ? `${event.heartbeatBpm} bpm` : 'N/A'}</TableCell>
              <TableCell className="px-6 py-3">
                <Badge className={statusClasses[event.complaintStatus]}>{statusLabel(event.complaintStatus)}</Badge>
              </TableCell>
              <TableCell className="px-6 py-3 text-slate-300">{event.message}</TableCell>
            </TableRow>
          ))}
          {alerts.length === 0 ? (
            <TableRow>
              <TableCell className="px-6 py-8 text-center text-slate-400" colSpan={6}>
                No alerts have been received yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </section>
  )
}
