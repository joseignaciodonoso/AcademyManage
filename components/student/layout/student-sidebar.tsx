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
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 px-6">
        <Link href={`${pref}/app`} className="flex items-center gap-3 font-bold group transition-all duration-200 hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 transition-all duration-200">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg text-slate-900 dark:text-white">Mi Portal</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 py-6 px-4">
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
                      "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive && <ChevronRight className="h-4 w-4 text-blue-500" />}
                    {isActive && (
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" />
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
