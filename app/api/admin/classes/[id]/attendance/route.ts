import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session?.user?.id || !requireAdmin(role) || !(session.user as any).academyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const classId = params.id
    const body = await req.json().catch(() => ({}))
    const email: string | undefined = body?.email
    if (!email) return NextResponse.json({ error: "email requerido" }, { status: 400 })

    // Load class
    const klass = await prisma.class.findUnique({ where: { id: classId } })
    if (!klass || klass.academyId !== (session.user as any).academyId) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })
    }

    const now = new Date()
    const start = new Date(klass.startTime)
    const end = new Date(klass.endTime)

    // Check window: 1h antes inicio, 1h después fin
    const windowStart = new Date(start.getTime() - 60 * 60 * 1000)
    const windowEnd = new Date(end.getTime() + 60 * 60 * 1000)
    if (now < windowStart || now > windowEnd) {
      return NextResponse.json({ error: "Fuera de ventana de check-in" }, { status: 422 })
    }

    // Resolve user by email
    const user = await prisma.user.findFirst({ where: { email } })
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    // Verify membership ACTIVE in same academy
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, academyId: (session.user as any).academyId, status: "ACTIVE" as any },
    })
    if (!membership) return NextResponse.json({ error: "Membresía no activa" }, { status: 422 })

    // Avoid duplicate attendance
    const existing = await prisma.attendance.findFirst({ where: { classId: klass.id, userId: user.id } })
    if (existing) return NextResponse.json({ ok: true, attendanceId: existing.id })

    const att = await prisma.attendance.create({
      data: {
        classId: klass.id,
        userId: user.id,
        status: "PRESENT" as any,
        checkedInAt: now,
      },
    })

    return NextResponse.json({ ok: true, attendanceId: att.id })
  } catch (e) {
    console.error("POST /api/admin/classes/[id]/attendance error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
