import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import {
  CATEGORIES,
  CAMPUS_LOCATIONS,
  type ItemType,
} from '@/types/database'
import { Button, Input, Select, Textarea, Card } from '@/components/ui'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { friendlyError } from '@/lib/utils'

export function ReportItemPage({ type }: { type: ItemType }) {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [dateOccurred, setDateOccurred] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [occurredTime, setOccurredTime] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  const isLost = type === 'lost'
  const hasCustomLocation = location === 'Other'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (!session) {
      setError('You must be logged in.')
      setSubmitting(false)
      return
    }

    const locLabel = hasCustomLocation && customLocation.trim()
      ? customLocation.trim()
      : location

    const { data, error: insertError } = await supabase
      .from('items')
      .insert({
        user_id: session.user.id,
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        location: locLabel,
        date_occurred: dateOccurred,
        occurred_time: occurredTime || null,
        image_url: imageUrl,
        status: 'active',
      })
      .select('id')
      .single()

    if (insertError) {
      setError(friendlyError(insertError.message))
      setSubmitting(false)
      return
    }

    setSubmittedId(data.id)
    setSubmitting(false)
  }

  if (submittedId) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md items-center px-4 py-10">
        <Card className="w-full text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {isLost ? 'Lost item reported' : 'Found item reported'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your report is live. We matched details to show it to the right
            people on campus.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => navigate('/browse')}>Browse items</Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/items/${submittedId}`)}
            >
              View your report
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
            isLost ? 'bg-rose-600' : 'bg-sky-600'
          }`}
        >
          {isLost ? (
            <ArrowDownLeft className="h-6 w-6" />
          ) : (
            <ArrowUpRight className="h-6 w-6" />
          )}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Report {isLost ? 'Lost' : 'Found'} Item
          </h1>
          <p className="text-sm text-slate-500">
            Give enough detail to help {' '}
            {isLost
              ? 'others recognize your item'
              : 'the owner recognize their item'}
            .
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input
              label="Item name"
              required
              placeholder={isLost ? 'e.g. Black leather wallet' : 'e.g. Black Samsung phone'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                required
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <Select
                label={isLost ? 'Last seen at' : 'Found at'}
                required
                options={CAMPUS_LOCATIONS.map((l) => ({ value: l, label: l }))}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            {hasCustomLocation && (
              <Input
                label="Custom location"
                required
                placeholder="e.g. Third floor, boys washroom"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={isLost ? 'Date lost' : 'Date found'}
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
              />
              <Input
                label="Approximate time"
                type="time"
                value={occurredTime}
                onChange={(e) => setOccurredTime(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <ImageUploader existingUrl={imageUrl} onUploaded={setImageUrl} />
            </div>
            <Textarea
              label="Description"
              required
              rows={4}
              placeholder={
                isLost
                  ? 'Describe distinguishing features, brand, color, contents...'
                  : 'Describe what the item looks like, brand, distinguishing marks...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {isLost && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Tip: Don&apos;t include private identifying details (e.g.
                Aadhaar number, wallet contents list). Keep those for the
                owner/claimer verification step.
              </p>
            )}
          </div>
        </Card>

        {error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <Button type="submit" loading={submitting} className="w-full py-3 text-base">
          Submit report
        </Button>
      </form>
    </div>
  )
}