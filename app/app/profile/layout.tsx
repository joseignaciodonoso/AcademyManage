"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PropsWithChildren } from "react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/app/profile", label: "Inicio" },
  { href: "/app/profile/payments", label: "Mis pagos" },
  { href: "/app/profile/calendar", label: "Calendario" },
  { href: "/app/profile/content", label: "Contenido" },
  { href: "/app/profile/announcements", label: "Anuncios" },
  { href: "/app/profile/settings", label: "Mi perfil" },
]

export default function ProfileLayout({ children }: PropsWithChildren) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Mi espacio</h1>
        <nav className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => {
            const active = pathname === t.href
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm border",
                  active
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent"
                    : "bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))] border-border hover:bg-[hsl(var(--muted))]"
                )}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
        <div className="rounded-xl border border-border bg-[hsl(var(--card))]">
          {children}
        </div>
      </div>
    </div>
  )
}
