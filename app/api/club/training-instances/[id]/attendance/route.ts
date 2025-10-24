import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ConfirmSchema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED"]),
})

// GET /api/club/training-instances/[id]/attendance
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })

    const attendance = await (prisma as any).trainingAttendance.findMany({
      where: { instanceId: params.id },
      include: {
        player: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ attendance })
  } catch (e) {
    console.error("Error fetching attendance", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/club/training-instances/[id]/attendance - Player confirms attendance
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })

    const body = await request.json()
    const data = ConfirmSchema.parse(body)

    // Verify instance belongs to academy
    const instance = await (prisma as any).trainingInstance.findFirst({
      where: { id: params.id, academyId: user.academyId },
    })
    if (!instance) return NextResponse.json({ error: "Training not found" }, { status: 404 })

    const attendance = await (prisma as any).trainingAttendance.upsert({
      where: {
        instanceId_playerId: {
          instanceId: params.id,
          playerId: session.user.id,
        },
      },
      update: {
        status: data.status,
        confirmedAt: new Date(),
      },
      create: {
        instanceId: params.id,
        playerId: session.user.id,
        status: data.status,
        confirmedAt: new Date(),
      },
    })

    return NextResponse.json({ attendance })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: e.errors }, { status: 400 })
    }
    console.error("Error confirming attendance", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/club/training-instances/[id]/attendance - Check-in
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })

    const body = await request.json()
    const { playerId } = body

    // If coach/admin, can check-in any player; if player, can only check-in themselves
    const targetPlayerId = ["ACADEMY_ADMIN", "COACH"].includes(user.role) && playerId ? playerId : session.user.id

    const attendance = await (prisma as any).trainingAttendance.upsert({
      where: {
        instanceId_playerId: {
          instanceId: params.id,
          playerId: targetPlayerId,
        },
      },
      update: {
        status: "ATTENDED",
        checkedInAt: new Date(),
      },
      create: {
        instanceId: params.id,
        playerId: targetPlayerId,
        status: "ATTENDED",
        checkedInAt: new Date(),
      },
    })

    return NextResponse.json({ attendance })
  } catch (e) {
    console.error("Error checking in", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
