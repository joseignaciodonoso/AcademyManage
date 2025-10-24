import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6).optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  location: z.string().min(1).optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
})

// PATCH /api/club/training-schedules/[id]
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
    const data = UpdateScheduleSchema.parse(body)

    const updated = await (prisma as any).trainingSchedule.updateMany({
      where: { id: params.id, academyId: user.academyId },
      data,
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: e.errors }, { status: 400 })
    }
    console.error("Error updating training schedule", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/club/training-schedules/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await (prisma as any).trainingSchedule.deleteMany({
      where: { id: params.id, academyId: user.academyId },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Error deleting training schedule", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
