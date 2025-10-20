"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, User, CreditCard, Calendar, BookOpen, Trophy, Menu, GraduationCap, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Inicio",
    href: "/app",
    icon: Home,
  },
  {
    name: "Mi Perfil",
    href: "/app/profile",
    icon: User,
  },
  {
    name: "Mi Plan",
    href: "/app/plan",
    icon: GraduationCap,
  },
  {
    name: "Pagos",
    href: "/app/billing",
    icon: CreditCard,
  },
  {
    name: "Calendario",
    href: "/app/calendar",
    icon: Calendar,
  },
  {
    name: "Contenido",
    href: "/app/content",
    icon: BookOpen,
  },
  {
    name: "Progreso",
    href: "/app/progress",
    icon: Trophy,
  },
]

interface StudentSidebarProps {
  className?: string
  hasActivePlan?: boolean
  prefix?: string // e.g., "/demoacademy" for tenantized routes
}

function SidebarContent({ hasActivePlan, prefix }: { hasActivePlan?: boolean; prefix?: string }) {
  const pathname = usePathname()
  const pref = prefix ?? ""

  // Define base nav
  const fullNav = [
    { name: "Inicio", href: `${pref}/app`, icon: Home },
    { name: "Asistencia", href: `${pref}/app/attendance`, icon: GraduationCap },
    { name: "Mi Plan", href: `${pref}/app/plan`, icon: GraduationCap },
    { name: "Pagos", href: `${pref}/app/billing`, icon: CreditCard },
    { name: "Calendario", href: `${pref}/app/calendar`, icon: Calendar },
  ]

  const visibleNav = hasActivePlan ? fullNav : [
    { name: "Pagos", href: `${pref}/app/billing`, icon: CreditCard },
  ]

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-6 bg-[hsl(var(--background))]">
        <Link href={`${pref}/app`} className="flex items-center gap-3 font-bold text-white group transition-all duration-200 hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] shadow-lg transition-all duration-200">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg text-[hsl(var(--foreground))]">Portal Estudiante</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 py-6 px-4">
          <div className="space-y-2">
            {visibleNav.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/") ||
                (pathname.startsWith(`${pref}/app/subscribe`) && item.href === `${pref}/app/billing`)
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
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-lg"
                          : "bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))]/60 group-hover:bg-[hsl(var(--muted))] group-hover:text-[hsl(var(--foreground))]"
                      )}
                    >
                      <item.icon className="h-4 w-4 text-[hsl(var(--foreground))]/60 group-hover:text-[hsl(var(--foreground))]" />
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive && <ChevronRight className="h-4 w-4 text-[hsl(var(--accent))]" />}
                    {isActive && (
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--accent))] rounded-r-full" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export function StudentSidebar({ className, hasActivePlan, prefix }: StudentSidebarProps) {
  return (
    <div className={cn("h-full", className)}>
      <SidebarContent hasActivePlan={hasActivePlan} prefix={prefix} />
    </div>
  )
}

export function MobileStudentSidebar({ hasActivePlan, prefix }: { hasActivePlan?: boolean; prefix?: string }) {
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
        <SidebarContent hasActivePlan={hasActivePlan} prefix={prefix} />
      </SheetContent>
    </Sheet>
  )
}
