import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, Clock, CreditCard, Trophy, User, Users } from "lucide-react"
import Link from "next/link"
import { format, addDays } from "date-fns"
import { es } from "date-fns/locale"
// Removed legacy SubscribeModal to avoid intrusive modal on dashboard

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "STUDENT") {
    redirect("/unauthorized")
  }

  // Get user data with membership and recent activity
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { status: { in: ["ACTIVE", "TRIAL"] } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      enrollments: {
        include: {
          class: {
            include: { branch: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      attendances: {
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        include: { class: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  const activeMembership = user.memberships[0]

  // Load available plans for modal if user has no membership
  const hasAcademy = Boolean((user as any).academyId)
  const availablePlans = !activeMembership && hasAcademy
    ? await prisma.plan.findMany({
        where: { academyId: (user as any).academyId, status: "ACTIVE" },
        orderBy: { price: "asc" },
        take: 12,
      })
    : []
  const recentClasses = user.enrollments
  const attendanceRate =
    user.attendances.length > 0
      ? (user.attendances.filter((a) => a.status === "PRESENT").length / user.attendances.length) * 100
      : 0

  // Mock upcoming classes (in a real app, this would be fetched from the database)
  const upcomingClasses = [
    {
      id: "1",
      title: "Karate Básico",
      startTime: addDays(new Date(), 1),
      branch: { name: "Sede Principal" },
    },
    {
      id: "2",
      title: "Sparring Avanzado",
      startTime: addDays(new Date(), 3),
      branch: { name: "Sede Norte" },
    },
  ]

  const formatCurrency = (amount: number, currency = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Removed intrusive subscribe modal */}
      
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">¡Hola, {user.name || "Estudiante"}!</h1>
        <p className="text-slate-300 text-lg">Bienvenido a tu portal de entrenamiento</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
            <CardTitle className="text-sm font-medium text-white/90">Plan Actual</CardTitle>
            <CreditCard className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{activeMembership ? activeMembership.plan.name : "Sin Plan"}</div>
            <p className="text-xs text-gray-400 mt-1">
              {activeMembership
                ? formatCurrency(activeMembership.plan.price, activeMembership.plan.currency)
                : "Activa tu membresía"}
            </p>
            <Progress value={activeMembership ? 100 : 0} className="mt-4 h-2 bg-gray-700/50" />
          </CardContent>
        </Card>

        <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-green-500 to-emerald-600 p-4">
            <CardTitle className="text-sm font-medium text-white/90">Asistencia</CardTitle>
            <Trophy className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{attendanceRate.toFixed(0)}%</div>
            <p className="text-xs text-gray-400 mt-1">Últimos 30 días</p>
            <Progress value={attendanceRate} className="mt-4 h-2 bg-gray-700/50" />
          </CardContent>
        </Card>

        <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-amber-500 to-orange-600 p-4">
            <CardTitle className="text-sm font-medium text-white/90">Clases Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{user.attendances.length}</div>
            <p className="text-xs text-gray-400 mt-1">
              {user.attendances.filter((a) => a.status === "PRESENT").length} asistidas
            </p>
            <Progress 
              value={user.attendances.length > 0 ? (user.attendances.filter((a) => a.status === "PRESENT").length / user.attendances.length) * 100 : 0} 
              className="mt-4 h-2 bg-gray-700/50" 
            />
          </CardContent>
        </Card>

        <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-purple-500 to-pink-600 p-4">
            <CardTitle className="text-sm font-medium text-white/90">Nivel</CardTitle>
            <Users className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{user.beltLevel || "Principiante"}</div>
            <p className="text-xs text-gray-400 mt-1">{user.discipline || "Karate"}</p>
            <Progress value={75} className="mt-4 h-2 bg-gray-700/50" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Plan */}
        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Mi Plan</CardTitle>
            <CardDescription className="text-gray-400">Estado actual de tu membresía</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeMembership ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{activeMembership.plan.name}</h3>
                    <p className="text-sm text-gray-400">
                      {activeMembership.plan.unlimitedClasses
                        ? "Clases ilimitadas"
                        : `${activeMembership.plan.classesPerMonth || 0} clases por mes`}
                    </p>
                  </div>
                  <Badge className="bg-green-600/80 text-white hover:bg-green-700/80">Activo</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Progreso del mes</span>
                    <span className="text-gray-300">
                      {Math.min(user.attendances.length, activeMembership.plan.classesPerMonth || 999)} /{" "}
                      {activeMembership.plan.classesPerMonth || "∞"}
                    </span>
                  </div>
                  <Progress
                    value={
                      activeMembership.plan.unlimitedClasses
                        ? 100
                        : Math.min((user.attendances.length / (activeMembership.plan.classesPerMonth || 1)) * 100, 100)
                    }
                    className="h-2 bg-gray-700/50"
                  />
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/70 hover:border-indigo-500/50 transition-colors">
                    <Link href="/app/plan">Ver Detalles</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/70 hover:border-indigo-500/50 transition-colors">
                    <Link href="/app/billing">Pagos</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">No tienes un plan activo</p>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:scale-105">
                  <Link href="/app/subscribe">Activar Plan</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Próximas Clases</CardTitle>
            <CardDescription className="text-gray-400">Tus clases programadas</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-3 border border-gray-700/50 rounded-lg bg-gray-800/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{classItem.title}</h4>
                        <p className="text-sm text-gray-400">
                          {format(classItem.startTime, "EEEE dd MMM, HH:mm", { locale: es })}
                        </p>
                        <p className="text-xs text-gray-500">{classItem.branch.name}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                      <Clock className="h-3 w-3 mr-1" />
                      Inscrito
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/70 hover:border-indigo-500/50 transition-colors">
                  <Link href="/app/calendar">Ver Todas las Clases</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">No tienes clases programadas</p>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:scale-105">
                  <Link href="/app/calendar">Explorar Clases</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Actividad Reciente</CardTitle>
            <CardDescription className="text-gray-400">Tus últimas clases</CardDescription>
          </CardHeader>
          <CardContent>
            {user.attendances.length > 0 ? (
              <div className="space-y-3">
                {user.attendances.slice(0, 3).map((attendance) => (
                  <div key={attendance.id} className="flex items-center justify-between p-3 border border-gray-700/50 rounded-lg bg-gray-800/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          attendance.status === "PRESENT" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                        }`}
                      >
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{attendance.class.title}</h4>
                        <p className="text-sm text-gray-400">
                          {format(new Date(attendance.createdAt), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <Badge className={attendance.status === "PRESENT" ? "bg-green-600/80 text-white" : "bg-red-600/80 text-white"}>
                      {attendance.status === "PRESENT" ? "Asistió" : "Faltó"}
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/70 hover:border-indigo-500/50 transition-colors">
                  <Link href="/app/progress">Ver Progreso Completo</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400">No hay actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Acciones Rápidas</CardTitle>
            <CardDescription className="text-gray-400">Tareas comunes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/70 hover:border-indigo-500/50 transition-colors">
                <Link href="/app/calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Reservar Clase
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/70 hover:border-indigo-500/50 transition-colors">
                <Link href="/app/curriculum" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Curriculum
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/70 hover:border-indigo-500/50 transition-colors">
                <Link href="/app/billing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagos
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/70 hover:border-indigo-500/50 transition-colors">
                <Link href="/app/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Mi Perfil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      </div>
    </div>
  )
}
