import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveMembership } from "@/lib/student-guards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckInButton } from "@/components/student/attendance/check-in-button"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function AttendancePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  if (session.user.role !== "STUDENT") redirect("/unauthorized")

  const membership = await getActiveMembership(session.user.id)
  if (!membership) {
    // Sin plan activo: solo acceso a pagos
    redirect("/app/billing")
  }

  // Próximas clases de las próximas 24h para la academia del alumno
  const now = new Date()
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const classes = await prisma.class.findMany({
    where: {
      academyId: membership.academyId,
      status: "SCHEDULED",
      startTime: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
      endTime: { lte: nextDay },
    },
    orderBy: { startTime: "asc" },
    include: { branch: true },
    take: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asistencia</h1>
        <p className="text-gray-400">Registra tu asistencia a clases programadas</p>
      </div>

      <Card className="glass-effect rounded-2xl border-gray-700/50">
        <CardHeader>
          <CardTitle>Próximas clases (24h)</CardTitle>
          <CardDescription>
            Puedes registrar asistencia desde 1 hora antes del inicio y hasta 1 hora después del término
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay clases próximas</div>
          ) : (
            <div className="space-y-3">
              {classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-700/50 bg-white/5 backdrop-blur">
                  <div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(c.startTime), "EEEE dd MMM, HH:mm", { locale: es })}
                      {" "}- {format(new Date(c.endTime), "HH:mm", { locale: es })} • {c.branch?.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.level}</Badge>
                    <CheckInButton classId={c.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
