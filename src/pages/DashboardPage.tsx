import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Search,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Item } from '@/types/database'
import { ItemCard } from '@/components/ui/ItemCard'
import { Button } from '@/components/ui'

const RECENT_LIMIT = 6

export function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [recent, setRecent] = useState<Item[]>([])
  const [matches, setMatches] = useState<Item[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [{ data: recentData }, { data: lostItems }] = await Promise.all([
      supabase
        .from('items')
        .select(
          '*, profiles(id, full_name, department, year)',
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(RECENT_LIMIT),
      supabase
        .from('items')
        .select('*')
        .eq('type', 'lost')
        .eq('status', 'active')
        .limit(100),
    ])

    setRecent((recentData as Item[] | null) ?? [])

    if (profile?.department) {
      const dept = profile.department.toLowerCase()
      const filtered = ((lostItems as Item[] | null) ?? []).filter(
        (lost) =>
          lost.user_id !== profile.id &&
          !!lost.description &&
          lost.description.toLowerCase().includes(dept),
      )
      setMatches(filtered.slice(0, 3))
    }
    setLoading(false)
  }, [profile])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return <div className="h-40 animate-pulse bg-slate-100" />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {profile?.full_name ? `Hi, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-slate-500">
            Find what you lost or help someone find theirs.
          </p>
        </div>
        {profile && (
          <Link
            to={`/users/${profile.id}`}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </Link>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            navigate(`/browse?q=${encodeURIComponent(query)}`)
          }}
          className="flex items-center gap-2"
        >
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            placeholder="Search lost or found items... e.g. black wallet near library"
            className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" className="shrink-0">
            Search
          </Button>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/report-lost"
          className="group rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 transition hover:border-rose-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-600 text-white">
              <ArrowDownLeft className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-900">Report Lost Item</h3>
              <p className="text-sm text-slate-500">
                Lost something? Let the campus know.
              </p>
            </div>
          </div>
        </Link>
        <Link
          to="/report-found"
          className="group rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 transition hover:border-sky-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white">
              <ArrowUpRight className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-900">Report Found Item</h3>
              <p className="text-sm text-slate-500">
                Found something? Help return it.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {matches.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              Possible matches for you
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent reports
          </h2>
          <Link
            to="/browse"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-500">
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