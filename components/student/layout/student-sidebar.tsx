"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, User, CreditCard, Calendar, BookOpen, Trophy, Menu, GraduationCap } from "lucide-react"
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
}

function SidebarContent() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/app" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-6 w-6" />
          <span>Mi Academia</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-4">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-2", pathname === item.href && "bg-secondary")}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export function StudentSidebar({ className }: StudentSidebarProps) {
  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <SidebarContent />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileStudentSidebar() {
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
