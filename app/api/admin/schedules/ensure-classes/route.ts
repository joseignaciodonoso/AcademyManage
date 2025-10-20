import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

function ymd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDays(d: Date, days: number) {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + days)
  return nd
}

const weekdayNum: Record<string, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 0,
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session?.user?.id || !requireAdmin(role) || !(session.user as any).academyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    const academyId = (session.user as any).academyId as string

    const body = await req.json().catch(() => ({}))
    const startDateStr: string | undefined = body?.startDate
    const endDateStr: string | undefined = body?.endDate

    const now = new Date()
    const firstDay = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = endDateStr
      ? new Date(endDateStr)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Fetch active schedules for academy
    const schedules = await prisma.classSchedule.findMany({
      where: {
        academyId,
        active: true,
        OR: [
          { startDate: null, endDate: null },
          {
            startDate: { lte: lastDay },
            OR: [{ endDate: null }, { endDate: { gte: firstDay } }],
          },
        ],
      },
    })

    // Ensure default branch exists
    const defaultBranch = await prisma.branch.findFirst({ where: { academyId, name: "Default" } })
    const branchId = defaultBranch
      ? defaultBranch.id
      : (
          await prisma.branch.create({ data: { academyId, name: "Default", address: "N/A" } })
        ).id

    let created = 0
    for (const sched of schedules) {
      // Iterate date range
      for (let d = new Date(firstDay); d <= lastDay; d = addDays(d, 1)) {
        if (d.getDay() !== weekdayNum[sched.weekday]) continue
        // Respect schedule's own date range
        if (sched.startDate && d < new Date(ymd(sched.startDate))) continue
        if (sched.endDate && d > new Date(ymd(sched.endDate))) continue

        const dateStr = ymd(d)
        const start = new Date(`${dateStr}T${sched.startTimeLocal}`)
        const end = new Date(`${dateStr}T${sched.endTimeLocal}`)

        try {
          await prisma.class.create({
            data: {
              academyId,
              branchId,
              coachId: sched.coachId,
              title: sched.title,
              description: sched.description ?? null,
              discipline: sched.discipline,
              level: sched.level,
              status: "SCHEDULED" as any,
              startTime: start,
              endTime: end,
              maxCapacity: 20,
              scheduleId: sched.id,
            },
          })
          created += 1
        } catch (e: any) {
          // Likely duplicate (unique [scheduleId, startTime]) → ignore
          continue
        }
      }
    }

    return NextResponse.json({ ok: true, created })
  } catch (e) {
    console.error("POST /api/admin/schedules/ensure-classes error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
