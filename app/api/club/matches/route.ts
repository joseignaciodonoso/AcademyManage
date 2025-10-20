import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CreateMatchSchema } from "@/lib/validations/club"
import { z } from "zod"

// GET /api/club/matches - List matches
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

    // Query params
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const sport = searchParams.get("sport")
    const status = searchParams.get("status")

    const matches = await prisma.match.findMany({
      where: {
        academyId: user.academyId,
        ...(from && to ? {
          date: {
            gte: new Date(from),
            lte: new Date(to),
          },
        } : {}),
        ...(sport ? { sport: sport as "FOOTBALL" | "BASKETBALL" } : {}),
        ...(status ? { status } : {}),
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
                    playerProfile: true,
                  },
                },
              },
            },
          },
        },
        stats: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            evaluations: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json({ matches }, { status: 200 })
  } catch (error) {
    console.error("Error fetching matches:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/club/matches - Create match
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

    // Only ADMIN and COACH can create matches
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
    const validatedData = CreateMatchSchema.parse(body)

    // Create match
    const match = await prisma.match.create({
      data: {
        academyId: user.academyId,
        sport: validatedData.sport,
        date: new Date(validatedData.date),
        opponent: validatedData.opponent,
        location: validatedData.location,
        homeAway: validatedData.homeAway,
        notes: validatedData.notes,
        status: "SCHEDULED",
      },
    })

    console.log(`✅ Match created: ${match.id} (${match.sport})`)

    return NextResponse.json(
      { 
        message: "Match created successfully",
        match,
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

    console.error("Error creating match:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
