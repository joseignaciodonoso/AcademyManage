"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Receipt, BarChart3, List } from "lucide-react"

export function ExpensesNavigation() {
  const pathname = usePathname()
  const params = useParams()
  const orgSlug = params?.orgSlug as string

  const navigation = [
    {
      name: "Lista de Gastos",
      href: `/${orgSlug}/club/expenses`,
      icon: List,
      description: "Ver y gestionar gastos"
    },
    {
      name: "Dashboard",
      href: `/${orgSlug}/club/expenses/dashboard`,
      icon: BarChart3,
      description: "KPIs y análisis"
    }
  ]

  return (
    <div className="border-b border-border bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Button
                key={item.name}
                asChild
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "h-12 px-4 rounded-none border-b-2 border-transparent",
                  isActive && "border-b-primary bg-background shadow-sm"
                )}
              >
                <Link href={item.href} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
