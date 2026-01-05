import "server-only"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveMembership, getPendingMembership } from "@/lib/student-guards"
import { StudentCalendarView } from "@/components/student/calendar/student-calendar-view"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Lock, CreditCard } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  if (session.user.role !== "STUDENT") redirect("/unauthorized")

  const membership = await getActiveMembership(session.user.id)
  const pendingMembership = await getPendingMembership(session.user.id)
  
  // If no active membership but has pending, show locked state
  if (!membership && pendingMembership) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario de Clases</h1>
          <p className="text-muted-foreground">Visualiza las clases programadas</p>
        </div>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Calendario Bloqueado
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 max-w-md mb-4">
              Para ver el calendario de clases, necesitas completar el pago de tu membresía.
            </p>
            <Button asChild>
              <Link href="/app/subscribe?step=3">
                <CreditCard className="h-4 w-4 mr-2" />
                Completar Pago
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // No membership at all
  if (!membership) redirect("/app/subscribe")

  // Fetch next 30 days of classes
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const classes = await prisma.class.findMany({
    where: {
      academyId: membership.academyId,
      startTime: { gte: now, lte: thirtyDays },
    },
    orderBy: { startTime: "asc" },
    include: {
      branch: true,
      coach: {
        select: { name: true }
      }
    },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario de Clases</h1>
        <p className="text-muted-foreground">Visualiza las clases programadas</p>
      </div>

      <StudentCalendarView classes={classes} />
    </div>
  )
}
