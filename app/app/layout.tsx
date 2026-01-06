import "server-only"
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getActiveMembership, getPendingMembership } from "@/lib/student-guards"
import { StudentSidebar, MobileStudentSidebar } from "@/components/student/layout/student-sidebar"
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
import { ThemeToggle } from "@/components/theme-toggle"

// Force dynamic server rendering for pages under /app/app so that
// requestAsyncStorage is available to getServerSession calls in children
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
export const runtime = "nodejs"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "STUDENT") {
    redirect("/unauthorized")
  }

  const membership = await getActiveMembership(session.user.id)
  const pendingMembership = await getPendingMembership(session.user.id)
  const hasActivePlan = Boolean(membership)
  const hasPendingPayment = Boolean(pendingMembership)

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="hidden md:block bg-sidebar border-r border-border">
        <StudentSidebar hasActivePlan={hasActivePlan} hasPendingPayment={hasPendingPayment} />
      </div>

      {/* Main Column */}
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <MobileStudentSidebar hasActivePlan={hasActivePlan} hasPendingPayment={hasPendingPayment} />

          {/* Portal Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex flex-col">
              <h2 className="text-base font-semibold leading-tight">Portal del Estudiante</h2>
              <p className="text-xs text-muted-foreground">Mi Academia</p>
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

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
                  <span className="text-xs text-muted-foreground leading-tight">Alumno</span>
                </div>
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
                <Link href="/app/profile" className="flex items-center">
                  <User className="mr-3 h-4 w-4" />
                  Mi Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/settings" className="flex items-center">
                  <Settings className="mr-3 h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SignOutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
