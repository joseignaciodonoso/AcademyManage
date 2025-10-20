import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const weekday = searchParams.get("weekday") || undefined // MON..SUN
    const coachId = searchParams.get("coachId") || undefined

    // Resolve academy from session
    const academyId = (session.user as any).academyId || undefined
    if (!academyId) return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })

    const where: any = { academyId, active: true }
    if (weekday) where.weekday = weekday
    if (coachId) where.coachId = coachId

    const schedules = await prisma.classSchedule.findMany({
      where,
      orderBy: [{ weekday: "asc" }, { startTimeLocal: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        discipline: true,
        level: true,
        weekday: true,
        startTimeLocal: true,
        endTimeLocal: true,
        timezone: true,
        coach: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ schedules })
  } catch (e) {
    console.error("GET /api/schedules error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
