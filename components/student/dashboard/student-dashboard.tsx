"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  CreditCard, 
  Trophy, 
  BookOpen, 
  Clock,
  MapPin,
  ChevronRight,
  User
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Props = {
  user: {
    id: string
    name: string
    email: string
    beltLevel: string | null
    discipline: string | null
  }
  academy: {
    id: string
    name: string
    slug: string
  }
  membership: {
    id: string
    status: string
    plan: {
      id: string
      name: string
      price: number
      currency: string
      classesPerMonth: number | null
      unlimitedClasses: boolean | null
    }
    startDate: Date | null
    endDate: Date | null
  }
  attendances: Array<{
    id: string
    status: string
    createdAt: Date
    className: string
  }>
  upcomingClasses: Array<{
    id: string
    title: string
    startTime: Date
    branchName: string
  }>
  prefix: string
}

export function StudentDashboard({ 
  user, 
  academy, 
  membership, 
  attendances, 
  upcomingClasses,
  prefix 
}: Props) {
  const formatCurrency = (amount: number, currency = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const attendanceRate = attendances.length > 0
    ? (attendances.filter((a) => a.status === "PRESENT").length / attendances.length) * 100
    : 0

  const classesThisMonth = attendances.filter((a) => a.status === "PRESENT").length

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* Welcome Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))]/10 via-[hsl(var(--accent))]/5 to-transparent rounded-2xl blur-xl -z-10" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ¡Hola, {user.name}!
            </h1>
            <p className="text-[hsl(var(--foreground))]/60">
              Bienvenido a tu portal de {academy.name}
            </p>
          </div>
          <Badge className="w-fit bg-green-500/10 text-green-500 border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Plan Activo
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[hsl(var(--primary))]/20 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi Plan</CardTitle>
            <div className="p-2 rounded-lg bg-[hsl(var(--primary))]/10">
              <CreditCard className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{membership.plan.name}</div>
            <p className="text-xs text-[hsl(var(--foreground))]/60 mt-1">
              {formatCurrency(membership.plan.price, membership.plan.currency)}/mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Trophy className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{attendanceRate.toFixed(0)}%</div>
            <p className="text-xs text-[hsl(var(--foreground))]/60 mt-1">Últimos 30 días</p>
            <Progress value={attendanceRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clases Este Mes</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {classesThisMonth}
              {!membership.plan.unlimitedClasses && membership.plan.classesPerMonth && (
                <span className="text-sm font-normal text-[hsl(var(--foreground))]/60">
                  /{membership.plan.classesPerMonth}
                </span>
              )}
            </div>
            <p className="text-xs text-[hsl(var(--foreground))]/60 mt-1">
              {membership.plan.unlimitedClasses ? "Ilimitadas" : "Clases disponibles"}
            </p>
            {!membership.plan.unlimitedClasses && membership.plan.classesPerMonth && (
              <Progress 
                value={(classesThisMonth / membership.plan.classesPerMonth) * 100} 
                className="mt-2 h-1.5" 
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <User className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{user.beltLevel || "Principiante"}</div>
            <p className="text-xs text-[hsl(var(--foreground))]/60 mt-1">
              {user.discipline || "Sin disciplina"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Próximas Clases</CardTitle>
                  <CardDescription>Clases programadas</CardDescription>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`${prefix}/app/calendar`}>
                  Ver todas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.map((classItem) => (
                  <div 
                    key={classItem.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-[hsl(var(--muted))]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{classItem.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-[hsl(var(--foreground))]/60">
                          <Clock className="h-3 w-3" />
                          {format(new Date(classItem.startTime), "EEEE dd MMM, HH:mm", { locale: es })}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[hsl(var(--foreground))]/60">
                          <MapPin className="h-3 w-3" />
                          {classItem.branchName}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Inscrito
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 rounded-full bg-[hsl(var(--muted))]/50 w-fit mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-[hsl(var(--foreground))]/40" />
                </div>
                <p className="text-sm text-[hsl(var(--foreground))]/60 mb-3">
                  No tienes clases programadas
                </p>
                <Button asChild size="sm">
                  <Link href={`${prefix}/app/calendar`}>Explorar Clases</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>Tus últimas clases</CardDescription>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`${prefix}/app/attendance`}>
                  Ver todo
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {attendances.length > 0 ? (
              <div className="space-y-3">
                {attendances.slice(0, 5).map((attendance) => (
                  <div 
                    key={attendance.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        attendance.status === "PRESENT" 
                          ? "bg-green-500/10" 
                          : "bg-red-500/10"
                      }`}>
                        <Trophy className={`h-4 w-4 ${
                          attendance.status === "PRESENT" 
                            ? "text-green-500" 
                            : "text-red-500"
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{attendance.className}</h4>
                        <p className="text-xs text-[hsl(var(--foreground))]/60">
                          {format(new Date(attendance.createdAt), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={attendance.status === "PRESENT" ? "default" : "destructive"}>
                      {attendance.status === "PRESENT" ? "Asistió" : "Faltó"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 rounded-full bg-[hsl(var(--muted))]/50 w-fit mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-[hsl(var(--foreground))]/40" />
                </div>
                <p className="text-sm text-[hsl(var(--foreground))]/60">
                  No hay actividad reciente
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Accede rápidamente a las funciones más usadas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href={`${prefix}/app/calendar`}>
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Reservar Clase</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href={`${prefix}/app/curriculum`}>
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm">Curriculum</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href={`${prefix}/app/billing`}>
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm">Mis Pagos</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <Link href={`${prefix}/app/profile`}>
                  <User className="h-5 w-5" />
                  <span className="text-sm">Mi Perfil</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
