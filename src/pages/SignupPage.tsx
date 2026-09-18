import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, Input, Select } from '@/components/ui'

export function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
          department,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (user) {
      const { error: profileError } = await supabase.from('profiles').update({
        department: department || null,
        year: year ? Number(year) : null,
      }).eq('id', user.id)
      if (profileError) {
        console.error('Profile update failed', profileError)
      }
    }

    setLoading(false)
    navigate('/dashboard')
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
              Create your account
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Join CampusFind and help your campus recover lost items
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <Input
              label="Full name"
              required
              autoComplete="name"
              placeholder="Aman Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="College email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@sati.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Department"
                required
                placeholder="e.g. CSE"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              <Select
                label="Year"
                options={['1', '2', '3', '4', '5'].map((y) => ({
                  value: y,
                  label: `Year ${y}`,
                }))}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="rounded-lg bg-rose-400/10 px-3 py-2 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/20">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-sky-400 transition hover:text-sky-300"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}