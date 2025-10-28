import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateTournamentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  season: z.string().optional(),
  type: z.enum(["APERTURA", "CLAUSURA", "LIGA_LARGA", "CUP", "FRIENDLY", "PLAYOFF"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  rules: z.string().optional(),
  rulesFileUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  status: z.enum(["ACTIVE", "FINISHED", "CANCELLED"]).optional(),
})

// GET /api/club/tournaments/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })

    const tournament = await (prisma as any).tournament.findFirst({
      where: { id: params.id, academyId: user.academyId },
      include: {
        matches: {
          orderBy: { date: 'asc' },
          include: {
            stats: {
              include: {
                player: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        standings: {
          orderBy: { points: 'desc' },
        },
      },
    })

    if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 })

    // Calculate player statistics for this tournament
    const playerStats = await calculateTournamentPlayerStats(params.id, tournament.matches[0]?.sport)

    return NextResponse.json({ tournament, playerStats })
  } catch (e) {
    console.error("Error fetching tournament", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/club/tournaments/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = UpdateTournamentSchema.parse(body)

    const tournament = await (prisma as any).tournament.updateMany({
      where: { id: params.id, academyId: user.academyId },
      data,
    })

    if (tournament.count === 0) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: e.errors }, { status: 400 })
    }
    console.error("Error updating tournament", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/club/tournaments/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })
    if (!["ACADEMY_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await (prisma as any).tournament.deleteMany({
      where: { id: params.id, academyId: user.academyId },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Error deleting tournament", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to calculate player stats for a tournament
async function calculateTournamentPlayerStats(tournamentId: string, sport: string) {
  const stats = await (prisma as any).matchPlayerStat.groupBy({
    by: ['playerId'],
    where: {
      match: {
        tournamentId,
      },
    },
    _sum: {
      points: true,
      rebounds: true,
      assists: true,
      steals: true,
      blocks: true,
      fouls: true,
      minutes: true,
      goals: true,
      yellowCards: true,
      redCards: true,
    },
    _count: {
      matchId: true,
    },
  })

  // Enrich with player names
  const enrichedStats = await Promise.all(
    stats.map(async (stat: any) => {
      const player = await prisma.user.findUnique({
        where: { id: stat.playerId },
        select: { id: true, name: true },
      })
      return {
        player,
        matchesPlayed: stat._count.matchId,
        totals: stat._sum,
        averages: {
          points: stat._sum.points ? stat._sum.points / stat._count.matchId : 0,
          rebounds: stat._sum.rebounds ? stat._sum.rebounds / stat._count.matchId : 0,
          assists: stat._sum.assists ? stat._sum.assists / stat._count.matchId : 0,
          goals: stat._sum.goals ? stat._sum.goals / stat._count.matchId : 0,
        },
      }
    })
  )

  return enrichedStats
}
