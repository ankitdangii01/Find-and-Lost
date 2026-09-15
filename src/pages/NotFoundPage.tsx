import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <SearchX className="h-16 w-16 text-slate-300" />
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        Go home
      </Link>
    </div>
  )
}