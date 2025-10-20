import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CreateTrainingSessionSchema } from "@/lib/validations/club"
import { z } from "zod"

// GET /api/club/training-sessions - List training sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { academy: true },
    })

    if (!user?.academyId) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 })
    }

    // Only ADMIN and COACH can view training sessions
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Query params
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const sessions = await prisma.trainingSession.findMany({
      where: {
        academyId: user.academyId,
        ...(from && to ? {
          date: {
            gte: new Date(from),
            lte: new Date(to),
          },
        } : {}),
      },
      include: {
        attendance: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json({ sessions }, { status: 200 })
  } catch (error) {
    console.error("Error fetching training sessions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/club/training-sessions - Create training session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { academy: true },
    })

    if (!user?.academyId) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 })
    }

    // Only ADMIN and COACH can create training sessions
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if academy is a CLUB
    if (user.academy?.type !== "CLUB") {
      return NextResponse.json(
        { error: "This feature is only available for clubs" },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate
    const validatedData = CreateTrainingSessionSchema.parse(body)

    // Create training session
    const trainingSession = await prisma.trainingSession.create({
      data: {
        academyId: user.academyId,
        date: new Date(validatedData.date),
        duration: validatedData.duration,
        location: validatedData.location,
        notes: validatedData.notes,
      },
    })

    console.log(`✅ Training session created: ${trainingSession.id}`)

    return NextResponse.json(
      { 
        message: "Training session created successfully",
        session: trainingSession,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating training session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
