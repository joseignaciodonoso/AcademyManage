import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

// GET /api/admin/students/[id]/attendance - Get student attendance history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!hasPermission(session.user.role, "attendance:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const studentId = params.id
    const userAcademyId = (session.user as any).academyId

    // Verify student exists
    const student = await prisma.user.findFirst({
      where: { 
        id: studentId,
        role: "STUDENT",
        ...(session.user.role !== "SUPER_ADMIN" ? { academyId: userAcademyId } : {})
      },
      select: { id: true }
    })

    if (!student) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
    }

    // Get attendance records
    const attendance = await prisma.attendance.findMany({
      where: { userId: studentId },
      orderBy: { date: "desc" },
      take: 100,
      include: {
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      attendance: attendance.map(a => ({
        id: a.id,
        date: a.date.toISOString(),
        checkInTime: a.checkInTime?.toISOString() || null,
        status: a.status,
        className: a.class?.name || null
      }))
    })
  } catch (error: any) {
    console.error("Error fetching student attendance:", error)
    return NextResponse.json({ error: "Error al obtener asistencia" }, { status: 500 })
  }
}
