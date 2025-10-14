import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const MIN_LENGTH = 8
const STRONG_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const role = session.user.role
    const isAdmin = role === "SUPER_ADMIN" || role === "ACADEMY_ADMIN"
    if (!isAdmin) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

    const { id } = params
    const body = await req.json().catch(() => ({}))
    const { newPassword } = body || {}
    if (!newPassword) return NextResponse.json({ error: "Nueva contraseña requerida" }, { status: 400 })
    if (String(newPassword).length < MIN_LENGTH || !STRONG_REGEX.test(String(newPassword))) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número." }, { status: 400 })
    }

    // Load target user
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })

    // Academy boundary: admin can only change password inside same academy unless SUPER_ADMIN
    if (role !== "SUPER_ADMIN") {
      if (!session.user.academyId || session.user.academyId !== user.academyId) {
        return NextResponse.json({ error: "No puedes modificar usuarios de otra academia" }, { status: 403 })
      }
    }

    const hashed = await bcrypt.hash(String(newPassword), 12)

    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          academyId: session.user.academyId || user.academyId || "unknown",
          userId: session.user.id,
          action: "UPDATE",
          resource: "users",
          resourceId: user.id,
          newValues: { passwordResetBy: session.user.id, at: new Date().toISOString() },
        },
      })
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al cambiar contraseña" }, { status: 500 })
  }
}
