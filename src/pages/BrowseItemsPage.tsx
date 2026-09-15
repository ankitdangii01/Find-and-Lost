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
import { Button, Select } from '@/components/ui'
import { cn } from '@/lib/utils'

const TYPE_FILTERS = [
  { value: '', label: 'Both' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
]

export function BrowseItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? ''
  const category = searchParams.get('category') ?? ''
  const location = searchParams.get('location') ?? ''

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('items')
      .select('*, profiles(id, full_name, department, year)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (type === 'lost' || type === 'found') {
      query = query.eq('type', type)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (location) {
      query = query.eq('location', location)
    }
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    }

    const { data, error } = await query.limit(60)

    if (error) {
      setError(error.message)
      setItems([])
    } else {
      setItems((data as Item[] | null) ?? [])
    }
    setLoading(false)
  }, [q, type, category, location])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }

  const hasFilters = Boolean(q || type || category || location)

  const activeCount = useMemo(
    () => items.filter((i) => i.status !== 'removed').length,
    [items],
  )

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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          </div>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {activeCount} result{activeCount === 1 ? '' : 's'}
          </span>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}