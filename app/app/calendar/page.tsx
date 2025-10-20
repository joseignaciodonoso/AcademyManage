import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveMembership } from "@/lib/student-guards"
import { StudentCalendarView } from "@/components/student/calendar/student-calendar-view"

export default async function CalendarPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  if (session.user.role !== "STUDENT") redirect("/unauthorized")

  const membership = await getActiveMembership(session.user.id)
  if (!membership) redirect("/app/billing")

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
