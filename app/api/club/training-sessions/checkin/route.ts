import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CheckInSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
})

// POST /api/club/training-sessions/checkin - QR Check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate
    const validatedData = CheckInSchema.parse(body)

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

    // Get training session
    const session = await prisma.trainingSession.findFirst({
      where: {
        id: validatedData.sessionId,
        academyId: user.academyId,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: "Sesión de entrenamiento no encontrada" },
        { status: 404 }
      )
    }

    // Check if session is today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sessionDate = new Date(session.date)
    sessionDate.setHours(0, 0, 0, 0)

    if (sessionDate.getTime() !== today.getTime()) {
      return NextResponse.json(
        { 
          error: "Esta sesión no es para hoy",
          userName: user.name,
        },
        { status: 400 }
      )
    }

    // Check if already checked in
    const existingAttendance = await prisma.trainingAttendance.findUnique({
      where: {
        sessionId_playerId: {
          sessionId: validatedData.sessionId,
          playerId: validatedData.userId,
        },
      },
    })

    if (existingAttendance) {
      if (existingAttendance.status === "PRESENT") {
        return NextResponse.json(
          {
            error: "Ya registraste tu asistencia",
            userName: user.name,
            sessionName: `Entrenamiento - ${session.date.toLocaleDateString('es-CL')}`,
          },
          { status: 400 }
        )
      }

      // Update to PRESENT
      await prisma.trainingAttendance.update({
        where: {
          sessionId_playerId: {
            sessionId: validatedData.sessionId,
            playerId: validatedData.userId,
          },
        },
        data: {
          status: "PRESENT",
          checkedInAt: new Date(),
        },
      })
    } else {
      // Create new attendance record
      await prisma.trainingAttendance.create({
        data: {
          sessionId: validatedData.sessionId,
          playerId: validatedData.userId,
          status: "PRESENT",
          checkedInAt: new Date(),
        },
      })
    }

    console.log(`✅ Check-in: ${user.name} - Training ${session.id}`)

    return NextResponse.json(
      {
        message: "¡Asistencia registrada!",
        userName: user.name,
        sessionName: `Entrenamiento - ${session.date.toLocaleDateString('es-CL')}`,
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
