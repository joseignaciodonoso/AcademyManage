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
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <StudentSidebar hasActivePlan={hasActivePlan} hasPendingPayment={hasPendingPayment} />
      </div>

      {/* Main Column */}
      <div className="flex flex-col bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full filter blur-3xl" />
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-500/5 dark:bg-purple-500/10 rounded-full filter blur-3xl" />
        </div>

        {/* Header - Clean & Modern */}
        <header className="relative z-10 flex h-16 items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 lg:px-6 shadow-sm">
          <MobileStudentSidebar hasActivePlan={hasActivePlan} hasPendingPayment={hasPendingPayment} />

          {/* Portal Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
              <div className="h-5 w-5 rounded-full bg-white/30" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-tight">Portal del Estudiante</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mi Academia</p>
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-10 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
              >
                <Avatar className="h-8 w-8 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-200">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={session.user.name || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                    {session.user.name?.charAt(0) || session.user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                    {session.user.name || session.user.email.split('@')[0]}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Alumno</span>
                </div>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl">
              <DropdownMenuLabel className="text-slate-900 dark:text-white">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session.user.name || 'Usuario'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{session.user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
              <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">
                <Link href="/app/profile" className="flex items-center">
                  <User className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-200">Mi Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">
                <Link href="/app/settings" className="flex items-center">
                  <Settings className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-200">Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
              <SignOutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <div className="relative z-10 flex-1">
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 max-w-7xl w-full mx-auto text-slate-900 dark:text-white">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
