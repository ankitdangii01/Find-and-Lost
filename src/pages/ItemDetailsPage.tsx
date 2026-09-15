import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Check,
  ImageOff,
  MapPin,
  MessageCircleQuestion,
  ShieldAlert,
  User,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Claim, Item } from '@/types/database'
import { Button, Card, Spinner, Textarea } from '@/components/ui'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const VERIFICATION_QUESTIONS = [
  'What does the item look like in detail (brand, color, model)?',
  'When and where exactly did you lose/find it?',
  'Is there any unique mark, sticker, or scratch you can describe?',
  'Anything inside/attached that only the owner would know?',
]

export function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session, profile } = useAuth()

  const [item, setItem] = useState<Item | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showClaimForm, setShowClaimForm] = useState(false)
  const [claimMessage, setClaimMessage] = useState('')
  const [claimSubmitting, setClaimSubmitting] = useState(false)

  const isOwner = session?.user.id === item?.user_id

  const loadItem = useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*, profiles(id, full_name, department, year)')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      setError(error?.message ?? 'Item not found.')
      setLoading(false)
      return
    }

    setItem(data as Item)

    const myUserId = (await supabase.auth.getUser()).data.user?.id
    if (myUserId) {
      const claimsRes = await supabase
        .from('claims')
        .select('*, profiles(id, full_name, department, year)')
        .eq('item_id', id)
        .order('created_at', { ascending: false })

      if (!claimsRes.error) {
        const visibleClaims = ((claimsRes.data as Claim[] | null) ?? []).filter(
          (c) =>
            c.claimant_id === myUserId ||
            (data as Item).user_id === myUserId,
        )
        setClaims(visibleClaims)
      }
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    if (!id) return
    void loadItem()
  }, [id, loadItem])

  async function submitClaim(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !item) return
    setClaimSubmitting(true)

    const { error: claimError } = await supabase.from('claims').insert({
      item_id: item.id,
      claimant_id: session.user.id,
      message: claimMessage.trim(),
      status: 'pending',
    })

    if (claimError) {
      setError(claimError.message)
      setClaimSubmitting(false)
      return
    }

    await supabase.from('notifications').insert({
      user_id: item.user_id,
      title: 'New claim on your item',
      message: `${profile?.full_name ?? 'Someone'} claimed "${item.title}". Review it now.`,
      type: 'claim',
    })

    setClaimMessage('')
    setShowClaimForm(false)
    await loadItem()
    setClaimSubmitting(false)
  }

  async function resolveClaim(claimId: string, action: 'accepted' | 'rejected') {
    if (!item) return
    await supabase.from('claims').update({ status: action }).eq('id', claimId)

    const claim = claims.find((c) => c.id === claimId)
    if (action === 'accepted') {
      await supabase.from('items').update({ status: 'claim_pending' }).eq('id', item.id)
      await supabase.from('claims').update({ status: 'rejected' }).neq('id', claimId).eq('item_id', item.id)
      if (claim) {
        await supabase.from('notifications').insert({
          user_id: claim.claimant_id,
          title: 'Claim accepted',
          message: `Your claim for "${item.title}" was accepted. Coordinate the return.`,
          type: 'claim',
        })
      }
    } else if (claim) {
      await supabase.from('notifications').insert({
        user_id: claim.claimant_id,
        title: 'Claim rejected',
        message: `Your claim for "${item.title}" was rejected.`,
        type: 'claim',
      })
    }

    await loadItem()
  }

  async function markResolved() {
    if (!item) return
    await supabase.from('items').update({ status: 'resolved' }).eq('id', item.id)
    const acceptedClaim = claims.find((c) => c.status === 'accepted')
    if (acceptedClaim && acceptedClaim.claimant_id !== item.user_id) {
      await supabase.from('notifications').insert({
        user_id: acceptedClaim.claimant_id,
        title: 'Item resolved',
        message: `The item "${item.title}" was marked as resolved.`,
        type: 'resolved',
      })
    }
    await loadItem()
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-slate-700">{error ?? 'Item not found.'}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/browse')}>
          Back to browse
        </Button>
      </div>
    )
  }

  const isLost = item.type === 'lost'
  const pendingClaims = claims.filter((c) => c.status === 'pending')
  const acceptedClaim = claims.find((c) => c.status === 'accepted')
  const canAccept = isOwner && item.status === 'active' && pendingClaims.length > 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        to="/browse"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to browse
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="overflow-hidden p-0">
            <div className="aspect-[4/3] w-full bg-slate-100">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <ImageOff className="h-16 w-16" />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold text-white',
                    isLost ? 'bg-rose-600' : 'bg-sky-600',
                  )}
                >
                  {isLost ? 'Lost' : 'Found'}
                </span>
                <StatusBadge status={item.status} />
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {item.category}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold text-slate-900">
                {item.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {item.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(item.date_occurred)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {item.profiles?.full_name ?? 'Anonymous'}
                  {item.profiles?.department
                    ? ` · ${item.profiles.department}`
                    : ''}
                </span>
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-slate-700">
                  {item.description}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {isOwner ? (
            <Card>
              <h2 className="font-semibold text-slate-900">Manage this report</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review claims and coordinate the return.
              </p>

              {item.status === 'resolved' ? (
                <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                  This item has been marked as resolved.
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {canAccept && (
                    <Button onClick={() => (document.getElementById('claims-section') as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth' })} className="w-full">
                      Review pending claims
                    </Button>
                  )}
                  {item.status === 'claim_pending' && acceptedClaim ? (
                    <div className="space-y-2">
                      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                        Claim accepted by{' '}
                        {acceptedClaim.claimant?.full_name ?? 'another user'}.
                      </div>
                      <Button onClick={() => void markResolved()} className="w-full">
                        <Check className="h-4 w-4" />
                        Mark as returned
                      </Button>
                    </div>
                  ) : (
                    <Button variant="secondary" onClick={() => void markResolved()} className="w-full">
                      Mark as resolved
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => void supabase.from('items').update({ status: 'removed' }).eq('id', item.id).then(async () => { await loadItem(); navigate('/my-reports') })}
                  >
                    Remove report
                  </Button>
                </div>
              )}
            </Card>
          ) : item.status === 'active' ? (
            <Card>
              <h2 className="font-semibold text-slate-900">
                {isLost ? 'Think this is yours?' : 'Know the owner?'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Submit a claim to contact the person who reported it.
              </p>

              {!session ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-slate-600">
                    Log in to submit a claim and help reunite this item.
                  </p>
                  <Button className="w-full" onClick={() => navigate('/login')}>
                    Log in to claim
                  </Button>
                </div>
              ) : claims.some((c) => c.claimant_id === session.user.id) ? (
                <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                  You have already claimed this item. Wait for the owner to
                  review it.
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowClaimForm((v) => !v)}
                    className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    {showClaimForm ? 'Cancel' : 'Claim this item'}
                  </button>

                  {showClaimForm && (
                    <form onSubmit={(e) => void submitClaim(e)} className="mt-4 space-y-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <MessageCircleQuestion className="h-4 w-4" />
                          Owner will verify ownership. Answer to prove it&apos;s yours:
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
                          {VERIFICATION_QUESTIONS.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      </div>
                      <Textarea
                        label="Your claim message"
                        required
                        rows={4}
                        placeholder="Describe the item in detail so the owner can verify..."
                        value={claimMessage}
                        onChange={(e) => setClaimMessage(e.target.value)}
                      />
                      <Button type="submit" loading={claimSubmitting} className="w-full">
                        Submit claim
                      </Button>
                    </form>
                  )}
                </>
              )}
            </Card>
          ) : (
            <Card>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <ShieldAlert className="h-5 w-5" />
                This item is currently {item.status.replace('_', ' ')} and can&apos;t be claimed.
              </div>
            </Card>
          )}

          <div id="claims-section">
            {claims.length > 0 && (isOwner || claims.some((c) => c.claimant_id === session?.user.id)) && (
              <Card>
                <h2 className="font-semibold text-slate-900">Claims</h2>
                <div className="mt-3 space-y-3">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {claim.profiles?.full_name ?? 'Campus user'}
                          {claim.profiles?.department
                            ? ` · ${claim.profiles.department}`
                            : ''}
                        </span>
                        <StatusBadge status={claim.status} />
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap text-slate-600">
                        {claim.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(claim.created_at)}
                      </p>
                      {isOwner && claim.status === 'pending' && item.status === 'active' && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            className="flex-1"
                            onClick={() => void resolveClaim(claim.id, 'accepted')}
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="flex-1"
                            onClick={() => void resolveClaim(claim.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}