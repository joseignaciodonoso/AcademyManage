import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BulkMatchStatsSchema, validateStatsForSport } from "@/lib/validations/club"
import { z } from "zod"

// GET /api/club/matches/[id]/stats - Get match stats
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
        stats: {
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
        status: match.status,
      },
      stats: match.stats,
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching match stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/club/matches/[id]/stats - Update match stats (bulk)
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

    // Only ADMIN and COACH can update stats
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
    const validatedData = BulkMatchStatsSchema.parse(body)

    // Validate each stat matches the sport
    const validationErrors: string[] = []
    for (const stat of validatedData.stats) {
      const validation = validateStatsForSport(stat, match.sport)
      if (!validation.valid) {
        validationErrors.push(`Player ${stat.playerId}: ${validation.errors.join(", ")}`)
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Stats validation failed", details: validationErrors },
        { status: 400 }
      )
    }

    // Upsert stats and update player profiles
    const results = await prisma.$transaction(async (tx) => {
      const statsResults = await Promise.all(
        validatedData.stats.map(async (stat) => {
          // Upsert match stat
          const matchStat = await tx.matchPlayerStat.upsert({
            where: {
              matchId_playerId: {
                matchId: params.id,
                playerId: stat.playerId,
              },
            },
            update: {
              goals: stat.goals ?? 0,
              assists: stat.assists ?? 0,
              yellow: stat.yellow ?? 0,
              red: stat.red ?? 0,
              points: stat.points ?? 0,
              rebounds: stat.rebounds ?? 0,
              steals: stat.steals ?? 0,
              blocks: stat.blocks ?? 0,
              fouls: stat.fouls ?? 0,
              minutes: stat.minutes ?? 0,
            },
            create: {
              matchId: params.id,
              playerId: stat.playerId,
              goals: stat.goals ?? 0,
              assists: stat.assists ?? 0,
              yellow: stat.yellow ?? 0,
              red: stat.red ?? 0,
              points: stat.points ?? 0,
              rebounds: stat.rebounds ?? 0,
              steals: stat.steals ?? 0,
              blocks: stat.blocks ?? 0,
              fouls: stat.fouls ?? 0,
              minutes: stat.minutes ?? 0,
            },
          })

          // Update player profile totals
          const profile = await tx.playerProfile.findUnique({
            where: { userId: stat.playerId },
          })

          if (profile) {
            // Get previous stats for this match (if updating)
            const previousStat = await tx.matchPlayerStat.findUnique({
              where: {
                matchId_playerId: {
                  matchId: params.id,
                  playerId: stat.playerId,
                },
              },
            })

            // Calculate deltas
            const deltaGoals = (stat.goals ?? 0) - (previousStat?.goals ?? 0)
            const deltaAssists = (stat.assists ?? 0) - (previousStat?.assists ?? 0)
            const deltaYellow = (stat.yellow ?? 0) - (previousStat?.yellow ?? 0)
            const deltaRed = (stat.red ?? 0) - (previousStat?.red ?? 0)
            const deltaPoints = (stat.points ?? 0) - (previousStat?.points ?? 0)
            const deltaRebounds = (stat.rebounds ?? 0) - (previousStat?.rebounds ?? 0)
            const deltaSteals = (stat.steals ?? 0) - (previousStat?.steals ?? 0)
            const deltaBlocks = (stat.blocks ?? 0) - (previousStat?.blocks ?? 0)
            const deltaFouls = (stat.fouls ?? 0) - (previousStat?.fouls ?? 0)
            const deltaMinutes = (stat.minutes ?? 0) - (previousStat?.minutes ?? 0)

            await tx.playerProfile.update({
              where: { userId: stat.playerId },
              data: {
                totalGoals: { increment: deltaGoals },
                totalAssists: { increment: deltaAssists },
                yellowCards: { increment: deltaYellow },
                redCards: { increment: deltaRed },
                totalPoints: { increment: deltaPoints },
                totalRebounds: { increment: deltaRebounds },
                totalSteals: { increment: deltaSteals },
                totalBlocks: { increment: deltaBlocks },
                fouls: { increment: deltaFouls },
                minutesPlayed: { increment: deltaMinutes },
                // matchesPlayed is incremented only once per match
                ...(previousStat ? {} : { matchesPlayed: { increment: 1 } }),
              },
            })
          }

          return matchStat
        })
      )

      return statsResults
    })

    console.log(`✅ Stats updated for ${results.length} players in match ${params.id}`)

    return NextResponse.json(
      { 
        message: "Stats updated successfully",
        count: results.length,
        stats: results,
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

    console.error("Error updating match stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
