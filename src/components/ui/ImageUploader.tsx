import { useState, useRef } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ImageUploader({
  onUploaded,
  existingUrl,
}: {
  onUploaded: (url: string | null) => void
  existingUrl?: string | null
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be smaller than 4MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }

    setUploading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to upload.')
      setUploading(false)
      return
    }

    const fileExt = file.name.split('.').pop() ?? 'jpg'
    const filePath = `items/${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(filePath, file, { cacheControl: '3600' })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('item-images').getPublicUrl(filePath)

    setPreview(publicUrl)
    onUploaded(publicUrl)
    setUploading(false)
  }

  function handleRemove() {
    setPreview(null)
    onUploaded(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        Photo (optional)
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      <div className="flex items-start gap-3">
        {preview ? (
          <div className="relative overflow-hidden rounded-xl border border-slate-200">
            <img
              src={preview}
              alt="Item preview"
              className="h-32 w-44 object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/60 p-1.5 text-white transition hover:bg-slate-900/80"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-32 w-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">Upload photo</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </div>
  )
}