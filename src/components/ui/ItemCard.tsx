import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, ArrowRight, ImageOff, MapPin } from 'lucide-react'
import type { Item } from '@/types/database'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn, formatDate } from '@/lib/utils'

export function ItemCard({ item }: { item: Item }) {
  const isLost = item.type === 'lost'

  return (
    <Link
      to={`/items/${item.id}`}
      className="glass-card group flex flex-col overflow-hidden p-0 transition duration-200 hover:-translate-y-1 hover:border-sky-400/30 hover:shadow-[0_28px_60px_-28px_rgb(56_99_255_/_0.45),inset_0_1px_0_0_rgb(255_255_255_/_0.09)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950/40">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset backdrop-blur-md',
              isLost
                ? 'bg-rose-500/80 text-white ring-white/20'
                : 'bg-sky-500/80 text-white ring-white/20',
            )}
          >
            {isLost ? (
              <ArrowDownLeft className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
            {isLost ? 'Lost' : 'Found'}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <StatusBadge status={item.status} className="bg-[#0a1128]/70" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-slate-100">
            {item.title}
          </h3>
          <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10">
            {item.category}
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-slate-400">{item.description}</p>

        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {item.location}
          </span>
          <span>{formatDate(item.date_occurred)}</span>
          {item.profiles?.full_name && (
            <span className="ml-auto truncate text-slate-400">
              by {item.profiles.full_name.split(' ')[0]}
            </span>
          )}
        </div>

        <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 opacity-0 transition group-hover:opacity-100">
          View details
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}