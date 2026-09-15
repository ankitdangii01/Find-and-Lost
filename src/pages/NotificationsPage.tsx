import { useCallback, useEffect, useState } from 'react'
import { BellRing } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Notification } from '@/types/database'
import { Spinner } from '@/components/ui'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function NotificationsPage() {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error(error)
      setNotifications([])
    } else {
      setNotifications((data as Notification[] | null) ?? [])
    }
    setLoading(false)
  }, [session])

  useEffect(() => {
    if (!session) return
    void loadNotifications()
  }, [session, loadNotifications])

  async function markAllRead() {
    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', session!.user.id)
      .eq('is_read', false)
    const ids = (data as { id: string }[] | null)?.map((n) => n.id) ?? []
    if (ids.length > 0) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', ids)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unread > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {unread} unread notification{unread === 1 ? '' : 's'}
            </p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => void markAllRead()}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mt-6">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <BellRing className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'rounded-xl border p-4 transition',
                  n.is_read
                    ? 'border-slate-200 bg-white'
                    : 'border-primary-200 bg-primary-50',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {n.title}
                  </h3>
                  {!n.is_read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {formatRelative(n.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}