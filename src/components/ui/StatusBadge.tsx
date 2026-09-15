import { cn } from '@/lib/utils'

const STYLES = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  claim_pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  resolved: 'bg-slate-100 text-slate-600 ring-slate-200',
  removed: 'bg-red-50 text-red-600 ring-red-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-600 ring-red-200',
  cancelled: 'bg-gray-50 text-gray-500 ring-gray-200',
  lost: 'bg-rose-50 text-rose-700 ring-rose-200',
  found: 'bg-sky-50 text-sky-700 ring-sky-200',
} as const

const LABELS = {
  active: 'Active',
  claim_pending: 'Pending return',
  resolved: 'Resolved',
  removed: 'Closed',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  lost: 'Lost',
  found: 'Found',
} as const

type StatusKey = keyof typeof STYLES & keyof typeof LABELS

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const key = status as StatusKey
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STYLES[key] ?? 'bg-gray-50 text-gray-600 ring-gray-200',
        className,
      )}
    >
      {LABELS[key] ?? status}
    </span>
  )
}