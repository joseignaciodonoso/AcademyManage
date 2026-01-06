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
  Database,
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
    name: "General",
    href: isClub ? "/club/settings" : "/admin/settings",
    icon: Settings,
  },
  {
    name: "Branding",
    href: isClub ? "/club/settings/branding" : "/admin/settings/branding",
    icon: Palette,
  },
]

interface AdminSidebarProps {
  className?: string
  prefix?: string // e.g., "/demoacademy" for tenantized routes
  role?: string
  organizationType?: "ACADEMY" | "CLUB"
  // Branding props
  academyName?: string
  logoUrl?: string | null
  logoDarkUrl?: string | null
}

interface SidebarContentProps {
  prefix?: string
  role?: string
  organizationType?: "ACADEMY" | "CLUB"
  academyName?: string
  logoUrl?: string | null
  logoDarkUrl?: string | null
}

function SidebarContent({ prefix, role, organizationType, academyName, logoUrl, logoDarkUrl }: SidebarContentProps) {
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
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header with Branding */}
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        <Link href={`${pref}${isClub ? '/club/dashboard' : '/admin/dashboard'}`} className="flex items-center justify-center w-full">
          {logoDarkUrl || logoUrl ? (
            <img 
              src={logoDarkUrl || logoUrl || ''} 
              alt={academyName || 'Logo'} 
              className="h-10 max-w-[200px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-md">
                {isClub ? (
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <span className="text-base font-semibold truncate max-w-[160px]">
                {academyName || (isClub ? 'Club Admin' : 'Academia Admin')}
              </span>
            </div>
          )}
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 py-4 px-3">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNav.map((item) => {
              const href = `${pref}${item.href}`
              const isActive = pathname === href
              return (
                <Link key={item.name} href={href} className="block">
                  <div
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/10"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-primary-foreground" : "text-sidebar-foreground/60"
                    )} />
                    <span>{item.name}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Settings Section */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">Configuración</p>
            <div className="space-y-1">
              {getSettingsNavigation(isClub).map((item) => {
                const href = `${pref}${item.href}`
                const isActive = pathname === href
                return (
                  <Link key={item.name} href={href} className="block">
                    <div
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/10"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-primary-foreground" : "text-sidebar-foreground/60"
                      )} />
                      <span>{item.name}</span>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
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

export function AdminSidebar({ className, prefix, role, organizationType, academyName, logoUrl, logoDarkUrl }: AdminSidebarProps) {
  return (
    <div className={cn("h-full", className)}>
      <SidebarContent 
        prefix={prefix} 
        role={role} 
        organizationType={organizationType}
        academyName={academyName}
        logoUrl={logoUrl}
        logoDarkUrl={logoDarkUrl}
      />
    </div>
  )
}

interface MobileSidebarProps {
  prefix?: string
  role?: string
  organizationType?: "ACADEMY" | "CLUB"
  academyName?: string
  logoUrl?: string | null
  logoDarkUrl?: string | null
}

export function MobileAdminSidebar({ prefix, role, organizationType, academyName, logoUrl, logoDarkUrl }: MobileSidebarProps) {
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
        <SidebarContent 
          prefix={prefix} 
          role={role} 
          organizationType={organizationType}
          academyName={academyName}
          logoUrl={logoUrl}
          logoDarkUrl={logoDarkUrl}
        />
      </SheetContent>
    </Sheet>
  )
}
