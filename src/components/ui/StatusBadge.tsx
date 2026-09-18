import { cn } from '@/lib/utils'

const STYLES = {
  active: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  claim_pending: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  resolved: 'bg-slate-400/10 text-slate-400 ring-slate-400/20',
  removed: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
  pending: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  approved: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  rejected: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
  cancelled: 'bg-slate-400/8 text-slate-500 ring-slate-400/20',
  lost: 'bg-rose-400/10 text-rose-300 ring-rose-400/25',
  found: 'bg-sky-400/10 text-sky-300 ring-sky-400/25',
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        STYLES[key] ?? 'bg-slate-400/10 text-slate-400 ring-slate-400/20',
        className,
      )}
    >
      {LABELS[key] ?? status}
    </span>
  )
}