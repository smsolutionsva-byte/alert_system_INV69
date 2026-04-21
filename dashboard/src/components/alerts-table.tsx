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
  new: 'bg-rose-100 text-rose-700 hover:bg-rose-100',
  in_progress: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  closed: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/50 bg-white/85 shadow-sm backdrop-blur">
      <header className="border-b border-slate-200/70 px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Alert & Complaint History</h2>
        <p className="mt-1 text-sm text-slate-600">Track emergency signals and case progression in real time.</p>
      </header>

      <Table className="min-w-[760px] text-sm">
        <TableHeader className="bg-slate-100/80 text-slate-700">
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
            <TableRow key={event.id} className="border-slate-200/70 text-slate-800 hover:bg-slate-50/80">
              <TableCell className="whitespace-nowrap px-6 py-3">{formatDateTime(event.createdAt)}</TableCell>
              <TableCell className="px-6 py-3">{event.deviceId}</TableCell>
              <TableCell className="px-6 py-3 uppercase tracking-wide text-slate-600">{event.alertType}</TableCell>
              <TableCell className="px-6 py-3">{event.heartbeatBpm ? `${event.heartbeatBpm} bpm` : 'N/A'}</TableCell>
              <TableCell className="px-6 py-3">
                <Badge className={statusClasses[event.complaintStatus]}>{statusLabel(event.complaintStatus)}</Badge>
              </TableCell>
              <TableCell className="px-6 py-3 text-slate-600">{event.message}</TableCell>
            </TableRow>
          ))}
          {alerts.length === 0 ? (
            <TableRow>
              <TableCell className="px-6 py-8 text-center text-slate-500" colSpan={6}>
                No alerts have been received yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </section>
  )
}
