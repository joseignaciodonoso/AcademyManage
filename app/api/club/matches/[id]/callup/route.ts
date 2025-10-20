import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CreateCallupSchema } from "@/lib/validations/club"
import { z } from "zod"

// POST /api/club/matches/[id]/callup - Create/Update callup
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

    // Only ADMIN and COACH can create callups
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
    const validatedData = CreateCallupSchema.parse(body)

    // Create or update callup in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if callup already exists
      const existingCallup = await tx.matchCallup.findUnique({
        where: { matchId: params.id },
        include: { players: true },
      })

      let callup
      
      if (existingCallup) {
        // Delete existing players
        await tx.matchCallupPlayer.deleteMany({
          where: { callupId: existingCallup.id },
        })

        // Update callup
        callup = await tx.matchCallup.update({
          where: { id: existingCallup.id },
          data: {
            formation: validatedData.formation,
            publishedAt: new Date(),
          },
        })
      } else {
        // Create new callup
        callup = await tx.matchCallup.create({
          data: {
            matchId: params.id,
            formation: validatedData.formation,
            publishedAt: new Date(),
          },
        })
      }

      // Create starter players
      const starterPlayers = await Promise.all(
        validatedData.starters.map(playerId =>
          tx.matchCallupPlayer.create({
            data: {
              callupId: callup.id,
              playerId,
              type: "STARTER",
              confirmed: false,
            },
          })
        )
      )

      // Create substitute players
      const substitutePlayers = await Promise.all(
        validatedData.substitutes.map(playerId =>
          tx.matchCallupPlayer.create({
            data: {
              callupId: callup.id,
              playerId,
              type: "SUBSTITUTE",
              confirmed: false,
            },
          })
        )
      )

      return {
        callup,
        starters: starterPlayers,
        substitutes: substitutePlayers,
      }
    })

    console.log(`✅ Callup published for match ${params.id}: ${result.starters.length} starters, ${result.substitutes.length} substitutes`)

    // TODO: Send notifications to players

    return NextResponse.json(
      { 
        message: "Callup published successfully",
        callup: result.callup,
        totalPlayers: result.starters.length + result.substitutes.length,
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

    console.error("Error creating callup:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/club/matches/[id]/callup - Get callup
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
      include: {
        callup: {
          include: {
            players: {
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
        },
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      match: {
        id: match.id,
        sport: match.sport,
        opponent: match.opponent,
        date: match.date,
      },
      callup: match.callup,
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching callup:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
