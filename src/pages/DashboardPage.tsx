import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Search,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Item, MatchResult } from '@/types/database'
import { ItemCard } from '@/components/ui/ItemCard'
import { Button } from '@/components/ui'
import { formatDate } from '@/lib/utils'

const RECENT_LIMIT = 6

interface DashboardMatch extends MatchResult {
  source_item_id: string
  source_title: string
}

export function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [recent, setRecent] = useState<Item[]>([])
  const [matches, setMatches] = useState<DashboardMatch[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, lost: 0, found: 0, returned: 0 })

  const loadData = useCallback(async () => {
    const [{ data: recentData }, total, lost, found, returned] = await Promise.all([
      supabase
        .from('items')
        .select('*, profiles(id, full_name, department, year)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(RECENT_LIMIT),
      supabase.from('items').select('id', { count: 'exact', head: true }),
      supabase.from('items').select('id', { count: 'exact', head: true }).eq('type', 'lost'),
      supabase.from('items').select('id', { count: 'exact', head: true }).eq('type', 'found'),
      supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'resolved'),
    ])

    setRecent((recentData as Item[] | null) ?? [])
    setStats({
      total: total.count ?? 0,
      lost: lost.count ?? 0,
      found: found.count ?? 0,
      returned: returned.count ?? 0,
    })

    // Real smart matching: run match_item for each of the user's active reports.
    if (profile?.id) {
      const { data: myItems } = await supabase
        .from('items')
        .select('id, title')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .limit(6)

      const collected: DashboardMatch[] = []
      for (const mine of (myItems as Pick<Item, 'id' | 'title'>[] | null) ?? []) {
        if (collected.length >= 6) break
        const { data: result } = await supabase.rpc('match_item', {
          p_item_id: mine.id,
        })
        const rows = (result as MatchResult[] | null) ?? []
        collected.push(
          ...rows.map((r) => ({ ...r, source_item_id: mine.id, source_title: mine.title })),
        )
      }
      setMatches(
        collected
          .sort((a, b) => b.score - a.score)
          .slice(0, 6),
      )
    }
    setLoading(false)
  }, [profile])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-white/5" />
        <div className="mt-8 grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-subtle h-28 rounded-2xl" />
          ))}
        </div>
        <div className="mt-8 grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-subtle h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {profile?.full_name ? `Hi, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Find what you lost or help someone find theirs.
          </p>
        </div>
        {profile && (
          <Link
            to={`/users/${profile.id}`}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </Link>
        )}
      </div>

      {/* Stat cards (real numbers) */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {[
          {
            label: 'Total Reports',
            value: stats.total,
            icon: ClipboardList,
            ring: 'ring-blue-400/25 text-blue-300',
          },
          {
            label: 'Lost',
            value: stats.lost,
            icon: ArrowDownLeft,
            ring: 'ring-rose-400/25 text-rose-300',
          },
          {
            label: 'Found',
            value: stats.found,
            icon: ArrowUpRight,
            ring: 'ring-sky-400/25 text-sky-300',
          },
          {
            label: 'Possible Matches',
            value: matches.length,
            icon: Sparkles,
            ring: 'ring-cyan-400/25 text-cyan-300',
          },
          {
            label: 'Returned',
            value: stats.returned,
            icon: CheckCircle2,
            ring: 'ring-emerald-400/25 text-emerald-300',
          },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${s.ring}`}>
                <s.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-white">
              {s.value}
            </p>
            <p className="mt-0.5 text-sm text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="glass-input mt-8 flex items-center gap-3 px-4 py-2">
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            navigate(`/browse?q=${encodeURIComponent(query)}`)
          }}
          className="flex w-full items-center gap-2"
        >
          <input
            placeholder="Search lost or found items... e.g. black wallet near library"
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" className="shrink-0">
            Search
          </Button>
        </form>
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/report-lost"
          className="glass-card group flex items-center gap-3 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-rose-400/30 hover:shadow-[0_20px_50px_-24px_rgb(244_63_94_/_0.5)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-950/40 ring-1 ring-inset ring-white/20">
            <ArrowDownLeft className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold text-white">Report Lost Item</h3>
            <p className="text-sm text-slate-400">
              Lost something? Let the campus know.
            </p>
          </div>
        </Link>
        <Link
          to="/report-found"
          className="glass-card group flex items-center gap-3 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/30 hover:shadow-[0_20px_50px_-24px_rgb(34_211_238_/_0.5)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-lg shadow-sky-950/40 ring-1 ring-inset ring-white/20">
            <ArrowUpRight className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold text-white">Report Found Item</h3>
            <p className="text-sm text-slate-400">
              Found something? Help return it.
            </p>
          </div>
        </Link>
      </div>

      {matches.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-inset ring-cyan-400/25">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </span>
            <h2 className="text-lg font-bold text-white">
              Possible matches for you
            </h2>
            <span className="text-sm text-slate-500">
              based on your active reports
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <Link
                key={`${m.source_item_id}-${m.matched_item_id}`}
                to={`/items/${m.matched_item_id}`}
                className="glass-card group flex flex-col justify-between gap-3 p-5 transition duration-200 hover:-translate-y-1 hover:border-cyan-400/30"
              >
                <div>
                  <p className="truncate font-semibold text-white">
                    {m.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {m.item_type === 'found' ? 'Found' : 'Lost'} · {m.location ?? 'Unknown location'}
                    {m.date_occurred ? ` · ${formatDate(m.date_occurred)}` : ''}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-bold text-cyan-300 ring-1 ring-inset ring-cyan-400/25">
                    {m.score}% match
                  </span>
                  <span className="truncate pl-2 text-xs text-slate-500">
                    for: {m.source_title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent reports</h2>
          <Link
            to="/browse"
            className="text-sm font-semibold text-sky-400 transition hover:text-sky-300"
          >
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="glass-card border-dashed p-10 text-center">
            <p className="text-slate-400">
              No reports yet. Be the first to report an item!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}