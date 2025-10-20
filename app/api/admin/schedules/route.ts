import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

async function ensureDefaultBranch(academyId: string) {
  // Satisfy schema without exposing branches in UI
  const existing = await prisma.branch.findFirst({ where: { academyId, name: "Default" } })
  if (existing) return existing
  return prisma.branch.create({ data: { academyId, name: "Default", address: "N/A" } })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !requireAdmin(role) || !(session.user as any).academyId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const active = searchParams.get("active")
  const coachId = searchParams.get("coachId") || undefined
  const weekday = searchParams.get("weekday") || undefined // MON..SUN

  const academyId = (session.user as any).academyId as string
  const where: any = { academyId }
  if (active != null) where.active = active === "true"
  if (coachId) where.coachId = coachId
  if (weekday) where.weekday = weekday

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
      active: true,
      startDate: true,
      endDate: true,
      coach: { select: { id: true, name: true, email: true } },
    },
  })
  return NextResponse.json({ schedules })
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
    const {
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
    } = body || {}

    if (!coachId || !title || !discipline || !level || !weekday || !startTimeLocal || !endTimeLocal) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    const defaultBranch = await ensureDefaultBranch(academyId)

    const created = await prisma.classSchedule.create({
      data: {
        academyId,
        branchId: defaultBranch.id,
        coachId,
        title,
        description,
        discipline,
        level,
        weekday,
        startTimeLocal,
        endTimeLocal,
        timezone,
        active: Boolean(active),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      select: { id: true },
    })

    return NextResponse.json({ id: created.id })
  } catch (e) {
    console.error("POST /api/admin/schedules error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
