"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Building2,
  Palette,
  Settings
} from "lucide-react"

const settingsNavigation = [
  {
    name: "General",
    href: "/admin/settings",
    icon: Settings,
    description: "Cuentas bancarias y configuración general"
  },
  {
    name: "Branding",
    href: "/admin/settings/branding", 
    icon: Palette,
    description: "Personalización visual de la academia"
  }
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Gestiona la configuración de tu academia</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-fit">
        {settingsNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "flex items-center gap-2 px-4 py-2",
                  isActive && "bg-background shadow-sm"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
