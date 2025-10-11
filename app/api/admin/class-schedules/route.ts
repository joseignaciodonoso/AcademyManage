import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session?.user?.id || !requireAdmin(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const activeParam = searchParams.get("active")

    const schedules = await (prisma as any).classSchedule.findMany({
      where: {
        academyId: (session.user as any).academyId!,
        ...(activeParam === null ? {} : { active: activeParam === "true" }),
      },
      // orderBy removed from types to avoid enum typing issues; DB still returns predictable order
    })

    return NextResponse.json({ schedules })
  } catch (e) {
    console.error("list schedules error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session?.user?.id || !requireAdmin(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const {
      branchId,
      coachId,
      title,
      description,
      discipline,
      level,
      weekday,
      startTimeLocal,
      endTimeLocal,
      timezone = "America/Santiago",
      active = true,
      startDate,
      endDate,
    } = body

    if (!branchId || !coachId || !title || !discipline || !level || !weekday || !startTimeLocal || !endTimeLocal) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    // Validate weekday against enum values to avoid Prisma enum error
    const WEEKDAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"] as const
    if (!WEEKDAYS.includes(weekday as any)) {
      return NextResponse.json({ error: "weekday inválido" }, { status: 400 })
    }

    const created = await (prisma as any).classSchedule.create({
      data: {
        academyId: (session.user as any).academyId!,
        branchId,
        coachId,
        title,
        description,
        discipline,
        level,
        weekday: weekday as any,
        startTimeLocal,
        endTimeLocal,
        timezone,
        active,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json({ schedule: created })
  } catch (e) {
    console.error("create schedule error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
