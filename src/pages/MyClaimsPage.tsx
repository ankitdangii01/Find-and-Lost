import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Claim } from '@/types/database'
import { Button, Spinner } from '@/components/ui'
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

  async function cancelClaim(claimId: string) {
    await supabase.from('claims').update({ status: 'cancelled' }).eq('id', claimId)
    await loadMyClaims()
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        My claims
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Claims you made on items reported by others.
      </p>

      <div className="mt-6">
        {claims.length === 0 ? (
          <div className="glass-card border-dashed p-12 text-center">
            <p className="font-semibold text-white">No claims yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Browse found items and claim the ones that might be yours.
            </p>
            <Link
              to="/browse?type=found"
              className="btn-cta mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
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
                  className="glass-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-sky-300 ring-1 ring-inset ring-sky-400/20">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        {item ? (
                          <Link
                            to={`/items/${item.id}`}
                            className="font-semibold text-white hover:text-sky-300 transition"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="font-semibold text-white">
                            Item no longer available
                          </span>
                        )}
                        <p className="text-sm text-slate-400">
                          {item
                            ? `${item.location} · ${formatDate(item.date_occurred)}`
                            : 'This item was removed.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={claim.status} />
                      {claim.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void cancelClaim(claim.id)}
                          title="Cancel claim"
                          className="text-slate-400 hover:text-rose-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 rounded-lg bg-white/[0.03] p-3 text-sm whitespace-pre-wrap text-slate-300 ring-1 ring-inset ring-white/10">
                    {claim.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
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