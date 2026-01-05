import "server-only"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, BookOpen, Calendar, Clock, CreditCard, Trophy, User, Users } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Suspense } from "react"
import { MetricsRefresh } from "@/components/dashboard/MetricsRefresh"
import { MetricsLoader } from "@/components/dashboard/MetricsLoader"
// Removed legacy SubscribeModal to avoid intrusive modal on dashboard

// Ensure this page is always rendered dynamically on the server so that
// requestAsyncStorage is available for getServerSession()
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
export const runtime = "nodejs"

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
        include: { plan: true },
        orderBy: { createdAt: "desc" },
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

  // Find active/trial membership first
  const activeMembership = user.memberships.find(m => m.status === "ACTIVE" || m.status === "TRIAL")
  
  // Find pending payment membership
  const pendingMembership = user.memberships.find(m => m.status === "PENDING_PAYMENT")

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

  // Get upcoming classes from database
  const upcomingClasses = await prisma.class.findMany({
    where: {
      academyId: (user as any).academyId,
      startTime: { gte: new Date() },
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
    include: {
      branch: true,
    },
    orderBy: { startTime: "asc" },
    take: 5,
  })

  const formatCurrency = (amount: number, currency = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Detectar si hay datos suficientes para mostrar métricas
  const hasMetricsData = Boolean(
    activeMembership || 
    user.attendances.length > 0 || 
    upcomingClasses.length > 0 ||
    user.enrollments.length > 0
  )

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      {/* Welcome Header with gradient */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-transparent rounded-2xl blur-3xl -z-10" />
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          ¡Hola, {user.name || "Estudiante"}!
        </h1>
        <p className="text-muted-foreground">Bienvenido a tu portal de entrenamiento</p>
      </div>

      {/* Pending Payment Alert */}
      {!activeMembership && pendingMembership && (
        <Card className="mb-8 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Pago Pendiente</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Tu membresía <strong>{pendingMembership.plan.name}</strong> está pendiente de pago. 
                  Completa el proceso para acceder a todas las funcionalidades.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button asChild size="sm">
                    <Link href="/app/subscribe?step=3">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Completar Pago
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/app/billing">Ver Estado</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembership ? activeMembership.plan.name : "Sin Plan"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeMembership
                ? formatCurrency(activeMembership.plan.price, activeMembership.plan.currency)
                : "Activa tu membresía"}
            </p>
            <Progress value={activeMembership ? 100 : 0} className="mt-4" />
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Trophy className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Últimos 30 días</p>
            <Progress value={attendanceRate} className="mt-4" />
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clases Este Mes</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.attendances.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {user.attendances.filter((a) => a.status === "PRESENT").length} asistidas
            </p>
            <Progress 
              value={user.attendances.length > 0 ? (user.attendances.filter((a) => a.status === "PRESENT").length / user.attendances.length) * 100 : 0} 
              className="mt-4" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.beltLevel || "Principiante"}</div>
            <p className="text-xs text-muted-foreground mt-1">{user.discipline || "Karate"}</p>
            <Progress value={75} className="mt-4" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Plan */}
        <Card className="border-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-500">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Mi Plan</CardTitle>
                <CardDescription>Estado actual de tu membresía</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeMembership ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{activeMembership.plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeMembership.plan.unlimitedClasses
                        ? "Clases ilimitadas"
                        : `${activeMembership.plan.classesPerMonth || 0} clases por mes`}
                    </p>
                  </div>
                  <Badge>Activo</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso del mes</span>
                    <span className="text-muted-foreground">
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
                    className="h-2"
                  />
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/app/plan">Ver Detalles</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/app/billing">Pagos</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No tienes un plan activo</p>
                <Button asChild>
                  <Link href="/app/subscribe">Activar Plan</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Próximas Clases</CardTitle>
                <CardDescription>Tus clases programadas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{classItem.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(classItem.startTime, "EEEE dd MMM, HH:mm", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">{classItem.branch.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Inscrito
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/app/calendar">Ver Todas las Clases</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No tienes clases programadas</p>
                <Button asChild>
                  <Link href="/app/calendar">Explorar Clases</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-green-500/20 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Tus últimas clases</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {user.attendances.length > 0 ? (
              <div className="space-y-3">
                {user.attendances.slice(0, 3).map((attendance) => (
                  <div key={attendance.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          attendance.status === "PRESENT" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                        }`}
                      >
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{attendance.class.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(attendance.createdAt), "dd MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={attendance.status === "PRESENT" ? "default" : "destructive"}>
                      {attendance.status === "PRESENT" ? "Asistió" : "Faltó"}
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/app/progress">Ver Progreso Completo</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No hay actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Tareas comunes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline">
                <Link href="/app/calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Reservar Clase
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app/curriculum" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Curriculum
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app/billing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagos
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Mi Perfil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Componente para refrescar métricas si es necesario */}
      <Suspense fallback={<MetricsLoader />}>
        <MetricsRefresh userId={user.id} hasData={hasMetricsData} />
      </Suspense>
    </div>
  )
}
