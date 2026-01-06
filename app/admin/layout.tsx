import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AdminSidebar, MobileAdminSidebar } from "@/components/admin/layout/admin-sidebar"
import { HeaderAcademyName } from "@/components/admin/layout/header-academy-name"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Bell, Search, ChevronDown } from "lucide-react"
import Link from "next/link"
import { SignOutButton } from "@/components/auth/sign-out-button"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "ACADEMY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized")
  }

  // Get academy data including type, logo, favicon, and custom titles
  let academyName = "Academia"
  let organizationType: "ACADEMY" | "CLUB" = "ACADEMY"
  let logoUrl: string | null = null
  let logoDarkUrl: string | null = null
  let faviconUrl: string | null = null
  let adminPanelTitle = "Panel de Administración"
  try {
    const academyId = (session.user as any).academyId as string | undefined
    if (academyId) {
      const academy = await prisma.academy.findUnique({
        where: { id: academyId },
        select: { 
          name: true, 
          type: true, 
          logoUrl: true,
          logoDarkUrl: true,
          faviconUrl: true,
          adminPanelTitle: true 
        }
      })
      if (academy) {
        academyName = academy.name
        organizationType = academy.type as "ACADEMY" | "CLUB"
        logoUrl = academy.logoUrl
        logoDarkUrl = academy.logoDarkUrl
        faviconUrl = academy.faviconUrl
        adminPanelTitle = academy.adminPanelTitle || "Panel de Administración"
      }
    }
  } catch {}

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar 
          role={session.user.role} 
          organizationType={organizationType}
          academyName={academyName}
          logoUrl={logoUrl}
          logoDarkUrl={logoDarkUrl}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <MobileAdminSidebar 
            role={session.user.role} 
            organizationType={organizationType}
            academyName={academyName}
            logoUrl={logoUrl}
            logoDarkUrl={logoDarkUrl}
          />

          {/* Academy Info with Logo/Favicon */}
          <div className="flex items-center gap-3 flex-1">
            {/* Show favicon if available, otherwise logo, otherwise default icon */}
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-border">
              {faviconUrl ? (
                <img 
                  src={faviconUrl} 
                  alt={academyName} 
                  className="h-6 w-6 object-contain"
                />
              ) : logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={academyName} 
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <span className="text-lg font-bold text-primary">
                  {academyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <HeaderAcademyName initialName={academyName} />
              <p className="text-xs text-muted-foreground">{adminPanelTitle}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
              <span className="sr-only">Buscar</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full" />
              <span className="sr-only">Notificaciones</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-10 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={session.user.name || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {session.user.name?.charAt(0) || session.user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium leading-tight">
                      {session.user.name || session.user.email.split('@')[0]}
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {session.user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name || 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="flex items-center">
                    <User className="mr-3 h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
                    <Settings className="mr-3 h-4 w-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex flex-1 flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">{children}</main>
      </div>
    </div>
  )
}
