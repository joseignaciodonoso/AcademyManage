import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/club/reports/export - Generate and export report
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

    // Only ADMIN and COACH can export reports
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { reportType, format, period, includeCharts } = body

    // Calculate date range based on period
    const now = new Date()
    let fromDate: Date | undefined
    
    switch (period) {
      case "7d":
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "365d":
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        fromDate = undefined
    }

    // Fetch data based on report type
    let reportData: any = {}

    switch (reportType) {
      case "team-performance":
        reportData = await generateTeamPerformanceData(user.academyId, fromDate)
        break
      case "player-stats":
        reportData = await generatePlayerStatsData(user.academyId, fromDate)
        break
      case "match-history":
        reportData = await generateMatchHistoryData(user.academyId, fromDate)
        break
      case "training-attendance":
        reportData = await generateTrainingAttendanceData(user.academyId, fromDate)
        break
      case "player-evaluations":
        reportData = await generatePlayerEvaluationsData(user.academyId, fromDate)
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Generate file based on format
    if (format === "excel") {
      const excelBuffer = await generateExcelReport(reportType, reportData, user.academy?.name || "Club")
      
      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="reporte-${reportType}-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    } else {
      const pdfBuffer = await generatePDFReport(reportType, reportData, user.academy?.name || "Club", includeCharts)
      
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="reporte-${reportType}-${new Date().toISOString().split("T")[0]}.pdf"`,
        },
      })
    }
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper functions to fetch data
async function generateTeamPerformanceData(academyId: string, fromDate?: Date) {
  const matches = await (prisma as any).match.findMany({
    where: {
      academyId,
      ...(fromDate && { date: { gte: fromDate } }),
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
    orderBy: { date: "desc" },
  })

  const wins = matches.filter((m: any) => m.result === "WIN").length
  const draws = matches.filter((m: any) => m.result === "DRAW").length
  const losses = matches.filter((m: any) => m.result === "LOSS").length
  const totalGoalsFor = matches.reduce((sum: number, m: any) => sum + (m.goalsFor || 0), 0)
  const totalGoalsAgainst = matches.reduce((sum: number, m: any) => sum + (m.goalsAgainst || 0), 0)

  return {
    matches,
    summary: {
      totalMatches: matches.length,
      wins,
      draws,
      losses,
      winRate: matches.length > 0 ? (wins / matches.length) * 100 : 0,
      totalGoalsFor,
      totalGoalsAgainst,
      avgGoalsPerMatch: matches.length > 0 ? totalGoalsFor / matches.length : 0,
    },
  }
}

async function generatePlayerStatsData(academyId: string, fromDate?: Date) {
  const players = await prisma.user.findMany({
    where: {
      academyId,
      role: "STUDENT",
      status: "ACTIVE",
    },
    include: {
      matchStats: {
        where: fromDate ? {
          match: {
            date: { gte: fromDate },
          },
        } : undefined,
        include: {
          match: true,
        },
      },
    },
  })

  return players.map((player: any) => ({
    id: player.id,
    name: player.name,
    matchesPlayed: player.matchStats.length,
    goals: player.matchStats.reduce((sum: number, s: any) => sum + (s.goals || 0), 0),
    assists: player.matchStats.reduce((sum: number, s: any) => sum + (s.assists || 0), 0),
    points: player.matchStats.reduce((sum: number, s: any) => sum + (s.points || 0), 0),
    minutes: player.matchStats.reduce((sum: number, s: any) => sum + (s.minutes || 0), 0),
  }))
}

async function generateMatchHistoryData(academyId: string, fromDate?: Date) {
  return await (prisma as any).match.findMany({
    where: {
      academyId,
      ...(fromDate && { date: { gte: fromDate } }),
    },
    orderBy: { date: "desc" },
  })
}

async function generateTrainingAttendanceData(academyId: string, fromDate?: Date) {
  const sessions = await prisma.trainingSession.findMany({
    where: {
      academyId,
      ...(fromDate && { date: { gte: fromDate } }),
    },
    include: {
      attendance: {
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
    orderBy: { date: "desc" },
  })

  return sessions
}

async function generatePlayerEvaluationsData(academyId: string, fromDate?: Date) {
  return await (prisma as any).evaluation.findMany({
    where: {
      player: {
        academyId,
      },
      ...(fromDate && { createdAt: { gte: fromDate } }),
    },
    include: {
      player: {
        select: {
          id: true,
          name: true,
        },
      },
      match: {
        select: {
          id: true,
          opponent: true,
          date: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

// Placeholder functions for file generation
// These would use libraries like exceljs and pdfkit
async function generateExcelReport(reportType: string, data: any, clubName: string): Promise<Buffer> {
  // TODO: Implement Excel generation with exceljs
  // For now, return a simple CSV-like structure
  const csv = JSON.stringify(data, null, 2)
  return Buffer.from(csv)
}

async function generatePDFReport(reportType: string, data: any, clubName: string, includeCharts: boolean): Promise<Buffer> {
  // TODO: Implement PDF generation with pdfkit or puppeteer
  // For now, return a simple text representation
  const text = `
${clubName}
Reporte: ${reportType}
Fecha: ${new Date().toLocaleDateString()}

${JSON.stringify(data, null, 2)}
  `
  return Buffer.from(text)
}
