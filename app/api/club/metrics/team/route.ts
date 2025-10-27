import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { TeamMetrics, PlayerRanking, MatchSummary } from "@/lib/types/club"

// GET /api/club/metrics/team - Get team metrics
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

    // Allow SUPER_ADMIN to query metrics (optionally with academyId). Enforce CLUB only for non SUPER_ADMIN users.
    if (user.role !== "SUPER_ADMIN" && user.academy?.type !== "CLUB") {
      return NextResponse.json(
        { error: "This feature is only available for clubs" },
        { status: 403 }
      )
    }

    // Query params
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") as "FOOTBALL" | "BASKETBALL" | null
    const period = searchParams.get("period") || "30d"
    const qAcademyId = searchParams.get("academyId")

    // Resolve academyId from session or explicit param (only if same academy or SUPER_ADMIN)
    const sessionAcademyId = user.academyId
    const academyId = (qAcademyId && (user.role === "SUPER_ADMIN" || qAcademyId === sessionAcademyId))
      ? qAcademyId
      : sessionAcademyId

    console.log(`GET /api/club/metrics/team - Sport: ${sport}, Period: ${period}, AcademyId: ${academyId}`)

    // Calculate date range
    const now = new Date()
    let fromDate = new Date()
    
    switch (period) {
      case "7d":
        fromDate.setDate(now.getDate() - 7)
        break
      case "30d":
        fromDate.setDate(now.getDate() - 30)
        break
      case "90d":
        fromDate.setDate(now.getDate() - 90)
        break
      case "365d":
        fromDate.setFullYear(now.getFullYear() - 1)
        break
      case "all":
        fromDate = new Date(0) // Beginning of time
        break
      default:
        fromDate.setDate(now.getDate() - 30)
    }

    // Get matches in period
    const matches = await prisma.match.findMany({
      where: {
        academyId,
        ...(sport ? { sport } : {}),
        date: {
          gte: fromDate,
          lte: now,
        },
        status: {
          in: ["FINISHED", "COMPLETED"] // Support both status values
        },
      },
      include: {
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
      },
      orderBy: {
        date: "desc",
      },
    })

    console.log(`Found ${matches.length} matches in period`)
    
    // Calculate metrics
    const matchesPlayed = matches.length
    const wins = matches.filter(m => m.result === "WIN").length
    const draws = matches.filter(m => m.result === "DRAW").length
    const losses = matches.filter(m => m.result === "LOSS").length
    const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0
    
    console.log(`Metrics: ${wins}W ${draws}D ${losses}L - Win Rate: ${winRate.toFixed(1)}%`)

    // Offensive/Defensive stats
    let totalGoalsFor = 0
    let totalGoalsAgainst = 0
    let totalPointsFor = 0
    let totalPointsAgainst = 0
    let totalYellowCards = 0
    let totalRedCards = 0

    matches.forEach(match => {
      if (match.sport === "FOOTBALL") {
        totalGoalsFor += match.goalsFor || 0
        totalGoalsAgainst += match.goalsAgainst || 0
        // Count cards from stats
        match.stats.forEach(stat => {
          totalYellowCards += stat.yellow
          totalRedCards += stat.red
        })
      } else {
        totalPointsFor += match.pointsFor || 0
        totalPointsAgainst += match.pointsAgainst || 0
      }
    })

    // Player rankings
    const playerStats = new Map<string, {
      id: string
      name: string
      goals: number
      assists: number
      points: number
      rebounds: number
      steals: number
      blocks: number
      matchesPlayed: number
    }>()

    matches.forEach(match => {
      match.stats.forEach(stat => {
        const existing = playerStats.get(stat.playerId) || {
          id: stat.playerId,
          name: stat.player.name || "Unknown",
          goals: 0,
          assists: 0,
          points: 0,
          rebounds: 0,
          steals: 0,
          blocks: 0,
          matchesPlayed: 0,
        }

        existing.goals += stat.goals
        existing.assists += stat.assists
        existing.points += stat.points
        existing.rebounds += stat.rebounds
        existing.steals += stat.steals
        existing.blocks += stat.blocks
        existing.matchesPlayed += 1

        playerStats.set(stat.playerId, existing)
      })
    })

    // Convert to rankings
    const players = Array.from(playerStats.values())

    const topScorers: PlayerRanking[] = players
      .map(p => ({
        playerId: p.id,
        playerName: p.name,
        value: sport === "BASKETBALL" ? p.points : p.goals,
        matchesPlayed: p.matchesPlayed,
        perMatch: p.matchesPlayed > 0 ? (sport === "BASKETBALL" ? p.points : p.goals) / p.matchesPlayed : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    const topAssists: PlayerRanking[] = players
      .map(p => ({
        playerId: p.id,
        playerName: p.name,
        value: p.assists,
        matchesPlayed: p.matchesPlayed,
        perMatch: p.matchesPlayed > 0 ? p.assists / p.matchesPlayed : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    const topRebounds: PlayerRanking[] | undefined = sport === "BASKETBALL" ? players
      .map(p => ({
        playerId: p.id,
        playerName: p.name,
        value: p.rebounds,
        matchesPlayed: p.matchesPlayed,
        perMatch: p.matchesPlayed > 0 ? p.rebounds / p.matchesPlayed : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) : undefined

    const topSteals: PlayerRanking[] | undefined = sport === "BASKETBALL" ? players
      .map(p => ({
        playerId: p.id,
        playerName: p.name,
        value: p.steals,
        matchesPlayed: p.matchesPlayed,
        perMatch: p.matchesPlayed > 0 ? p.steals / p.matchesPlayed : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) : undefined

    const topBlocks: PlayerRanking[] | undefined = sport === "BASKETBALL" ? players
      .map(p => ({
        playerId: p.id,
        playerName: p.name,
        value: p.blocks,
        matchesPlayed: p.matchesPlayed,
        perMatch: p.matchesPlayed > 0 ? p.blocks / p.matchesPlayed : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) : undefined

    // Recent matches (last 5)
    const recentMatches: MatchSummary[] = matches.slice(0, 5).map(m => ({
      id: m.id,
      date: m.date,
      opponent: m.opponent,
      result: m.result as "WIN" | "DRAW" | "LOSS",
      scoreFor: m.sport === "FOOTBALL" ? (m.goalsFor || 0) : (m.pointsFor || 0),
      scoreAgainst: m.sport === "FOOTBALL" ? (m.goalsAgainst || 0) : (m.pointsAgainst || 0),
    }))

    // Training attendance
    const trainingSessions = await prisma.trainingSession.findMany({
      where: {
        academyId: user.academyId,
        date: {
          gte: fromDate,
          lte: now,
        },
      },
      include: {
        attendance: true,
      },
    })

    const totalAttendanceSlots = trainingSessions.reduce((sum, session) => sum + session.attendance.length, 0)
    const presentCount = trainingSessions.reduce(
      (sum, session) => sum + session.attendance.filter(a => a.status === "PRESENT").length,
      0
    )
    const avgTrainingAttendance = totalAttendanceSlots > 0 ? (presentCount / totalAttendanceSlots) * 100 : 0

    // Build response
    const metrics: TeamMetrics = {
      sport: sport || (matches[0]?.sport || "FOOTBALL"),
      period,
      matchesPlayed,
      wins,
      draws: sport === "FOOTBALL" ? draws : undefined,
      losses,
      winRate,
      totalGoalsFor: sport === "FOOTBALL" ? totalGoalsFor : undefined,
      totalPointsFor: sport === "BASKETBALL" ? totalPointsFor : undefined,
      avgGoalsPerMatch: sport === "FOOTBALL" && matchesPlayed > 0 ? totalGoalsFor / matchesPlayed : undefined,
      avgPointsPerMatch: sport === "BASKETBALL" && matchesPlayed > 0 ? totalPointsFor / matchesPlayed : undefined,
      totalGoalsAgainst: sport === "FOOTBALL" ? totalGoalsAgainst : undefined,
      totalPointsAgainst: sport === "BASKETBALL" ? totalPointsAgainst : undefined,
      avgGoalsAgainstPerMatch: sport === "FOOTBALL" && matchesPlayed > 0 ? totalGoalsAgainst / matchesPlayed : undefined,
      avgPointsAgainstPerMatch: sport === "BASKETBALL" && matchesPlayed > 0 ? totalPointsAgainst / matchesPlayed : undefined,
      goalDifferential: sport === "FOOTBALL" ? totalGoalsFor - totalGoalsAgainst : undefined,
      pointDifferential: sport === "BASKETBALL" ? totalPointsFor - totalPointsAgainst : undefined,
      totalYellowCards: sport === "FOOTBALL" ? totalYellowCards : undefined,
      totalRedCards: sport === "FOOTBALL" ? totalRedCards : undefined,
      avgTrainingAttendance,
      topScorers,
      topAssists,
      topRebounds,
      topSteals,
      topBlocks,
      recentMatches,
    }

    return NextResponse.json({ metrics }, { status: 200 })
  } catch (error) {
    console.error("Error fetching team metrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
