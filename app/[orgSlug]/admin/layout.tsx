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
import { prisma } from "@/lib/prisma"

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

  // Get academy data including type, logo, and branding
  const user = session?.user?.id ? await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { academy: true },
  }) : null

  const organizationType = user?.academy?.type as "ACADEMY" | "CLUB" | undefined
  const academyName = user?.academy?.name || "Organización"
  const logoUrl = user?.academy?.logoUrl || null
  const logoDarkUrl = user?.academy?.logoDarkUrl || null
  const faviconUrl = user?.academy?.faviconUrl || null
  const adminPanelTitle = (user?.academy as any)?.adminPanelTitle || "Panel de Administración"

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar 
            prefix={prefix} 
            className="w-64" 
            role={role} 
            organizationType={organizationType}
            academyName={academyName}
            logoUrl={logoUrl}
            logoDarkUrl={logoDarkUrl}
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-col min-w-0">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
            <MobileAdminSidebar 
              prefix={prefix} 
              role={role} 
              organizationType={organizationType}
              academyName={academyName}
              logoUrl={logoUrl}
              logoDarkUrl={logoDarkUrl}
            />

            {/* Title/Context with Logo */}
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-border">
                {faviconUrl ? (
                  <img src={faviconUrl} alt={academyName} className="h-6 w-6 object-contain" />
                ) : logoUrl ? (
                  <img src={logoUrl} alt={academyName} className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="text-lg font-bold text-primary">{academyName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-base sm:text-lg font-semibold leading-tight">{academyName}</h2>
                <p className="text-xs text-muted-foreground">{adminPanelTitle}</p>
              </div>
            </div>

            {/* Actions: notifications + user menu */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full" />
                <span className="sr-only">Notificaciones</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-10 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-avatar.jpg" alt="" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {(session?.user?.name || session?.user?.email || "A").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium leading-tight">
                        {session?.user?.name || session?.user?.email?.split('@')[0] || 'Admin'}
                      </span>
                      <span className="text-xs text-muted-foreground leading-tight">
                        {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session?.user?.name || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`${prefix}/admin/profile`} className="flex items-center">
                      <User className="mr-3 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`${prefix}/admin/settings`} className="flex items-center">
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
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
