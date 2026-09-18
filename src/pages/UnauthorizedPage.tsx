import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui'

export function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-400/10 text-rose-300 ring-1 ring-inset ring-rose-400/25">
        <ShieldOff className="h-10 w-10" />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-white">Access Denied</h1>
      <p className="mt-2 text-sm text-slate-400">
        You do not have permission to view this page. Only administrators can
        access the admin dashboard.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  )
}