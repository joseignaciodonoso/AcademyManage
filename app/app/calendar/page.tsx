import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveMembership } from "@/lib/student-guards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function CalendarPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  if (session.user.role !== "STUDENT") redirect("/unauthorized")

  const membership = await getActiveMembership(session.user.id)
  if (!membership) redirect("/app/billing")

  // Fetch next 14 days of classes for read-only view
  const now = new Date()
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const classes = await prisma.class.findMany({
    where: {
      academyId: membership.academyId,
      status: "SCHEDULED",
      startTime: { gte: now, lte: twoWeeks },
    },
    orderBy: { startTime: "asc" },
    include: { branch: true },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
        <p className="text-muted-foreground">Próximas clases (solo lectura)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Próximas clases
          </CardTitle>
          <CardDescription>Las reservas y pagos se gestionan desde Pagos/Clases</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay clases próximas</div>
          ) : (
            <div className="space-y-3">
              {classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{c.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(c.startTime), "EEEE dd MMM, HH:mm", { locale: es })} - {format(new Date(c.endTime), "HH:mm", { locale: es })}
                      {c.branch?.name ? ` • ${c.branch.name}` : ""}
                    </div>
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
