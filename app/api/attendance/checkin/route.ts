import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"

const CheckInSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  classId: z.string().optional(),
  token: z.string().optional(),
})

// Generate a simple token for QR validation
function generateClassToken(classId: string, date: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "attendance-secret"
  return crypto.createHmac("sha256", secret).update(`${classId}:${date}`).digest("hex").slice(0, 16)
}

// POST /api/attendance/checkin - QR Check-in for academy classes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    // Validate
    const validatedData = CheckInSchema.parse(body)
    
    // New QR flow: classId + token from logged-in user
    if (validatedData.classId && validatedData.token && session?.user) {
      const today = new Date().toISOString().slice(0, 10)
      const expectedToken = generateClassToken(validatedData.classId, today)
      
      if (validatedData.token !== expectedToken) {
        return NextResponse.json({ error: "QR inválido o expirado" }, { status: 400 })
      }
      
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, academyId: true }
      })
      
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }
      
      const classSession = await prisma.class.findFirst({
        where: { id: validatedData.classId, academyId: user.academyId }
      })
      
      if (!classSession) {
        return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })
      }
      
      // Check if already checked in today
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const existing = await prisma.attendance.findFirst({
        where: {
          classId: validatedData.classId,
          userId: user.id,
          date: { gte: todayStart, lt: todayEnd }
        }
      })
      
      if (existing?.status === "PRESENT") {
        return NextResponse.json({ error: "Ya registraste tu asistencia para esta clase" }, { status: 400 })
      }
      
      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: "PRESENT", checkInTime: new Date() }
        })
      } else {
        await prisma.attendance.create({
          data: {
            classId: validatedData.classId,
            userId: user.id,
            academyId: user.academyId!,
            date: new Date(),
            checkInTime: new Date(),
            status: "PRESENT"
          }
        })
      }
      
      return NextResponse.json({
        message: "¡Asistencia registrada!",
        className: classSession.name || classSession.title || "Clase",
        userName: user.name
      })
    }
    
    // Legacy flow: userId + sessionId (for backwards compatibility)

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: {
        id: true,
        name: true,
        academyId: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Get class
    const classSession = await prisma.class.findFirst({
      where: {
        id: validatedData.sessionId,
        academyId: user.academyId,
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!classSession) {
      return NextResponse.json(
        { error: "Clase no encontrada" },
        { status: 404 }
      )
    }

    // Check if class is today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const classDate = new Date(classSession.date)
    classDate.setHours(0, 0, 0, 0)

    if (classDate.getTime() !== today.getTime()) {
      return NextResponse.json(
        { 
          error: "Esta clase no es para hoy",
          userName: user.name,
        },
        { status: 400 }
      )
    }

    // Check if user is enrolled in this class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        classId: validatedData.sessionId,
        userId: validatedData.userId,
        status: "ENROLLED",
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        {
          error: "No estás inscrito en esta clase",
          userName: user.name,
        },
        { status: 403 }
      )
    }

    // Check if already checked in
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        classId: validatedData.sessionId,
        userId: validatedData.userId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    })

    if (existingAttendance) {
      if (existingAttendance.status === "PRESENT") {
        return NextResponse.json(
          {
            error: "Ya registraste tu asistencia",
            userName: user.name,
            sessionName: `${classSession.branch.name} - ${classSession.startTime}`,
          },
          { status: 400 }
        )
      }

      // Update to PRESENT
      await prisma.attendance.update({
        where: {
          id: existingAttendance.id,
        },
        data: {
          status: "PRESENT",
        },
      })
    } else {
      // Create new attendance record
      await prisma.attendance.create({
        data: {
          classId: validatedData.sessionId,
          userId: validatedData.userId,
          academyId: user.academyId,
          date: new Date(),
          status: "PRESENT",
        },
      })
    }

    console.log(`✅ Check-in: ${user.name} - Class ${classSession.id}`)

    return NextResponse.json(
      {
        message: "¡Asistencia registrada!",
        userName: user.name,
        sessionName: `${classSession.branch.name} - ${classSession.startTime}`,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error in check-in:", error)
    return NextResponse.json(
      { error: "Error al registrar asistencia" },
      { status: 500 }
    )
  }
}
