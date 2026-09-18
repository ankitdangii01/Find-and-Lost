import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.04] text-slate-500 ring-1 ring-inset ring-white/10">
        <SearchX className="h-10 w-10" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
        Page not found
      </h1>
      <p className="mt-2 text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        to="/"
        className="btn-cta mt-8 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
      >
        Go home
      </Link>
    </div>
  )
}