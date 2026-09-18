import type { ComponentType } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PackageSearch,
  RefreshCw,
  Repeat,
  Settings as SettingsIcon,
  Sparkles,
  Undo2,
  Users as UsersIcon,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Claim, Item, MatchResult, Profile } from '@/types/database'
import { Button, Card, Select, Spinner } from '@/components/ui'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn, formatDate } from '@/lib/utils'

type Tab = 'overview' | 'reports' | 'claims' | 'matches' | 'returned' | 'users' | 'settings'

const TABS: { id: Tab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'reports', label: 'Reports', icon: ClipboardList },
  { id: 'claims', label: 'Claims', icon: MessageSquare },
  { id: 'matches', label: 'Matches', icon: Sparkles },
  { id: 'returned', label: 'Returned', icon: Undo2 },
  { id: 'users', label: 'Users', icon: UsersIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

interface MatchEntry {
  source: Item
  results: MatchResult[]
}

export function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [matchEntries, setMatchEntries] = useState<MatchEntry[]>([])
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

    // Real matches: run match_item across recent active reports.
    const entries: MatchEntry[] = []
    for (const item of ((itemsRes as Item[] | null) ?? [])
      .filter((i) => i.status === 'active')
      .slice(0, 20)) {
      const { data } = await supabase.rpc('match_item', { p_item_id: item.id })
      const rows = (data as MatchResult[] | null) ?? []
      if (rows.length > 0) entries.push({ source: item, results: rows })
    }
    setMatchEntries(entries)
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
    matches: matchEntries.reduce((n, e) => n + e.results.length, 0),
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

  const selectTab = (next: Tab) => {
    setTab(next)
    setDrawerOpen(false)
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
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-xl p-2 text-slate-300 transition hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Admin dashboard</h1>
          <p className="text-sm text-slate-400">
            Manage reports, claims, returned items, and users across campus.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadAll()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-400/10 px-4 py-3 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/20">
          {error}
        </div>
      )}

      {/* Sidebar (desktop) */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="glass-card sticky top-24 space-y-1 p-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                  tab === t.id
                    ? 'bg-white/10 text-sky-300 ring-1 ring-inset ring-sky-400/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close admin menu"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-64 max-w-[80vw] flex-col border-r border-white/10 bg-[#080e22]/95 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                <span className="font-bold text-white">
                  Admin<span className="text-gradient"> menu</span>
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1 p-3">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTab(t.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition',
                      tab === t.id
                        ? 'bg-white/10 text-sky-300 ring-1 ring-inset ring-sky-400/20'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={UsersIcon} label="Registered users" value={stats.users} />
                <StatCard icon={ClipboardList} label="Total reports" value={stats.reports} sub={`${stats.lost} lost · ${stats.found} found`} />
                <StatCard icon={PackageSearch} label="Active reports" value={stats.active} />
                <StatCard icon={Repeat} label="Returned" value={stats.returned} />
                <StatCard icon={CheckCircle2} label="Pending claims" value={stats.pending} sub={`${stats.approved} approved`} />
                <StatCard icon={Sparkles} label="Possible matches" value={stats.matches} />
              </div>

              <Card>
                <h2 className="font-semibold text-white">Recent claims</h2>
                <div className="mt-3 space-y-2">
                  {claims.length === 0 ? (
                    <p className="text-sm text-slate-500">No claims yet.</p>
                  ) : (
                    claims.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-200">
                            {c.profiles?.full_name ?? 'Campus user'} on "{c.items?.title}"
                          </p>
                          <p className="text-xs text-slate-500">{formatDate(c.created_at)}</p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <h2 className="font-semibold text-white">Recent reports</h2>
                <div className="mt-3 space-y-2">
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500">No reports yet.</p>
                  ) : (
                    items.slice(0, 5).map((i) => (
                      <div key={i.id} className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 last:border-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-200">{i.title}</p>
                          <p className="text-xs text-slate-500">{i.type} · {i.location}</p>
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
                <h2 className="font-semibold text-white">All reports</h2>
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

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
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
                      <tr key={i.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                        <td className="px-4 py-3">
                          <Link to={`/items/${i.id}`} className="font-medium text-sky-400 transition hover:text-sky-300 hover:underline">
                            {i.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-300">{i.type}</td>
                        <td className="px-4 py-3 text-slate-300">{i.profiles?.full_name ?? 'Anonymous'}</td>
                        <td className="px-4 py-3 text-slate-300">{i.location}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(i.created_at)}</td>
                        <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {i.status !== 'resolved' && (
                              <Button size="sm" variant="ghost" className="text-emerald-300" onClick={() => void updateItemStatus(i.id, 'resolved')}>
                                Returned
                              </Button>
                            )}
                            {i.status !== 'removed' && (
                              <Button size="sm" variant="ghost" className="text-rose-300" onClick={() => void updateItemStatus(i.id, 'removed')}>
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

              {/* Mobile cards */}
              <div className="divide-y divide-white/5 md:hidden">
                {filteredItems.length === 0 && (
                  <p className="p-6 text-center text-sm text-slate-500">No reports match this filter.</p>
                )}
                {filteredItems.map((i) => (
                  <div key={i.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/items/${i.id}`} className="font-semibold text-white hover:text-sky-300">
                        {i.title}
                      </Link>
                      <StatusBadge status={i.status} />
                    </div>
                    <p className="text-sm text-slate-400">
                      <span className="capitalize">{i.type}</span> · {i.location} ·{' '}
                      {i.profiles?.full_name ?? 'Anonymous'}
                    </p>
                    <div className="flex gap-2">
                      {i.status !== 'resolved' && (
                        <Button size="sm" variant="ghost" className="text-emerald-300" onClick={() => void updateItemStatus(i.id, 'resolved')}>
                          Returned
                        </Button>
                      )}
                      {i.status !== 'removed' && (
                        <Button size="sm" variant="ghost" className="text-rose-300" onClick={() => void updateItemStatus(i.id, 'removed')}>
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'claims' && (
            <Card className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
                <h2 className="font-semibold text-white">All claims</h2>
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

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Claimant</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Claimed</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((c) => (
                      <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                        <td className="px-4 py-3 text-slate-200">{c.profiles?.full_name ?? 'Campus user'}</td>
                        <td className="px-4 py-3">
                          <Link to={`/items/${c.item_id}`} className="text-sky-400 transition hover:text-sky-300 hover:underline">
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

              {/* Mobile cards */}
              <div className="divide-y divide-white/5 md:hidden">
                {filteredClaims.length === 0 && (
                  <p className="p-6 text-center text-sm text-slate-500">No claims match this filter.</p>
                )}
                {filteredClaims.map((c) => (
                  <div key={c.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/items/${c.item_id}`} className="font-semibold text-white hover:text-sky-300">
                          {c.items?.title ?? 'Unavailable'}
                        </Link>
                        <p className="text-sm text-slate-400">{c.profiles?.full_name ?? 'Campus user'}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(c.created_at)}</p>
                    {c.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => void updateClaimStatus(c.id, 'approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => void updateClaimStatus(c.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'matches' && (
            <div>
              {matchEntries.length === 0 ? (
                <Card>
                  <p className="text-sm text-slate-400">
                    No matches found yet. When active reports share similar
                    categories, titles, or locations, the smart match engine
                    surfaces them here (based on real{' '}
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">match_item</code>{' '}
                    results).
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {matchEntries.map((entry) => (
                    <Card key={entry.source.id} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/items/${entry.source.id}`}
                            className="font-semibold text-white hover:text-sky-300"
                          >
                            {entry.source.title}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {entry.source.type === 'lost' ? 'Lost' : 'Found'} ·{' '}
                            {entry.source.location} · reported {formatDate(entry.source.created_at)}
                          </p>
                        </div>
                        <StatusBadge status={entry.source.status} />
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {entry.results.slice(0, 6).map((m) => (
                          <Link
                            key={m.matched_item_id}
                            to={`/items/${m.matched_item_id}`}
                            className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.06]"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-200">{m.title}</p>
                              <p className="text-xs text-slate-500">
                                {m.item_type === 'found' ? 'Found' : 'Lost'} · {m.location ?? 'Unknown'}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-bold text-cyan-300 ring-1 ring-inset ring-cyan-400/25">
                              {m.score}%
                            </span>
                          </Link>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'returned' && (
            <div className="space-y-3">
              {stats.returned === 0 ? (
                <Card>
                  <p className="text-sm text-slate-400">
                    No items returned yet. When a report is marked resolved, it appears here.
                  </p>
                </Card>
              ) : (
                items
                  .filter((i) => i.status === 'resolved')
                  .map((i) => (
                    <Card key={i.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{i.title}</p>
                        <p className="text-sm text-slate-400">
                          {i.type} · {i.location} · returned {formatDate(i.updated_at ?? i.created_at)}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
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
              <div className="border-b border-white/10 p-4">
                <h2 className="font-semibold text-white">Registered users</h2>
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                        <td className="px-4 py-3">
                          <Link to={`/users/${p.id}`} className="font-medium text-sky-400 transition hover:text-sky-300 hover:underline">
                            {p.full_name ?? 'Unnamed'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{p.email ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{p.department ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                            p.role === 'admin'
                              ? 'bg-purple-400/10 text-purple-300 ring-purple-400/25'
                              : 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
                          )}>
                            {p.role === 'admin' ? 'Admin' : 'Student'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-white/5 md:hidden">
                {profiles.map((p) => (
                  <div key={p.id} className="space-y-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/users/${p.id}`} className="font-semibold text-white hover:text-sky-300">
                        {p.full_name ?? 'Unnamed'}
                      </Link>
                      <span className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                        p.role === 'admin'
                          ? 'bg-purple-400/10 text-purple-300 ring-purple-400/25'
                          : 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
                      )}>
                        {p.role === 'admin' ? 'Admin' : 'Student'}
                      </span>
                    </div>
                    <p className="truncate text-sm text-slate-400">{p.email ?? '—'}</p>
                    <p className="text-xs text-slate-500">
                      {p.department ?? '—'} · joined {formatDate(p.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'settings' && (
            <div className="space-y-4">
              <Card>
                <h2 className="font-semibold text-white">Platform overview</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Honest, read-only information about how CampusFind is
                  configured. There are no hidden toggles here.
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  {[
                    ['App name', 'CampusFind'],
                    ['Purpose', 'Campus lost & found with verified claims'],
                    ['Database', 'Supabase Postgres with Row Level Security'],
                    ['Auth', 'College email + password (roles in profiles table)'],
                    ['Matching', 'match_item() — title/category/location similarity'],
                    ['Notifications', 'Server-side triggers on claims & status changes'],
                    ['Administration', 'Roles are managed in the database'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <dt className="text-slate-400">{k}</dt>
                      <dd className="text-right text-slate-200">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card>
                <h2 className="font-semibold text-white">Data &amp; privacy</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Contact details and claim messages are only visible to the
                  item reporter, the claimant, and administrators. Please keep
                  private identifiers (e.g. document numbers) out of public
                  descriptions.
                </p>
              </Card>
            </div>
          )}
        </div>
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
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10 text-sky-300 ring-1 ring-inset ring-sky-400/20">
          <Icon className="h-5 w-5" />
        </span>
        {sub && <ArrowRight className="h-4 w-4 text-slate-500" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </Card>
  )
}