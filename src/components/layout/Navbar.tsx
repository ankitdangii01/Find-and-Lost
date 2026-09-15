import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Compass, LayoutDashboard, LogOut, Plus, Search, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: Compass },
  { to: '/browse', label: 'Browse', icon: Search },
  { to: '/my-reports', label: 'My Reports', icon: User },
]

export function Navbar() {
  const { session, profile, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!session?.user) return
    let cancelled = false
    const loadCount = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false)
      if (!cancelled && !error) setUnreadCount(data?.length ?? 0)
    }
    void loadCount()
    return () => { cancelled = true }
  }, [session])

  if (loading) return null

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
            C
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Campus<span className="text-primary-600">Find</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {session && profile ? (
            <>
              <button
                onClick={() => navigate('/notifications')}
                className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <Link
                to={`/users/${profile.id}`}
                className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"
                title="Profile"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white">
                  {(profile.full_name ?? profile.email ?? '?')
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <span className="hidden text-sm font-medium text-slate-700 lg:block">
                  {profile.full_name?.split(' ')[0]}
                </span>
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  navigate('/')
                }}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                Sign up
              </Link>
            </div>
          )}
          <Link
            to={session ? '/report-lost' : '/login'}
            className="hidden items-center gap-1.5 rounded-xl bg-accent-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-600 sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            Report
          </Link>
        </div>
      </div>
    </header>
  )
}