"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  BarChart3,
  Users,
  CreditCard,
  Calendar,
  BookOpen,
  Settings,
  Menu,
  Home,
  Building,
  GraduationCap,
  Palette,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    name: "Alumnos",
    href: "/admin/students",
    icon: Users,
  },
  {
    name: "Planes",
    href: "/admin/plans",
    icon: GraduationCap,
  },
  {
    name: "Pagos",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    name: "Calendario",
    href: "/admin/calendar",
    icon: Calendar,
  },
  {
    name: "Asistencia",
    href: "/admin/attendance",
    icon: Calendar,
  },
  {
    name: "Contenido",
    href: "/admin/content",
    icon: BookOpen,
  },
  {
    name: "Reportes",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "Sedes",
    href: "/admin/branches",
    icon: Building,
  },
]

const settingsNavigation = [
  {
    name: "Branding",
    href: "/admin/settings/branding",
    icon: Palette,
  },
  {
    name: "General",
    href: "/admin/settings",
    icon: Settings,
  },
]

interface AdminSidebarProps {
  className?: string
}

function SidebarContent() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-6 bg-[hsl(var(--background))]">
        <Link href="/admin/dashboard" className="flex items-center gap-3 font-bold text-white group transition-all duration-200 hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] shadow-lg transition-all duration-200">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg text-[hsl(var(--foreground))]">Academia Admin</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-6 py-6 px-4">
          {/* Main Navigation */}
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = usePathname() === item.href
              return (
                <Link key={item.name} href={item.href} className="block">
                  <div
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 overflow-hidden isolate",
                      isActive
                        ? "bg-gradient-to-r from-[hsl(var(--primary))]/20 to-[hsl(var(--accent))]/20 text-[hsl(var(--foreground))] shadow-lg border border-[hsl(var(--primary))]/30"
                        : "text-[hsl(var(--foreground))]/70 hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/50 hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-lg" 
                        : "bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))]/60 group-hover:bg-[hsl(var(--muted))] group-hover:text-[hsl(var(--foreground))]"
                    )}>
                      <item.icon className="h-4 w-4 text-[hsl(var(--foreground))]/60 group-hover:text-[hsl(var(--foreground))]" />
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-[hsl(var(--accent))]" />
                    )}
                    {isActive && (
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--accent))] rounded-r-full" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Settings Section */}
          <div className="space-y-3">
            <div className="px-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[hsl(var(--muted))] to-transparent" />
                <h3 className="text-xs font-semibold text-[hsl(var(--foreground))]/60 uppercase tracking-wider">Configuración</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[hsl(var(--muted))] to-transparent" />
              </div>
            </div>
            <div className="space-y-2">
              {settingsNavigation.map((item) => {
                const isActive = usePathname() === item.href
                return (
                  <Link key={item.name} href={item.href} className="block">
                    <div
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 overflow-hidden isolate",
                        isActive
                          ? "bg-gradient-to-r from-[hsl(var(--primary))]/20 to-[hsl(var(--accent))]/20 text-[hsl(var(--foreground))] border border-[hsl(var(--primary))]/30"
                          : "text-[hsl(var(--foreground))]/70 hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/50 hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-lg" 
                          : "bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))]/60 group-hover:bg-[hsl(var(--muted))] group-hover:text-[hsl(var(--foreground))]"
                      )}>
                        <item.icon className="h-4 w-4 text-[hsl(var(--foreground))]/60 group-hover:text-[hsl(var(--foreground))]" />
                      </div>
                      <span className="flex-1">{item.name}</span>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-[hsl(var(--accent))]" />
                      )}
                      {isActive && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--accent))] rounded-r-full" />
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  return (
    <div className={cn("h-full", className)}>
      <SidebarContent />
    </div>
  )
}

export function MobileAdminSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}
