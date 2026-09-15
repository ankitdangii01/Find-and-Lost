import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Building2, Mail, User as UserIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Item, Profile } from '@/types/database'
import { Button, Card, Input, Select, Spinner } from '@/components/ui'
import { ItemCard } from '@/components/ui/ItemCard'

export function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', department: '', year: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const loadAll = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    setIsOwnProfile(currentUser?.id === id)

    const [profileRes, itemsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('items')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (profileRes.error || !profileRes.data) {
      setProfile(null)
    } else {
      const p = profileRes.data as Profile
      setProfile(p)
      setForm({
        full_name: p.full_name ?? '',
        department: p.department ?? '',
        year: p.year ? String(p.year) : '',
      })
    }
    setItems((itemsRes.data as Item[] | null) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    if (!id) return
    void loadAll()
  }, [id, loadAll])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-slate-700">Profile not found.</p>
      </div>
    )
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        department: form.department.trim(),
        year: form.year ? Number(form.year) : null,
      })
      .eq('id', id!)
    setSaving(false)
    if (!error) {
      setProfile((p) =>
        p
          ? {
              ...p,
              full_name: form.full_name.trim(),
              department: form.department.trim(),
              year: form.year ? Number(form.year) : null,
            }
          : p,
      )
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="w-full md:w-64">
          <Card className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-3xl font-bold text-white">
              {(profile.full_name ?? profile.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <h1 className="mt-3 text-lg font-bold text-slate-900">
              {profile.full_name ?? 'Campus User'}
            </h1>
            {profile.department && (
              <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
                <Building2 className="h-4 w-4" />
                {profile.department}
                {profile.year ? ` · Year ${profile.year}` : ''}
              </p>
            )}
            {profile.email && (
              <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
            )}
            <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {profile.role === 'admin' ? 'Admin' : 'Student'}
            </span>
          </Card>

          {isOwnProfile && !editing && (
            <Card className="mt-4">
              <Button variant="secondary" className="w-full" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            </Card>
          )}

          {isOwnProfile && editing && (
            <Card className="mt-4">
              <form onSubmit={(e) => void saveProfile(e)} className="space-y-3">
                <Input
                  label="Full name"
                  value={form.full_name}
                  disabled
                  title="Full name cannot be changed after signup"
                />
                <Input
                  label="Department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
                <Select
                  label="Year"
                  options={['1', '2', '3', '4', '5'].map((y) => ({ value: y, label: `Year ${y}` }))}
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button type="submit" loading={saving} className="flex-1">
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {saved && (
            <p className="mt-3 text-center text-sm font-medium text-emerald-600">
              Profile saved!
            </p>
          )}
        </div>

        <div className="flex-1">
          <div className="mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
          </div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No reports yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}