"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, User, CreditCard, Calendar, BookOpen, Trophy, Menu, GraduationCap, ChevronRight, AlertCircle } from "lucide-react"
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
  hasPendingPayment?: boolean
  prefix?: string // e.g., "/demoacademy" for tenantized routes
}

function SidebarContent({ hasActivePlan, hasPendingPayment, prefix }: { hasActivePlan?: boolean; hasPendingPayment?: boolean; prefix?: string }) {
  const pathname = usePathname()
  const pref = prefix ?? ""

  // Define base nav for active members (with confirmed payment)
  const fullNav = [
    { name: "Inicio", href: `${pref}/app`, icon: Home },
    { name: "Asistencia", href: `${pref}/app/attendance`, icon: GraduationCap },
    { name: "Mi Plan", href: `${pref}/app/plan`, icon: GraduationCap },
    { name: "Pagos", href: `${pref}/app/billing`, icon: CreditCard },
    { name: "Calendario", href: `${pref}/app/calendar`, icon: Calendar },
    { name: "Contenido", href: `${pref}/app/profile/content`, icon: BookOpen },
  ]

  // Limited nav for pending payment users
  const pendingNav = [
    { name: "Inicio", href: `${pref}/app`, icon: Home },
    { name: "Mi Plan", href: `${pref}/app/plan`, icon: GraduationCap },
    { name: "Completar Pago", href: `${pref}/app/subscribe?step=3`, icon: CreditCard },
    { name: "Pagos", href: `${pref}/app/billing`, icon: CreditCard },
  ]

  // Minimal nav for users without any membership
  const minimalNav = [
    { name: "Suscribirse", href: `${pref}/app/subscribe`, icon: CreditCard },
    { name: "Pagos", href: `${pref}/app/billing`, icon: CreditCard },
  ]

  const visibleNav = hasActivePlan ? fullNav : hasPendingPayment ? pendingNav : minimalNav

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Link href={`${pref}/app`} className="flex items-center gap-3 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-md">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold">Mi Portal</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 py-4 px-3">
          <div className="space-y-1">
            {visibleNav.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/") ||
                (pathname.startsWith(`${pref}/app/subscribe`) && item.href === `${pref}/app/billing`)
              return (
                <Link key={item.name} href={item.href} className="block">
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
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
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

export function StudentSidebar({ className, hasActivePlan, hasPendingPayment, prefix }: StudentSidebarProps) {
  return (
    <div className={cn("h-full", className)}>
      <SidebarContent hasActivePlan={hasActivePlan} hasPendingPayment={hasPendingPayment} prefix={prefix} />
    </div>
  )
}

export function MobileStudentSidebar({ hasActivePlan, hasPendingPayment, prefix }: { hasActivePlan?: boolean; hasPendingPayment?: boolean; prefix?: string }) {
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
        <SidebarContent hasActivePlan={hasActivePlan} hasPendingPayment={hasPendingPayment} prefix={prefix} />
      </SheetContent>
    </Sheet>
  )
}
