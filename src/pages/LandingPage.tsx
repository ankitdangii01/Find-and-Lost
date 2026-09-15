import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Search,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const STEPS = [
  {
    icon: Upload,
    title: 'Report',
    text: 'Report a lost or found item with photo, location, and details in under a minute.',
  },
  {
    icon: Search,
    title: 'Search & Match',
    text: 'Browse reports or let the smart match feature connect you to likely matches.',
  },
  {
    icon: ShieldCheck,
    title: 'Claim & Verify',
    text: 'Claim an item, answer ownership questions, and get it back — or return what you found.',
  },
  {
    icon: ArrowRight,
    title: 'Return',
    text: 'Coordinate a safe handover and mark the item returned once it is back with its owner.',
  },
]

export function LandingPage() {
  const { session, profile } = useAuth()
  const dashboardTarget = session ? '/dashboard' : '/browse'

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-950 via-primary-900 to-primary-800 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent-400 blur-3xl" />
          <div className="absolute -right-16 top-40 h-80 w-80 rounded-full bg-sky-400 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Built for college campuses
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Lost something on campus?
              <span className="block text-accent-300">We can help find it.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100">
              CampusFind is a centralized lost &amp; found platform for students
              and staff. Report what you lost or found, search across the campus,
              and reunite items safely through verified claims.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={dashboardTarget}
                className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-accent-600"
              >
                Get started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Browse reports
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
              <Link to="/report-lost" className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:bg-white/10">
                <ArrowDownLeft className="h-6 w-6 text-rose-300" />
                <p className="mt-2 text-base font-bold">Report a lost item</p>
                <p className="text-sm text-primary-200">
                  Post what you lost with details and a photo.
                </p>
              </Link>
              <Link to="/report-found" className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition hover:bg-white/10">
                <ArrowUpRight className="h-6 w-6 text-sky-300" />
                <p className="mt-2 text-base font-bold">Report a found item</p>
                <p className="text-sm text-primary-200">
                  Found something? Help it get back to its owner.
                </p>
              </Link>
              <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <Users className="h-6 w-6 text-accent-300" />
                <p className="mt-2 text-base font-bold">Verified claims</p>
                <p className="text-sm text-primary-200">
                  Ownership is verified through private details before items are returned.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-2 text-slate-500">
              Four simple steps to get items back where they belong.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6"
              >
                <span className="absolute right-4 top-4 text-4xl font-extrabold text-slate-200">
                  0{i + 1}
                </span>
                <step.icon className="h-8 w-8 text-primary-600" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-slate-500">
              {session && profile
                ? 'Ready to report an item?'
                : 'Join your campus community today.'}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                to={session ? '/report-lost' : '/signup'}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-primary-700"
              >
                {session && profile ? 'Report lost item' : 'Create your account'}
                <ArrowRight className="h-5 w-5" />
              </Link>
              {session && profile && (
                <Link
                  to="/report-found"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-600"
                >
                  Report found item
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}