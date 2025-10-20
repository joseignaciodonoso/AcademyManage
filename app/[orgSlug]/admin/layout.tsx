import type { ReactNode } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AdminSidebar, MobileAdminSidebar } from "@/components/admin/layout/admin-sidebar"
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
import { Bell, ChevronDown, Settings, User } from "lucide-react"
import Link from "next/link"
import { SignOutButton } from "@/components/auth/sign-out-button"

export default async function TenantAdminLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { orgSlug: string }
}) {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const prefix = `/${params.orgSlug}`

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar prefix={prefix} className="w-64" role={role} />
        </div>

        {/* Main Content */}
        <div className="flex flex-col">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 border-b border-border bg-gradient-to-r from-[hsl(var(--background))] via-[hsl(var(--muted))] to-[hsl(var(--background))] backdrop-blur-md px-4 lg:px-6 shadow-lg">
            <MobileAdminSidebar prefix={prefix} role={role} />

            {/* Title/Context */}
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] shadow-lg">
                <div className="h-6 w-6 rounded-full bg-white/20" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))] leading-tight">Panel de Administración</h2>
                <p className="text-xs text-slate-300 font-medium">Sección Administrador</p>
              </div>
            </div>

            {/* Actions: notifications + user menu */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9 rounded-xl hover:bg-slate-700 hover:shadow-md transition-all duration-200 text-slate-300 hover:text-white"
              >
                <Bell className="h-4 w-4" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-slate-800 shadow-sm" />
                <span className="sr-only">Notificaciones</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 h-10 px-3 rounded-xl hover:bg-[hsl(var(--background))] hover:shadow-md transition-all duration-200 group"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-[hsl(var(--accent))] group-hover:ring-[hsl(var(--primary))] transition-all duration-200">
                      <AvatarImage src="/placeholder-avatar.jpg" alt={""} />
                      <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white text-sm font-semibold">
                        {(role ?? "A").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-semibold text-[hsl(var(--foreground))] leading-tight">
                        Admin
                      </span>
                      <span className="text-xs text-slate-300 leading-tight">
                        {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-200 transition-colors duration-200" />
                    <span className="sr-only">Abrir menú de usuario</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-md border-slate-200/50 shadow-xl">
                  <DropdownMenuLabel className="text-slate-700">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Usuario</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-200/50" />
                  <DropdownMenuItem asChild className="hover:bg-slate-50 focus:bg-slate-50">
                    <Link href={`${prefix}/admin/profile`} className="flex items-center">
                      <User className="mr-3 h-4 w-4 text-slate-500" />
                      <span className="text-slate-700">Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-slate-50 focus:bg-slate-50">
                    <Link href={`${prefix}/admin/settings`} className="flex items-center">
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
