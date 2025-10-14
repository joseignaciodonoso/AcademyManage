import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    requirePermission(session.user.role as any, "attendance:read")

    const items = await prisma.attendance.findMany({
      where: { userId: session.user.id },
      include: { class: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ attendances: items })
  } catch (e) {
    return NextResponse.json({ error: "Error al obtener asistencias" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    requirePermission(session.user.role as any, "attendance:write")

    const { classId } = await request.json()
    if (!classId) return NextResponse.json({ error: "classId requerido" }, { status: 400 })

    // Validate class exists
    const cls = await prisma.class.findUnique({ where: { id: classId } })
    if (!cls) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })

    // Ensure user has active membership in same academy
    const now = new Date()
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        academyId: cls.academyId,
        status: "ACTIVE",
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
    })
    if (!membership) return NextResponse.json({ error: "Debes tener un plan activo" }, { status: 403 })

    // Check time window: 1h before start to 1h after end
    const startWindow = new Date(cls.startTime.getTime() - 60 * 60 * 1000)
    const endWindow = new Date(cls.endTime.getTime() + 60 * 60 * 1000)
    if (now < startWindow || now > endWindow) {
      return NextResponse.json({ error: "Fuera de ventana de registro" }, { status: 400 })
    }

    // Avoid duplicate attendance for same class/user
    const existing = await prisma.attendance.findFirst({ where: { classId, userId: session.user.id } })
    if (existing) return NextResponse.json({ error: "Asistencia ya registrada" }, { status: 409 })

    const att = await prisma.attendance.create({
      data: {
        classId,
        userId: session.user.id,
        status: "PRESENT",
        checkedInAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true, attendanceId: att.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al registrar asistencia" }, { status: 500 })
  }
}
