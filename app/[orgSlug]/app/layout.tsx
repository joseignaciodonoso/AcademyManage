import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getActiveMembership } from "@/lib/student-guards"
import { StudentSidebar, MobileStudentSidebar } from "@/components/student/layout/student-sidebar"
import { StudentGuard } from "@/components/student/layout/student-guard"
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
import { LogOut, User, Settings } from "lucide-react"
import Link from "next/link"
import { SignOutButton } from "@/components/auth/sign-out-button"

export default async function TenantStudentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgSlug: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "STUDENT") {
    redirect("/unauthorized")
  }

  const membership = await getActiveMembership(session.user.id)
  const hasActivePlan = Boolean(membership)
  const prefix = `/${params.orgSlug}`

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="hidden md:block bg-[hsl(var(--background))] border-r border-border">
        <StudentSidebar hasActivePlan={hasActivePlan} prefix={prefix} />
      </div>

      {/* Main Column */}
      <div className="flex flex-col bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(var(--muted))]/20 to-[hsl(var(--background))] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 gradient-bg opacity-20" />
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-[hsl(var(--accent))] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-[hsl(var(--primary))] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[hsl(var(--secondary))] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
        </div>

        {/* Header */}
        <header className="relative z-10 flex h-16 items-center gap-4 border-b border-border bg-gradient-to-r from-[hsl(var(--background))] via-[hsl(var(--muted))] to-[hsl(var(--background))] backdrop-blur-md px-4 lg:px-6 shadow-lg">
          <MobileStudentSidebar hasActivePlan={hasActivePlan} prefix={prefix} />

          {/* Portal Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] shadow-lg">
              <div className="h-6 w-6 rounded-full bg-white/20" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))] leading-tight">Portal del Estudiante</h2>
              <p className="text-xs text-slate-300 font-medium">Mi Academia</p>
            </div>
          </div>

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
                  <span className="text-xs text-slate-300 leading-tight">Alumno</span>
                </div>
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
                <Link href={`${prefix}/app/profile`} className="flex items-center">
                  <User className="mr-3 h-4 w-4 text-slate-500" />
                  <span className="text-slate-700">Mi Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-slate-50 focus:bg-slate-50">
                <Link href={`${prefix}/app/settings`} className="flex items-center">
                  <Settings className="mr-3 h-4 w-4 text-slate-500" />
                  <span className="text-slate-700">Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200/50" />
              <SignOutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content wrapper */}
        <div className="relative z-10 flex-1">
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-w-7xl w-full mx-auto bg-transparent text-[hsl(var(--foreground))]">
            <StudentGuard hasActivePlan={hasActivePlan}>
              {children}
            </StudentGuard>
          </main>
        </div>
      </div>
    </div>
  )
}
