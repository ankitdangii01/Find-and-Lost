import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui'

export function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center px-4 py-20 text-center">
      <ShieldOff className="h-16 w-16 text-rose-400" />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Access Denied</h1>
      <p className="mt-2 text-sm text-slate-500">
        You do not have permission to view this page. Only administrators can
        access the admin dashboard.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  )
}
