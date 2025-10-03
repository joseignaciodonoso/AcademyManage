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
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-slate-700/50 px-6 bg-slate-900/50 backdrop-blur-sm">
        <Link href="/admin/dashboard" className="flex items-center gap-3 font-bold text-white group transition-all duration-200 hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg group-hover:shadow-blue-500/25 transition-all duration-200">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Academia Admin</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 py-6 px-4">
          {/* Main Navigation */}
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href} className="block">
                  <div
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 overflow-hidden isolate",
                      isActive
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg shadow-blue-500/10 border border-blue-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg" 
                        : "bg-slate-700/50 text-slate-400 group-hover:bg-slate-600 group-hover:text-white"
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-blue-400" />
                    )}
                    {isActive && (
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" />
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
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configuración</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
              </div>
            </div>
            <div className="space-y-2">
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href} className="block">
                    <div
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 overflow-hidden isolate",
                        isActive
                          ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white shadow-lg shadow-emerald-500/10 border border-emerald-500/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg" 
                          : "bg-slate-700/50 text-slate-400 group-hover:bg-slate-600 group-hover:text-white"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1">{item.name}</span>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-emerald-400" />
                      )}
                      {isActive && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-r-full" />
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
