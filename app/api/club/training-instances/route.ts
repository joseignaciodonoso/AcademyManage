import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const QuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.string().optional(),
})

// GET /api/club/training-instances - List training instances with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const query = QuerySchema.parse({
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      status: searchParams.get("status") || undefined,
    })

    const where: any = { academyId: user.academyId }
    
    if (query.from || query.to) {
      where.date = {}
      if (query.from) where.date.gte = new Date(query.from)
      if (query.to) where.date.lte = new Date(query.to)
    }
    
    if (query.status) {
      where.status = query.status
    }

    const instances = await (prisma as any).trainingInstance.findMany({
      where,
      include: {
        schedule: true,
        attendance: {
          include: {
            player: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { attendance: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ instances })
  } catch (e) {
    console.error("Error fetching training instances", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/club/training-instances - Create a one-off training instance
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
    
    const instance = await (prisma as any).trainingInstance.create({
      data: {
        ...body,
        academyId: user.academyId,
        scheduleId: null, // One-off training
      },
    })

    return NextResponse.json({ instance }, { status: 201 })
  } catch (e) {
    console.error("Error creating training instance", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
