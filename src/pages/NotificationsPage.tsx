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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Notifications
          </h1>
          {unread > 0 && (
            <p className="mt-1 text-sm text-slate-400">
              {unread} unread notification{unread === 1 ? '' : 's'}
            </p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => void markAllRead()}
            className="text-sm font-semibold text-sky-400 transition hover:text-sky-300"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mt-6">
        {notifications.length === 0 ? (
          <div className="glass-card border-dashed p-12 text-center">
            <BellRing className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-slate-400">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'glass-card p-4 transition duration-200',
                  n.is_read
                    ? 'opacity-70'
                    : 'border-sky-400/25 bg-sky-400/[0.03] shadow-[0_12px_36px_-16px_rgb(34_211_238_/_0.35)]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">
                    {n.title}
                  </h3>
                  {!n.is_read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-400 shadow-[0_0_10px_2px_rgb(34_211_238_/_0.6)]" />
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-400">{n.message}</p>
                <p className="mt-2 text-xs text-slate-500">
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