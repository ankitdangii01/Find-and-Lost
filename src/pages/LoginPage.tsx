import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()
      navigate(profile?.role === 'admin' ? '/admin' : '/dashboard')
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center px-4 py-10">
      <div className="w-full">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="glass-card p-8">
          <div className="mb-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-extrabold text-white shadow-[0_12px_40px_-12px_rgb(56_99_255_/_0.7)] ring-1 ring-inset ring-white/25">
              C
            </span>
            <h1 className="mt-4 text-2xl font-bold text-white">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Log in to report and find lost items
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <Input
              label="College email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@sati.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="rounded-lg bg-rose-400/10 px-3 py-2 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/20">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-sky-400 transition hover:text-sky-300"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}