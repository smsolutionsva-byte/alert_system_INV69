export function formatDateTime(value: number): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function statusLabel(status: 'new' | 'in_progress' | 'closed'): string {
  switch (status) {
    case 'new':
      return 'New'
    case 'in_progress':
      return 'In Progress'
    case 'closed':
      return 'Closed'
    default:
      return status
  }
}
