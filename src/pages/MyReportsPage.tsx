import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Claim, Item } from '@/types/database'
import { Button, Spinner } from '@/components/ui'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, cn } from '@/lib/utils'

export function MyReportsPage() {
  const { session } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [claimCounts, setClaimCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const loadMyItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setItems([])
    } else {
      const rows = (data as Item[] | null) ?? []
      setItems(rows)
      const counts: Record<string, number> = {}
      if (rows.length > 0) {
        const { data: claims } = await supabase
          .from('claims')
          .select('item_id')
          .in('item_id', rows.map((r) => r.id))
        ;(claims as Claim[] | null)?.forEach((c) => {
          counts[c.item_id] = (counts[c.item_id] ?? 0) + 1
        })
      }
      setClaimCounts(counts)
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    if (!session) return
    void loadMyItems()
  }, [session, loadMyItems])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Items you reported as lost or found.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => (window.location.href = '/report-lost')}>
            <ArrowDownLeft className="h-4 w-4" />
            Report lost
          </Button>
          <Link to="/report-found">
            <Button variant="secondary">
              <ArrowUpRight className="h-4 w-4" />
              Report found
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-medium text-slate-700">No reports yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Report a lost or found item to get started.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/report-lost">
                <Button>
                  <Plus className="h-4 w-4" />
                  Report lost
                </Button>
              </Link>
              <Link to="/report-found">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" />
                  Report found
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isLost = item.type === 'lost'
              return (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ArrowUpRight className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold text-white',
                          isLost ? 'bg-rose-600' : 'bg-sky-600',
                        )}
                      >
                        {isLost ? 'Lost' : 'Found'}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {item.title}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.location} · {formatDate(item.date_occurred)}
                    </p>
                  </div>
                  {claimCounts[item.id] !== undefined && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      {claimCounts[item.id]} claim
                      {claimCounts[item.id] === 1 ? '' : 's'}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}