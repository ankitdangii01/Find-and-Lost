import type { ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient blurred colour shapes behind content */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[110px]" />
        <div className="absolute right-[-8rem] top-[42rem] h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-[-6rem] left-1/3 h-80 w-80 rounded-full bg-indigo-600/10 blur-[110px]" />
      </div>

      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="mt-16 border-t border-white/10 bg-white/[0.02] py-8 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
          CampusFind — Reuniting lost items with their owners on campus
        </div>
      </footer>
    </div>
  )
}