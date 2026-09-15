import { format } from 'date-fns'

export function formatDate(iso: string): string {
  return format(new Date(iso), 'dd MMM yyyy')
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatRelative(iso: string): string {
  const now = new Date()
  const date = new Date(iso)
  const diffMs = now.getTime() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function timeAgo(iso: string): string {
  return formatRelative(iso)
}

export function friendlyError(msg: string): string {
  if (!msg) return 'Something went wrong. Please try again.'
  if (msg.includes('DAILY_REPORT_LIMIT')) return 'You can only report one lost and one found item per day. Please try again tomorrow.'
  if (msg.includes('CANNOT_CLAIM_OWN_ITEM')) return 'You cannot claim your own item.'
  if (msg.includes('new row violates row-level security policy')) return 'You do not have permission to perform this action.'
  if (msg.includes('duplicate key') || msg.includes('already claimed')) return 'You have already claimed this item.'
  if (msg.includes('JWT')) return 'Your session has expired. Please log in again.'
  return msg
}