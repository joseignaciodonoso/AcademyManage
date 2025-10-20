import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session?.user?.id || !requireAdmin(role) || !(session.user as any).academyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    const academyId = (session.user as any).academyId as string
    const id = params.id

    const body = await req.json().catch(() => ({}))
    const data: any = {}
    const allowed = [
      "coachId",
      "title",
      "description",
      "discipline",
      "level",
      "weekday",
      "startTimeLocal",
      "endTimeLocal",
      "timezone",
      "active",
      "startDate",
      "endDate",
    ]
    for (const k of allowed) if (k in body) data[k] = body[k]
    if ("startDate" in data) data.startDate = data.startDate ? new Date(data.startDate) : null
    if ("endDate" in data) data.endDate = data.endDate ? new Date(data.endDate) : null

    const updated = await prisma.classSchedule.update({
      where: { id },
      data,
      select: { id: true },
    })

    // Ensure schedule belongs to academy
    const owned = await prisma.classSchedule.findUnique({ where: { id } })
    if (!owned || owned.academyId !== academyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    return NextResponse.json({ id: updated.id })
  } catch (e) {
    console.error("PATCH /api/admin/schedules/[id] error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session?.user?.id || !requireAdmin(role) || !(session.user as any).academyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    const academyId = (session.user as any).academyId as string

    const sched = await prisma.classSchedule.findUnique({ where: { id: params.id } })
    if (!sched || sched.academyId !== academyId) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 })
    }

    await prisma.classSchedule.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/admin/schedules/[id] error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
