import type { ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
          CampusFind — Reuniting lost items with their owners
        </div>
      </footer>
    </div>
  )
}