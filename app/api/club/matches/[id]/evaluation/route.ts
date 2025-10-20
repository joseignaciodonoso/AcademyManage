import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const EvaluationSchema = z.object({
  playerId: z.string(),
  technique: z.number().min(1).max(10),
  tactics: z.number().min(1).max(10),
  physical: z.number().min(1).max(10),
  attitude: z.number().min(1).max(10),
  comments: z.string().optional(),
})

const EvaluationsPayloadSchema = z.object({
  evaluations: z.array(EvaluationSchema),
})

// POST /api/club/matches/[id]/evaluation - Create evaluations
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

    // Only ADMIN and COACH can create evaluations
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify match belongs to academy
    const match = await prisma.match.findFirst({
      where: {
        id: params.id,
        academyId: user.academyId,
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // Validate
    const validatedData = EvaluationsPayloadSchema.parse(body)

    // Create evaluations in transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdEvaluations = await Promise.all(
        validatedData.evaluations.map(evaluation =>
          tx.playerEvaluation.create({
            data: {
              playerId: evaluation.playerId,
              matchId: params.id,
              evaluatorId: user.id,
              technique: evaluation.technique,
              tactics: evaluation.tactics,
              physical: evaluation.physical,
              attitude: evaluation.attitude,
              comments: evaluation.comments || "",
            },
          })
        )
      )

      return createdEvaluations
    })

    console.log(`✅ Created ${result.length} evaluations for match ${params.id}`)

    return NextResponse.json(
      { 
        message: "Evaluations created successfully",
        count: result.length,
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

    console.error("Error creating evaluations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/club/matches/[id]/evaluation - Get evaluations
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

    // Verify match belongs to academy
    const match = await prisma.match.findFirst({
      where: {
        id: params.id,
        academyId: user.academyId,
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      )
    }

    // Get evaluations
    const evaluations = await prisma.playerEvaluation.findMany({
      where: {
        matchId: params.id,
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ evaluations }, { status: 200 })
  } catch (error) {
    console.error("Error fetching evaluations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
