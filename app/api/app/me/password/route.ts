import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const MIN_LENGTH = 8
const STRONG_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { currentPassword, newPassword } = body || {}
    if (!currentPassword || !newPassword) return NextResponse.json({ error: "Campos requeridos" }, { status: 400 })
    if (String(newPassword).length < MIN_LENGTH || !STRONG_REGEX.test(String(newPassword))) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !user.password) return NextResponse.json({ error: "Usuario inválido" }, { status: 400 })

    const ok = await bcrypt.compare(String(currentPassword), user.password)
    if (!ok) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 })

    const hashed = await bcrypt.hash(String(newPassword), 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    try {
      await prisma.auditLog.create({
        data: {
          academyId: user.academyId || "unknown",
          userId: user.id,
          action: "UPDATE",
          resource: "users",
          resourceId: user.id,
          newValues: { selfPasswordChange: true, at: new Date().toISOString() },
        },
      })
    } catch {}

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 })
  }
}
