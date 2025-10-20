import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"
import bcrypt from "bcryptjs"

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!hasPermission(session.user.role, "students:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await _req.json().catch(() => null) as { password?: string }
    const password = body?.password?.trim()
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    // Ensure the user exists and belongs to same academy (unless super admin)
    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
    }
    if (session.user.role !== "SUPER_ADMIN" && user.academyId !== session.user.academyId) {
      return NextResponse.json({ error: "No permitido para esta academia" }, { status: 403 })
    }

    const hash = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { id: params.id }, data: { password: hash } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
