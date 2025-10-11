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
    if (!session?.user?.id || !requireAdmin(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const id = params.id
    const body = await req.json()
    const payload: any = {}

    for (const k of [
      "branchId",
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
    ]) {
      if (k in body) (payload as any)[k] = body[k]
    }

    if ("startDate" in body) payload.startDate = body.startDate ? new Date(body.startDate) : null
    if ("endDate" in body) payload.endDate = body.endDate ? new Date(body.endDate) : null

    const updated = await prisma.classSchedule.update({
      where: { id },
      data: payload,
    })

    return NextResponse.json({ schedule: updated })
  } catch (e) {
    console.error("update schedule error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session?.user?.id || !requireAdmin(role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const id = params.id
    await prisma.classSchedule.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("delete schedule error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
