import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, ImageOff, MapPin } from 'lucide-react'
import type { Item } from '@/types/database'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn, formatDate } from '@/lib/utils'

export function ItemCard({ item }: { item: Item }) {
  const isLost = item.type === 'lost'

  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow',
              isLost ? 'bg-rose-600' : 'bg-sky-600',
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
          <StatusBadge status={item.status} className="bg-white" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-slate-900">
            {item.title}
          </h3>
          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {item.category}
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-slate-500">{item.description}</p>

        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {item.location}
          </span>
          <span>{formatDate(item.date_occurred)}</span>
          {item.profiles?.full_name && (
            <span className="ml-auto truncate text-slate-500">
              by {item.profiles.full_name.split(' ')[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}