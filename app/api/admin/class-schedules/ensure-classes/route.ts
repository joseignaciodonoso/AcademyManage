import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

const weekdayMap: Record<number, string> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
}

function parseHm(hm: string) {
  const [h, m] = hm.split(":" ).map(Number)
  return { h: h || 0, m: m || 0 }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session?.user?.id || !requireAdmin(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // read start/end from query or body
    const { searchParams } = new URL(req.url)
    const qpStart = searchParams.get("startDate")
    const qpEnd = searchParams.get("endDate")
    const body = qpStart && qpEnd ? null : await req.json().catch(() => null)
    const startDate = qpStart ? new Date(qpStart) : body?.startDate ? new Date(body.startDate) : null
    const endDate = qpEnd ? new Date(qpEnd) : body?.endDate ? new Date(body.endDate) : null

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate y endDate son requeridos (ISO)" }, { status: 400 })
    }

    // fetch active schedules in academy, overlapping range
    const schedules = await prisma.classSchedule.findMany({
      where: {
        academyId: session.user.academyId!,
        active: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: endDate }, endDate: null },
          { startDate: null, endDate: { gte: startDate } },
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    })

    let created = 0

    for (const sch of schedules) {
      const iter = new Date(startDate)
      while (iter <= endDate) {
        const w = weekdayMap[iter.getDay()]
        if (w === sch.weekday && (!sch.startDate || iter >= new Date(sch.startDate)) && (!sch.endDate || iter <= new Date(sch.endDate))) {
          const { h: sh, m: sm } = parseHm(sch.startTimeLocal)
          const { h: eh, m: em } = parseHm(sch.endTimeLocal)
          const start = new Date(iter.getFullYear(), iter.getMonth(), iter.getDate(), sh, sm, 0, 0)
          const end = new Date(iter.getFullYear(), iter.getMonth(), iter.getDate(), eh, em, 0, 0)

          // avoid duplicates: check existing by scheduleId + startTime
          const exists = await prisma.class.findFirst({ where: { scheduleId: sch.id, startTime: start } })
          if (!exists) {
            await prisma.class.create({
              data: {
                academyId: session.user.academyId!,
                branchId: sch.branchId,
                coachId: sch.coachId,
                title: sch.title,
                description: sch.description ?? undefined,
                discipline: sch.discipline,
                level: sch.level,
                status: "SCHEDULED",
                startTime: start,
                endTime: end,
                maxCapacity: 20,
                scheduleId: sch.id,
              },
            })
            created += 1
          }
        }
        iter.setDate(iter.getDate() + 1)
      }
    }

    return NextResponse.json({ ok: true, created })
  } catch (e) {
    console.error("ensure-classes error", e)
    return NextResponse.json({ error: "Error generando clases" }, { status: 500 })
  }
}
