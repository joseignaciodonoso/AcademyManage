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
  Trophy,
  Target,
  Activity,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Navigation for ACADEMY type
const academyNavigation = [
  {
    name: "Organizaciones",
    href: "/admin/organizations",
    icon: Building,
  },
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
    name: "Gastos",
    href: "/admin/expenses",
    icon: Receipt,
  },
  {
    name: "Calendario",
    href: "/admin/calendar",
    icon: Calendar,
  },
  {
    name: "Horarios",
    href: "/admin/schedules",
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
    name: "Configuración",
    href: "/admin/settings",
    icon: Settings,
  },
]

// Navigation for CLUB type
const clubNavigation = [
  {
    name: "Organizaciones",
    href: "/admin/organizations",
    icon: Building,
  },
  {
    name: "Dashboard",
    href: "/club/dashboard",
    icon: Home,
  },
  {
    name: "Jugadores",
    href: "/club/members",
    icon: Users,
  },
  {
    name: "Partidos",
    href: "/club/matches",
    icon: Trophy,
  },
  {
    name: "Torneos",
    href: "/club/tournaments",
    icon: Target,
  },
  {
    name: "Entrenamientos",
    href: "/club/trainings",
    icon: Activity,
  },
  {
    name: "Armar Jugadas",
    href: "/club/coach/plays",
    icon: Target,
  },
  {
    name: "Gastos",
    href: "/club/expenses",
    icon: Receipt,
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
    name: "Reportes",
    href: "/admin/reports",
    icon: BarChart3,
  },
]

const getSettingsNavigation = (isClub: boolean) => [
  {
    name: "Branding",
    href: isClub ? "/club/settings/branding" : "/admin/settings/branding",
    icon: Palette,
  },
  {
    name: "General",
    href: isClub ? "/club/settings" : "/admin/settings",
    icon: Settings,
  },
]

interface AdminSidebarProps {
  className?: string
  prefix?: string // e.g., "/demoacademy" for tenantized routes
  role?: string
  organizationType?: "ACADEMY" | "CLUB"
}

function SidebarContent({ prefix, role, organizationType }: { prefix?: string; role?: string; organizationType?: "ACADEMY" | "CLUB" }) {
  const pathname = usePathname()
  const pref = prefix ?? ""
  const isSuperAdmin = role === "SUPER_ADMIN"
  const isClub = organizationType === "CLUB"

  // Select navigation based on organization type
  const baseNavigation = isClub ? clubNavigation : academyNavigation

  // Filter out items based on role and feature flags
  const filtered = baseNavigation
    // Remove Organizations for non SUPER_ADMIN
    .filter((item) => isSuperAdmin || item.href !== "/admin/organizations")
    // Remove Branches (Sedes) globally (feature disabled)
    .filter((item) => item.href !== "/admin/branches")
  const mainNav = filtered

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(var(--background))]/85 to-[hsl(var(--muted))]/35 backdrop-blur-md border-r border-[hsl(var(--muted))]/40">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-16 -left-20 h-44 w-44 rounded-full bg-[hsl(var(--primary))] blur-2xl" />
        <div className="absolute bottom-10 -right-16 h-56 w-56 rounded-full bg-[hsl(var(--accent))] blur-3xl" />
      </div>
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-6 bg-[hsl(var(--background))]">
        <Link href={`${pref}${isClub ? '/club/dashboard' : '/admin/dashboard'}`} className="flex items-center gap-3 font-bold text-white group transition-all duration-200 hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] shadow-lg transition-all duration-200">
            {isClub ? <Trophy className="h-5 w-5 text-white" /> : <GraduationCap className="h-5 w-5 text-white" />}
          </div>
          <span className="text-lg text-[hsl(var(--foreground))]">{isClub ? 'Club Admin' : 'Academia Admin'}</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-6 py-6 px-4">
          {/* Main Navigation */}
          <div className="space-y-2">
            {mainNav.map((item) => {
              const href = `${pref}${item.href}`
              const isActive = pathname === href
              return (
                <Link key={item.name} href={href} className="block">
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
              {getSettingsNavigation(isClub).map((item) => {
                const href = `${pref}${item.href}`
                const isActive = pathname === href
                return (
                  <Link key={item.name} href={href} className="block">
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

export function AdminSidebar({ className, prefix, role, organizationType }: AdminSidebarProps) {
  return (
    <div className={cn("h-full", className)}>
      <SidebarContent prefix={prefix} role={role} organizationType={organizationType} />
    </div>
  )
}

export function MobileAdminSidebar({ prefix, role, organizationType }: { prefix?: string; role?: string; organizationType?: "ACADEMY" | "CLUB" }) {
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
        <SidebarContent prefix={prefix} role={role} organizationType={organizationType} />
      </SheetContent>
    </Sheet>
  )
}
