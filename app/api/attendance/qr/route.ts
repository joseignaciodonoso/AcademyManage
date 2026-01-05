import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function generateClassToken(classId: string, date: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "attendance-secret"
  return crypto.createHmac("sha256", secret).update(`${classId}:${date}`).digest("hex").slice(0, 16)
}

// GET /api/attendance/qr?classId=xxx - Generate QR code URL for a class
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ACADEMY_ADMIN", "COACH", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")

    if (!classId) {
      return NextResponse.json({ error: "classId es requerido" }, { status: 400 })
    }

    const academyId = session.user.academyId

    // Verify class exists and belongs to academy
    const classSession = await prisma.class.findFirst({
      where: { 
        id: classId,
        ...(session.user.role !== "SUPER_ADMIN" ? { academyId } : {})
      },
      include: {
        academy: {
          select: { slug: true }
        }
      }
    })

    if (!classSession) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })
    }

    // Generate token for today
    const today = new Date().toISOString().slice(0, 10)
    const token = generateClassToken(classId, today)

    // Build checkin URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001"
    const orgSlug = classSession.academy.slug
    const checkinUrl = `${baseUrl}/${orgSlug}/app/checkin?classId=${classId}&token=${token}`

    return NextResponse.json({
      checkinUrl,
      classId,
      token,
      expiresAt: `${today}T23:59:59`,
      className: classSession.name || classSession.title
    })
  } catch (error) {
    console.error("Error generating QR:", error)
    return NextResponse.json({ error: "Error al generar QR" }, { status: 500 })
  }
}
