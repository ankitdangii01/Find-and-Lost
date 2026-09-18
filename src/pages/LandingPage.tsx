import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-32 left-1/2 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[130px]" />
          <div className="absolute right-[-6rem] top-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-[110px]" />
          <div className="absolute -left-24 top-64 h-72 w-72 rounded-full bg-indigo-500/10 blur-[110px]" />

          {/* faint orbiting glass tiles */}
          <div className="absolute left-[8%] top-[22%] hidden h-28 w-40 rotate-[-10deg] rounded-2xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.1)] backdrop-blur-xl lg:block" />
          <div className="absolute right-[7%] top-[30%] hidden h-24 w-36 rotate-[12deg] rounded-2xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.1)] backdrop-blur-xl lg:block" />
          <div className="absolute bottom-24 left-[20%] hidden h-20 w-32 rotate-[8deg] rounded-2xl border border-sky-400/20 bg-sky-400/[0.04] shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.1)] backdrop-blur-xl xl:block" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-20 text-center sm:pt-24">
          <span className="animate-rise inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3.5 py-1.5 text-sm font-medium text-slate-200 ring-1 ring-inset ring-white/15">
            <Sparkles className="h-4 w-4 text-sky-400" />
            Built for college campuses
          </span>

          <h1
            className="animate-rise mt-8 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl"
            style={{ animationDelay: '0.08s' }}
          >
            Lost something on campus?
            <span className="text-gradient mt-2 block pb-1">
              We can help you find it.
            </span>
          </h1>

          <p
            className="animate-rise mx-auto mt-6 max-w-2xl text-lg text-slate-400"
            style={{ animationDelay: '0.16s' }}
          >
            CampusFind is a central lost &amp; found platform for students and
            staff. Report what you lost or found, search across campus, and
            reunite items safely through verified claims.
          </p>

          <div
            className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '0.24s' }}
          >
            <Link
              to="/report-lost"
              className="btn-cta inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white"
            >
              <ArrowDownLeft className="h-5 w-5" />
              Report Lost Item
            </Link>
            <Link
              to="/report-found"
              className="btn-cta inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white [background-image:linear-gradient(180deg,rgb(255_255_255_/_0.16),rgb(255_255_255_/_0.02)_42%,rgb(0_0_0_/_0.1)),linear-gradient(180deg,#22d3ee_0%,#0891b2_100%)]"
            >
              <ArrowUpRight className="h-5 w-5" />
              Report Found Item
            </Link>
            <Link
              to={dashboardTarget !== '/browse' ? '/browse' : '/dashboard'}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-6 py-3.5 text-base font-semibold text-slate-200 ring-1 ring-inset ring-white/15 transition hover:bg-white/10 hover:text-white"
            >
              <Search className="h-5 w-5" />
              Browse Reports
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-slate-400">
            Four simple steps to get items back where they belong.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="glass-card group p-6 transition duration-200 hover:-translate-y-1 hover:border-sky-400/20"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-400/20 text-sky-300 ring-1 ring-inset ring-sky-400/25">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-white/15">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="glass-card relative overflow-hidden p-10 text-center sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_0%,rgb(56_99_255_/_0.14),transparent_70%)]"
          />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {session && profile
                ? 'Ready to report an item?'
                : 'Join your campus community today'}
            </h2>
            <p className="mt-3 text-slate-400">
              {session && profile
                ? 'Help reunite items or find what you lost.'
                : 'Create a free account and start reporting in under a minute.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={session && profile ? '/report-lost' : '/signup'}
                className="btn-cta inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white"
              >
                {session && profile ? 'Report a lost item' : 'Create your account'}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-base font-semibold text-slate-200 ring-1 ring-inset ring-white/15 transition hover:bg-white/10 hover:text-white"
              >
                Browse reports
              </Link>
            </div>
            {!session && (
              <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Free for students and staff · Campus email sign-up
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}