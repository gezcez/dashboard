import type { ReactNode } from "react"
import { Logo } from "@/components/ui/logo"

/** Cream full-page frame for sign-in, callback and signed-out pages (the www look). */
export function AuthLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-cream">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8">{children}</div>
      </main>
      {footer && (
        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
            {footer}
          </div>
        </footer>
      )}
    </div>
  )
}
