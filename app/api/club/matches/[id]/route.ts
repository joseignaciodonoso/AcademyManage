import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateMatchSchema = z.object({
  opponent: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  homeAway: z.enum(["HOME", "AWAY"]).optional(),
  date: z.coerce.date().optional(),
  notes: z.string().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "FINISHED", "CANCELLED"]).optional(),
  scoreFor: z.number().int().min(0).nullable().optional(),
  scoreAgainst: z.number().int().min(0).nullable().optional(),
  result: z.enum(["WIN", "LOSS", "DRAW"]).nullable().optional(),
})

// GET /api/club/matches/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })

    const match = await (prisma as any).match.findFirst({
      where: { id: params.id, academyId: user.academyId },
      include: {
        callup: { include: { players: { include: { player: { select: { id: true, name: true } } } } } },
        stats: { include: { player: { select: { id: true, name: true } } } },
        _count: { select: { evaluations: true } },
      },
    })

    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const scoreFor = (match as any).pointsFor ?? (match as any).goalsFor ?? null
    const scoreAgainst = (match as any).pointsAgainst ?? (match as any).goalsAgainst ?? null
    return NextResponse.json({ match: { ...match, scoreFor, scoreAgainst } })
  } catch (e) {
    console.error("Error fetching match", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/club/matches/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const data = UpdateMatchSchema.parse(body)

    // Ensure belongs to academy
    const exists = await (prisma as any).match.findFirst({ where: { id: params.id, academyId: user.academyId } })
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Build update payload mapping scoreFor/scoreAgainst to proper fields by sport
    const updateData: any = {
      ...("opponent" in data ? { opponent: data.opponent } : {}),
      ...("location" in data ? { location: data.location } : {}),
      ...("homeAway" in data ? { homeAway: data.homeAway } : {}),
      ...("date" in data ? { date: data.date } : {}),
      ...("notes" in data ? { notes: data.notes } : {}),
      ...( "status" in data ? { status: data.status } : {}),
    }

    // Map generic scores to sport-specific fields
    if ("scoreFor" in data || "scoreAgainst" in data) {
      const isFootball = exists.sport === "FOOTBALL"
      const forKey = isFootball ? "goalsFor" : "pointsFor"
      const againstKey = isFootball ? "goalsAgainst" : "pointsAgainst"
      if ("scoreFor" in data) updateData[forKey] = data.scoreFor
      if ("scoreAgainst" in data) updateData[againstKey] = data.scoreAgainst
    }

    // If result not explicitly provided, compute it when we have both scores and status FINISHED
    const statusAfter = ("status" in data ? data.status : exists.status)
    const isFinished = statusAfter === "FINISHED"
    if (!("result" in data)) {
      const isFootball = exists.sport === "FOOTBALL"
      const forKey = isFootball ? "goalsFor" : "pointsFor"
      const againstKey = isFootball ? "goalsAgainst" : "pointsAgainst"
      const currentFor = ("scoreFor" in data ? data.scoreFor : (exists as any)[forKey])
      const currentAgainst = ("scoreAgainst" in data ? data.scoreAgainst : (exists as any)[againstKey])
      if (isFinished && currentFor != null && currentAgainst != null) {
        updateData.result = currentFor > currentAgainst ? "WIN" : currentFor < currentAgainst ? "LOSS" : "DRAW"
      }
    } else {
      updateData.result = data.result
    }
    
    // Auto-update status based on date if being updated
    if ("date" in data) {
      const newDate = data.date as Date
      const now = new Date()
      // Si se está cambiando la fecha y el partido no está CANCELLED, actualizar estado automáticamente
      if (statusAfter !== "CANCELLED") {
        if (newDate < now && statusAfter === "SCHEDULED") {
          updateData.status = "FINISHED"
        } else if (newDate >= now && statusAfter === "FINISHED") {
          updateData.status = "SCHEDULED"
        }
      }
    }

    const updated = await (prisma as any).match.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ match: updated })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: e.errors }, { status: 400 })
    }
    console.error("Error updating match", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
