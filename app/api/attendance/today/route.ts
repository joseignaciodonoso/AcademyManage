import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/attendance/today - Get today's active session for user
export async function GET(request: NextRequest) {
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

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Check if user is in a club (has training sessions)
    const academy = await prisma.academy.findUnique({
      where: { id: user.academyId },
      select: { type: true },
    })

    let activeSession = null

    if (academy?.type === "CLUB") {
      // Look for training session
      const trainingSession = await prisma.trainingSession.findFirst({
        where: {
          academyId: user.academyId,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        orderBy: {
          date: "asc",
        },
      })

      if (trainingSession) {
        activeSession = {
          id: trainingSession.id,
          name: `Entrenamiento - ${trainingSession.date.toLocaleDateString('es-CL')}`,
          type: "training",
          date: trainingSession.date,
        }
      }
    } else {
      // Look for enrolled class
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: user.id,
          status: "ENROLLED",
          class: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
        },
        include: {
          class: {
            include: {
              branch: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          class: {
            date: "asc",
          },
        },
      })

      if (enrollment) {
        activeSession = {
          id: enrollment.classId,
          name: `${enrollment.class.branch.name} - ${enrollment.class.startTime}`,
          type: "class",
          date: enrollment.class.date,
        }
      }
    }

    if (!activeSession) {
      return NextResponse.json(
        { message: "No active session for today" },
        { status: 200 }
      )
    }

    return NextResponse.json({ session: activeSession }, { status: 200 })
  } catch (error) {
    console.error("Error fetching today's session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
