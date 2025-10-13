import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-simple"
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

  // Only require academyId for ACADEMY_ADMIN, not for SUPER_ADMIN
  if (session.user.role === "ACADEMY_ADMIN" && !session.user.academyId) {
    redirect("/admin/onboarding")
  }

  // Try to get academy name from branding
  let academyName = "Academia"
  try {
    const academyId = (session.user as any).academyId as string | undefined
    if (academyId) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/branding?academyId=${academyId}`, { cache: "no-store" })
      if (res.ok) {
        const branding = await res.json()
        if (branding?.name) academyName = branding.name as string
      }
    }
  } catch {}

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-gradient-to-r from-[hsl(var(--background))] via-[hsl(var(--muted))] to-[hsl(var(--background))] backdrop-blur-md px-4 lg:px-6 shadow-lg">
          <MobileAdminSidebar />

          {/* Academy Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] shadow-lg">
              <div className="h-6 w-6 rounded-full bg-white/20" />
            </div>
            <div className="flex flex-col">
              <HeaderAcademyName initialName={academyName} />
              <p className="text-xs text-slate-300 font-medium">Panel de Administración</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl hover:bg-slate-700 hover:shadow-md transition-all duration-200 text-slate-300 hover:text-white"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Buscar</span>
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9 rounded-xl hover:bg-slate-700 hover:shadow-md transition-all duration-200 text-slate-300 hover:text-white"
            >
              <Bell className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-slate-800 shadow-sm" />
              <span className="sr-only">Notificaciones</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 h-10 px-3 rounded-xl hover:bg-[hsl(var(--background))] hover:shadow-md transition-all duration-200 group"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-[hsl(var(--accent))] group-hover:ring-[hsl(var(--primary))] transition-all duration-200">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={session.user.name || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white text-sm font-semibold">
                      {session.user.name?.charAt(0) || session.user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))] leading-tight">
                      {session.user.name || session.user.email.split('@')[0]}
                    </span>
                    <span className="text-xs text-slate-300 leading-tight">
                      {session.user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-200 transition-colors duration-200" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-md border-slate-200/50 shadow-xl">
                <DropdownMenuLabel className="text-slate-700">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name || 'Usuario'}</p>
                    <p className="text-xs text-slate-500">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200/50" />
                <DropdownMenuItem asChild className="hover:bg-slate-50 focus:bg-slate-50">
                  <Link href="/admin/profile" className="flex items-center">
                    <User className="mr-3 h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-slate-50 focus:bg-slate-50">
                  <Link href="/admin/settings" className="flex items-center">
                    <Settings className="mr-3 h-4 w-4 text-slate-500" />
                    <span className="text-slate-700">Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200/50" />
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
