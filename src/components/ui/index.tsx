import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-cta text-white',
  secondary:
    'bg-white/5 text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-white shadow-sm shadow-black/20',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  danger:
    'bg-rose-600/90 text-white ring-1 ring-inset ring-rose-300/20 hover:bg-rose-500 shadow-lg shadow-rose-950/40',
  success:
    'bg-emerald-600/90 text-white ring-1 ring-inset ring-emerald-300/20 hover:bg-emerald-500 shadow-lg shadow-emerald-950/40',
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  type = 'button',
  className,
  disabled,
  size,
  ...props
}: {
  children: ReactNode
  variant?: Variant
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm'
          ? 'px-3 py-1.5 text-xs'
          : size === 'lg'
            ? 'px-6 py-3 text-base'
            : 'px-4 py-2.5 text-sm',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Input({
  label,
  error,
  className,
  ...props
}: {
  label?: string
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </span>
      )}
      <input
        className={cn('glass-input', error && 'ring-1 ring-inset ring-rose-500/60', className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
    </label>
  )
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: {
  label?: string
  error?: string
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </span>
      )}
      <textarea className={cn('glass-input resize-y', className)} {...props} />
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
    </label>
  )
}

export function Select({
  label,
  error,
  options,
  className,
  ...props
}: {
  label?: string
  error?: string
  options: { value: string; label: string }[]
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </span>
      )}
      <select className={cn('glass-input appearance-none pr-8', className)} {...props}>
        {props.value === '' && !options.some((o) => o.value === '') && (
          <option value="">Select...</option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
    </label>
  )
}

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('glass-card p-6', className)}>{children}</div>
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-blue-400', className)} />
}