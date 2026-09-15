import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Claim } from '@/types/database'
import { Spinner } from '@/components/ui'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'

export function MyClaimsPage() {
  const { session } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  const loadMyClaims = useCallback(async () => {
    const { data, error } = await supabase
      .from('claims')
      .select('*, items(id, title, type, location, date_occurred, image_url, status)')
      .eq('claimant_id', session!.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setClaims([])
    } else {
      setClaims((data as Claim[] | null) ?? [])
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    if (!session) return
    void loadMyClaims()
  }, [session, loadMyClaims])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">My claims</h1>
      <p className="mt-1 text-sm text-slate-500">
        Claims you made on items reported by others.
      </p>

      <div className="mt-6">
        {claims.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-medium text-slate-700">No claims yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Browse found items and claim the ones that might be yours.
            </p>
            <Link
              to="/browse?type=found"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Browse found items
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => {
              const item = claim.items
              return (
                <div
                  key={claim.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        {item ? (
                          <Link
                            to={`/items/${item.id}`}
                            className="font-semibold text-slate-900 hover:text-primary-600"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            Item no longer available
                          </span>
                        )}
                        <p className="text-sm text-slate-500">
                          {item
                            ? `${item.location} · ${formatDate(item.date_occurred)}`
                            : 'This item was removed.'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-wrap text-slate-600">
                    {claim.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Claimed {formatDate(claim.created_at)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}