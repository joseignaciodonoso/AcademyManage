import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function generateClassToken(classId: string, date: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "attendance-secret"
  return crypto.createHmac("sha256", secret).update(`${classId}:${date}`).digest("hex").slice(0, 16)
}

// GET /api/attendance/class-info - Get class info for QR check-in page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")
    const token = searchParams.get("token")

    if (!classId || !token) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    // Verify token
    const today = new Date().toISOString().slice(0, 10)
    const expectedToken = generateClassToken(classId, today)

    if (token !== expectedToken) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
    }

    const classSession = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        title: true,
        startTime: true,
        endTime: true,
        branch: {
          select: { name: true }
        }
      }
    })

    if (!classSession) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      class: {
        id: classSession.id,
        name: classSession.name || classSession.title || "Clase",
        startTime: classSession.startTime,
        endTime: classSession.endTime,
        branchName: classSession.branch?.name
      }
    })
  } catch (error) {
    console.error("Error fetching class info:", error)
    return NextResponse.json({ error: "Error al obtener información" }, { status: 500 })
  }
}
