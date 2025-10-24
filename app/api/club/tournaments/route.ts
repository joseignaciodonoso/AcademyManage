import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateTournamentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  season: z.string().min(1),
  type: z.enum(["LEAGUE", "CUP", "FRIENDLY", "PLAYOFF"]).default("LEAGUE"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  rules: z.string().optional(),
  rulesFileUrl: z.string().optional(),
  logoUrl: z.string().optional(),
})

// GET /api/club/tournaments - List all tournaments
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })

    const tournaments = await (prisma as any).tournament.findMany({
      where: { academyId: user.academyId },
      include: {
        _count: {
          select: { matches: true },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ tournaments })
  } catch (e) {
    console.error("Error fetching tournaments", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/club/tournaments - Create new tournament
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = CreateTournamentSchema.parse(body)

    const tournament = await (prisma as any).tournament.create({
      data: {
        ...data,
        academyId: user.academyId,
      },
    })

    return NextResponse.json({ tournament }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: e.errors }, { status: 400 })
    }
    console.error("Error creating tournament", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
