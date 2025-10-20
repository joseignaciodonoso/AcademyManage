import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { PlayerMetrics, PlayerMatchStat } from "@/lib/types/club"

// GET /api/club/metrics/player/[id] - Get player metrics
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

    // Get player
    const player = await prisma.user.findFirst({
      where: {
        id: params.id,
        academyId: user.academyId,
      },
      include: {
        playerProfile: true,
      },
    })

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Query params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"

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
        fromDate = new Date(0)
        break
      default:
        fromDate.setDate(now.getDate() - 30)
    }

    // Get player's match stats
    const matchStats = await prisma.matchPlayerStat.findMany({
      where: {
        playerId: params.id,
        match: {
          academyId: user.academyId,
          date: {
            gte: fromDate,
            lte: now,
          },
          status: "FINISHED",
        },
      },
      include: {
        match: {
          select: {
            id: true,
            sport: true,
            date: true,
            opponent: true,
          },
        },
      },
      orderBy: {
        match: {
          date: "desc",
        },
      },
    })

    const matchesPlayed = matchStats.length
    const sport = matchStats[0]?.match.sport || "FOOTBALL"

    // Calculate totals
    let totalGoals = 0
    let totalAssists = 0
    let totalPoints = 0
    let totalRebounds = 0
    let totalSteals = 0
    let totalBlocks = 0
    let totalMinutes = 0
    let yellowCards = 0
    let redCards = 0
    let fouls = 0

    matchStats.forEach(stat => {
      totalGoals += stat.goals
      totalAssists += stat.assists
      totalPoints += stat.points
      totalRebounds += stat.rebounds
      totalSteals += stat.steals
      totalBlocks += stat.blocks
      totalMinutes += stat.minutes
      yellowCards += stat.yellow
      redCards += stat.red
      fouls += stat.fouls
    })

    // Calculate averages
    const avgMinutesPerMatch = matchesPlayed > 0 ? totalMinutes / matchesPlayed : 0
    const goalsPerMatch = matchesPlayed > 0 ? totalGoals / matchesPlayed : 0
    const assistsPerMatch = matchesPlayed > 0 ? totalAssists / matchesPlayed : 0
    const pointsPerGame = matchesPlayed > 0 ? totalPoints / matchesPlayed : 0
    const reboundsPerGame = matchesPlayed > 0 ? totalRebounds / matchesPlayed : 0
    const assistsPerGame = matchesPlayed > 0 ? totalAssists / matchesPlayed : 0

    // Normalized stats (per 90 min for football, per 36 min for basketball)
    const goalsPer90 = totalMinutes > 0 ? (totalGoals / totalMinutes) * 90 : 0
    const assistsPer90 = totalMinutes > 0 ? (totalAssists / totalMinutes) * 90 : 0
    const pointsPer36 = totalMinutes > 0 ? (totalPoints / totalMinutes) * 36 : 0
    const reboundsPer36 = totalMinutes > 0 ? (totalRebounds / totalMinutes) * 36 : 0
    const assistsPer36 = totalMinutes > 0 ? (totalAssists / totalMinutes) * 36 : 0

    // Training attendance
    const trainingAttendance = await prisma.trainingAttendance.findMany({
      where: {
        playerId: params.id,
        session: {
          academyId: user.academyId,
          date: {
            gte: fromDate,
            lte: now,
          },
        },
      },
    })

    const totalTrainingSessions = trainingAttendance.length
    const presentSessions = trainingAttendance.filter(a => a.status === "PRESENT").length
    const trainingAttendanceRate = totalTrainingSessions > 0 ? (presentSessions / totalTrainingSessions) * 100 : 0

    // Match attendance (convocatorias)
    const callups = await prisma.matchCallupPlayer.findMany({
      where: {
        playerId: params.id,
        callup: {
          match: {
            academyId: user.academyId,
            date: {
              gte: fromDate,
              lte: now,
            },
          },
        },
      },
    })

    const totalCallups = callups.length
    const confirmedCallups = callups.filter(c => c.confirmed).length
    const matchAttendanceRate = totalCallups > 0 ? (confirmedCallups / totalCallups) * 100 : 0

    // Evaluations
    const evaluations = await prisma.playerEvaluation.findMany({
      where: {
        playerId: params.id,
        createdAt: {
          gte: fromDate,
          lte: now,
        },
      },
    })

    const avgTechnique = evaluations.length > 0 
      ? evaluations.reduce((sum, e) => sum + e.technique, 0) / evaluations.length 
      : undefined
    const avgTactics = evaluations.length > 0 
      ? evaluations.reduce((sum, e) => sum + e.tactics, 0) / evaluations.length 
      : undefined
    const avgPhysical = evaluations.length > 0 
      ? evaluations.reduce((sum, e) => sum + e.physical, 0) / evaluations.length 
      : undefined
    const avgAttitude = evaluations.length > 0 
      ? evaluations.reduce((sum, e) => sum + e.attitude, 0) / evaluations.length 
      : undefined
    const avgOverall = avgTechnique && avgTactics && avgPhysical && avgAttitude
      ? (avgTechnique + avgTactics + avgPhysical + avgAttitude) / 4
      : undefined

    // Recent stats (last 5 matches)
    const recentStats: PlayerMatchStat[] = matchStats.slice(0, 5).map(stat => ({
      matchId: stat.matchId,
      date: stat.match.date,
      opponent: stat.match.opponent,
      goals: sport === "FOOTBALL" ? stat.goals : undefined,
      assists: stat.assists,
      points: sport === "BASKETBALL" ? stat.points : undefined,
      rebounds: sport === "BASKETBALL" ? stat.rebounds : undefined,
      minutes: stat.minutes,
    }))

    // Build response
    const metrics: PlayerMetrics = {
      playerId: params.id,
      playerName: player.name || "Unknown",
      sport,
      matchesPlayed,
      minutesPlayed: totalMinutes,
      avgMinutesPerMatch,
      totalGoals: sport === "FOOTBALL" ? totalGoals : undefined,
      totalAssists: sport === "FOOTBALL" ? totalAssists : undefined,
      goalsPerMatch: sport === "FOOTBALL" ? goalsPerMatch : undefined,
      assistsPerMatch: sport === "FOOTBALL" ? assistsPerMatch : undefined,
      goalsPer90: sport === "FOOTBALL" ? goalsPer90 : undefined,
      assistsPer90: sport === "FOOTBALL" ? assistsPer90 : undefined,
      yellowCards: sport === "FOOTBALL" ? yellowCards : undefined,
      redCards: sport === "FOOTBALL" ? redCards : undefined,
      totalPoints: sport === "BASKETBALL" ? totalPoints : undefined,
      totalRebounds: sport === "BASKETBALL" ? totalRebounds : undefined,
      totalSteals: sport === "BASKETBALL" ? totalSteals : undefined,
      totalBlocks: sport === "BASKETBALL" ? totalBlocks : undefined,
      pointsPerGame: sport === "BASKETBALL" ? pointsPerGame : undefined,
      reboundsPerGame: sport === "BASKETBALL" ? reboundsPerGame : undefined,
      assistsPerGame: sport === "BASKETBALL" ? assistsPerGame : undefined,
      pointsPer36: sport === "BASKETBALL" ? pointsPer36 : undefined,
      reboundsPer36: sport === "BASKETBALL" ? reboundsPer36 : undefined,
      assistsPer36: sport === "BASKETBALL" ? assistsPer36 : undefined,
      fouls: sport === "BASKETBALL" ? fouls : undefined,
      trainingAttendanceRate,
      matchAttendanceRate,
      avgTechnique,
      avgTactics,
      avgPhysical,
      avgAttitude,
      avgOverall,
      recentStats,
    }

    return NextResponse.json({ metrics }, { status: 200 })
  } catch (error) {
    console.error("Error fetching player metrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
