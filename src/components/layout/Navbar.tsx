import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: Compass },
  { to: '/browse', label: 'Browse', icon: Search },
  { to: '/my-reports', label: 'My Reports', icon: User },
]

const ACTIVE_CLASS =
  'bg-white/10 text-sky-300 ring-1 ring-inset ring-sky-400/20'
const IDLE_CLASS = 'text-slate-300 hover:bg-white/5 hover:text-white'

export function Navbar() {
  const { session, profile, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      setUnreadCount(0)
      return
    }
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
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  if (loading) return null

  const initials =
    profile?.full_name?.charAt(0)?.toUpperCase() ??
    profile?.email?.charAt(0)?.toUpperCase() ??
    '?'

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-extrabold text-white shadow-[0_6px_18px_-6px_rgb(56_99_255_/_0.7)] ring-1 ring-inset ring-white/25">
            C
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            Campus<span className="text-gradient">Find</span>
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
                  isActive ? ACTIVE_CLASS : IDLE_CLASS,
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive ? ACTIVE_CLASS : IDLE_CLASS,
                )
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          {session && profile ? (
            <>
              <button
                onClick={() => navigate('/notifications')}
                className="relative rounded-xl p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#070c1e]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <Link
                to={`/users/${profile.id}`}
                className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-white/5"
                title="Profile"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-semibold text-white ring-1 ring-inset ring-white/25">
                  {initials}
                </span>
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  navigate('/')
                }}
                className="hidden rounded-xl p-2 text-slate-300 transition hover:bg-white/5 hover:text-white sm:block"
                title="Logout"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <Link
                to={session ? '/report-lost' : '/login'}
                className="btn-cta hidden items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                Report
              </Link>
              <button
                onClick={() => setMenuOpen(true)}
                className="rounded-xl p-2 text-slate-300 transition hover:bg-white/5 hover:text-white md:hidden"
                title="Menu"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="btn-cta rounded-xl px-4 py-2 text-sm font-semibold text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-l border-white/10 bg-[#080e22]/95 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="flex items-center gap-2 font-bold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-extrabold text-white ring-1 ring-inset ring-white/25">
                  C
                </span>
                Campus<span className="text-gradient">Find</span>
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-3">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                      isActive ? ACTIVE_CLASS : IDLE_CLASS,
                    )
                  }
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                      isActive ? ACTIVE_CLASS : IDLE_CLASS,
                    )
                  }
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Admin
                </NavLink>
              )}
              {session && profile && (
                <Link
                  to={`/users/${profile.id}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
              )}
            </nav>

            <div className="border-t border-white/10 p-3">
              <Link
                to={session ? '/report-lost' : '/login'}
                className="btn-cta flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Report an item
              </Link>
              {session && (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    navigate('/')
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}