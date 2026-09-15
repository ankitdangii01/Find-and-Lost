import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterX, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  CATEGORIES,
  CAMPUS_LOCATIONS,
  type Item,
} from '@/types/database'
import { ItemCard } from '@/components/ui/ItemCard'
import { Button, Input, Select } from '@/components/ui'
import { cn } from '@/lib/utils'

const TYPE_FILTERS = [
  { value: '', label: 'Both' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'date_occurred', label: 'Date occurred' },
]

const PAGE_SIZE = 12

export function BrowseItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? ''
  const category = searchParams.get('category') ?? ''
  const location = searchParams.get('location') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const sort = searchParams.get('sort') ?? 'newest'

  const loadItems = useCallback(
    async (append: boolean) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      let query = supabase
        .from('items')
        .select('*, profiles(id, full_name, department, year)')
        .eq('status', 'active')

      if (type === 'lost' || type === 'found') {
        query = query.eq('type', type)
      }
      if (category) {
        query = query.eq('category', category)
      }
      if (location) {
        query = query.eq('location', location)
      }
      if (from) {
        const fromDate = new Date(from)
        query = query.gte('date_occurred', fromDate.toISOString())
      }
      if (to) {
        const toDate = new Date(to)
        query = query.lte('date_occurred', toDate.toISOString())
      }
      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      }

      if (sort === 'oldest') {
        query = query.order('created_at', { ascending: true })
      } else if (sort === 'date_occurred') {
        query = query.order('date_occurred', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const fromIndex = append ? items.length : 0
      query = query.range(fromIndex, fromIndex + PAGE_SIZE - 1)

      const { data, error } = await query

      if (error) {
        setError(error.message)
        if (!append) setItems([])
      } else {
        const rows = (data as Item[] | null) ?? []
        setItems((prev) => (append ? [...prev, ...rows] : rows))
        setHasMore(rows.length === PAGE_SIZE)
      }
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, type, category, location, sort, from, to, items.length],
  )

  useEffect(() => {
    void loadItems(false)
  }, [q, type, category, location, sort, from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }

  const hasFilters = Boolean(q || type || category || location || from || to || sort !== 'newest')

  const resultCountLabel = useMemo(() => {
    if (loading) return 'Searching...'
    return `${items.length} shown`
  }, [loading, items.length])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Browse reports</h1>
      <p className="mt-1 text-sm text-slate-500">
        Search and filter lost &amp; found reports across campus.
      </p>

      <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.currentTarget)
              updateParam('q', String(form.get('q') ?? '').trim())
            }}
            className="flex items-center gap-2"
          >
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name or description..."
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <Button type="submit" className="shrink-0">
              Search
            </Button>
          </form>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              aria-label="Filter by type"
              options={TYPE_FILTERS}
              value={type}
              onChange={(e) => updateParam('type', e.target.value)}
            />
            <Select
              aria-label="Filter by category"
              options={[{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
              value={category}
              onChange={(e) => updateParam('category', e.target.value)}
            />
            <Select
              aria-label="Filter by location"
              options={[{ value: '', label: 'All locations' }, ...CAMPUS_LOCATIONS.map((l) => ({ value: l, label: l }))]}
              value={location}
              onChange={(e) => updateParam('location', e.target.value)}
            />
            <Input
              label="From date"
              aria-label="From date"
              type="date"
              value={from}
              onChange={(e) => updateParam('from', e.target.value)}
            />
            <Input
              label="To date"
              aria-label="To date"
              type="date"
              value={to}
              onChange={(e) => updateParam('to', e.target.value)}
            />
            <Select
              aria-label="Sort by"
              options={SORT_OPTIONS}
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
            />
          </div>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">{resultCountLabel}</span>
          <button
            onClick={() => setSearchParams({}, { replace: true })}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-rose-600',
            )}
          >
            <FilterX className="h-4 w-4" />
            Clear filters
          </button>
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium text-slate-700">No items found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="secondary"
                  loading={loadingMore}
                  onClick={() => void loadItems(true)}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}