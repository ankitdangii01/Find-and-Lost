import type { ComponentType } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  PackageSearch,
  Repeat,
  Undo2,
  Users as UsersIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Claim, Item, Profile } from '@/types/database'
import { Button, Card, Select, Spinner } from '@/components/ui'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'

type Tab = 'overview' | 'reports' | 'claims' | 'returned' | 'users'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'reports', label: 'Reports' },
  { id: 'claims', label: 'Claims' },
  { id: 'returned', label: 'Returned' },
  { id: 'users', label: 'Users' },
]

export function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [items, setItems] = useState<Item[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [itemFilter, setItemFilter] = useState('')
  const [claimFilter, setClaimFilter] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [{ data: itemsRes, error: itemsErr }, { data: claimsRes }, { data: profilesRes }] =
      await Promise.all([
        supabase
          .from('items')
          .select('*, profiles(id, full_name, department, year)')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('claims')
          .select('*, items(id, title, type, location, date_occurred, image_url, status), profiles(id, full_name, department, year)')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('profiles')
          .select('id, full_name, email, role, department, year, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
      ])

    if (itemsErr) setError(itemsErr.message)
    setItems((itemsRes as Item[] | null) ?? [])
    setClaims((claimsRes as Claim[] | null) ?? [])
    setProfiles((profilesRes as Profile[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const stats = {
    users: profiles.length,
    reports: items.length,
    active: items.filter((i) => i.status === 'active').length,
    pending: claims.filter((c) => c.status === 'pending').length,
    approved: claims.filter((c) => c.status === 'approved').length,
    returned: items.filter((i) => i.status === 'resolved').length,
    found: items.filter((i) => i.type === 'found').length,
    lost: items.filter((i) => i.type === 'lost').length,
  }

  const filteredItems = itemFilter
    ? items.filter((i) => i.status === itemFilter)
    : items
  const filteredClaims = claimFilter
    ? claims.filter((c) => c.status === claimFilter)
    : claims

  async function updateItemStatus(id: string, status: Item['status']) {
    await supabase.from('items').update({ status }).eq('id', id)
    await loadAll()
  }

  async function updateClaimStatus(id: string, status: Claim['status']) {
    await supabase.from('claims').update({ status }).eq('id', id)
    await loadAll()
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
          <p className="text-sm text-slate-500">
            Manage reports, claims, returned items, and users across campus.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadAll()}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? 'rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={UsersIcon} label="Registered users" value={stats.users} />
              <StatCard icon={ClipboardList} label="Total reports" value={stats.reports} sub={`${stats.lost} lost · ${stats.found} found`} />
              <StatCard icon={PackageSearch} label="Active reports" value={stats.active} />
              <StatCard icon={Repeat} label="Returned" value={stats.returned} />
              <StatCard icon={CheckCircle2} label="Pending claims" value={stats.pending} sub={`${stats.approved} approved`} />
            </div>

            <Card>
              <h2 className="font-semibold text-slate-900">Recent claims</h2>
              <div className="mt-3 space-y-2">
                {claims.length === 0 ? (
                  <p className="text-sm text-slate-500">No claims yet.</p>
                ) : (
                  claims.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {c.profiles?.full_name ?? 'Campus user'} on "{c.items?.title}"
                        </p>
                        <p className="text-xs text-slate-400">{formatDate(c.created_at)}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <h2 className="font-semibold text-slate-900">Recent reports</h2>
              <div className="mt-3 space-y-2">
                {items.length === 0 ? (
                  <p className="text-sm text-slate-500">No reports yet.</p>
                ) : (
                  items.slice(0, 5).map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{i.title}</p>
                        <p className="text-xs text-slate-400">{i.type} · {i.location}</p>
                      </div>
                      <StatusBadge status={i.status} />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {tab === 'reports' && (
          <Card className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <h2 className="font-semibold text-slate-900">All reports</h2>
              <Select
                aria-label="Filter reports by status"
                className="w-44"
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'claim_pending', label: 'Pending return' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'removed', label: 'Closed' },
                ]}
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Reporter</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Reported</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((i) => (
                    <tr key={i.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <Link to={`/items/${i.id}`} className="font-medium text-primary-600 hover:underline">
                          {i.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">{i.type}</td>
                      <td className="px-4 py-3 text-slate-600">{i.profiles?.full_name ?? 'Anonymous'}</td>
                      <td className="px-4 py-3 text-slate-600">{i.location}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(i.created_at)}</td>
                      <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {i.status !== 'resolved' && (
                            <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => void updateItemStatus(i.id, 'resolved')}>
                              Returned
                            </Button>
                          )}
                          {i.status !== 'removed' && (
                            <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => void updateItemStatus(i.id, 'removed')}>
                              Close
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredItems.length === 0 && (
                <p className="p-6 text-center text-sm text-slate-500">No reports match this filter.</p>
              )}
            </div>
          </Card>
        )}

        {tab === 'claims' && (
          <Card className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <h2 className="font-semibold text-slate-900">All claims</h2>
              <Select
                aria-label="Filter claims by status"
                className="w-44"
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                value={claimFilter}
                onChange={(e) => setClaimFilter(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Claimant</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Claimed</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3">{c.profiles?.full_name ?? 'Campus user'}</td>
                      <td className="px-4 py-3">
                        <Link to={`/items/${c.item_id}`} className="text-primary-600 hover:underline">
                          {c.items?.title ?? 'Unavailable'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        {c.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="success" onClick={() => void updateClaimStatus(c.id, 'approved')}>
                              Approve
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => void updateClaimStatus(c.id, 'rejected')}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredClaims.length === 0 && (
                <p className="p-6 text-center text-sm text-slate-500">No claims match this filter.</p>
              )}
            </div>
          </Card>
        )}

        {tab === 'returned' && (
          <div className="space-y-3">
            {items.filter((i) => i.status === 'resolved').length === 0 ? (
              <Card>
                <p className="text-sm text-slate-500">
                  No items returned yet. When a report is marked resolved, it appears here.
                </p>
              </Card>
            ) : (
              items
                .filter((i) => i.status === 'resolved')
                .map((i) => (
                  <Card key={i.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{i.title}</p>
                      <p className="text-sm text-slate-500">
                        {i.type} · {i.location} · returned {formatDate(i.updated_at ?? i.created_at)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                      <Undo2 className="h-4 w-4" />
                      Returned
                    </span>
                  </Card>
                ))
            )}
          </div>
        )}

        {tab === 'users' && (
          <Card className="p-0">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-semibold text-slate-900">Registered users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <Link to={`/users/${p.id}`} className="font-medium text-primary-600 hover:underline">
                          {p.full_name ?? 'Unnamed'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.email ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{p.department ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                          {p.role === 'admin' ? 'Admin' : 'Student'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
  sub?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-primary-600" />
        {sub && <ArrowRight className="h-4 w-4 text-slate-300" />}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  )
}