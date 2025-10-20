import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BulkAttendanceSchema } from "@/lib/validations/club"
import { z } from "zod"

// GET /api/club/training-sessions/[id]/attendance - Get attendance for session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.academyId) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 })
    }

    // Verify session belongs to academy
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: params.id,
        academyId: user.academyId,
      },
      include: {
        attendance: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
                playerProfile: true,
              },
            },
          },
        },
      },
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ attendance: trainingSession.attendance }, { status: 200 })
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/club/training-sessions/[id]/attendance - Mark attendance (bulk)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.academyId) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 })
    }

    // Only ADMIN and COACH can mark attendance
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify session belongs to academy
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: params.id,
        academyId: user.academyId,
      },
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // Validate
    const validatedData = BulkAttendanceSchema.parse(body)

    // Upsert attendance records
    const results = await Promise.all(
      validatedData.attendances.map(async (att) => {
        return prisma.trainingAttendance.upsert({
          where: {
            sessionId_playerId: {
              sessionId: params.id,
              playerId: att.playerId,
            },
          },
          update: {
            status: att.status,
            checkedInAt: att.status === "PRESENT" ? new Date() : null,
            notes: att.notes,
          },
          create: {
            sessionId: params.id,
            playerId: att.playerId,
            status: att.status,
            checkedInAt: att.status === "PRESENT" ? new Date() : null,
            notes: att.notes,
          },
        })
      })
    )

    console.log(`✅ Attendance marked for ${results.length} players in session ${params.id}`)

    return NextResponse.json(
      { 
        message: "Attendance marked successfully",
        count: results.length,
        attendance: results,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error marking attendance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/club/training-sessions/[id]/attendance/qr - QR check-in
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    // Verify session exists
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: params.id },
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    // Verify user belongs to same academy
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        academyId: trainingSession.academyId,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found or not in academy" },
        { status: 404 }
      )
    }

    // Mark attendance
    const attendance = await prisma.trainingAttendance.upsert({
      where: {
        sessionId_playerId: {
          sessionId: params.id,
          playerId: userId,
        },
      },
      update: {
        status: "PRESENT",
        checkedInAt: new Date(),
      },
      create: {
        sessionId: params.id,
        playerId: userId,
        status: "PRESENT",
        checkedInAt: new Date(),
      },
    })

    console.log(`✅ QR check-in: ${user.name} for session ${params.id}`)

    return NextResponse.json(
      { 
        message: "Check-in successful",
        playerName: user.name,
        attendance,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error QR check-in:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
