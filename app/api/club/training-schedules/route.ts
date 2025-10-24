import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  location: z.string().min(1),
  type: z.string().optional(),
  category: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
})

// GET /api/club/training-schedules - List all training schedules
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })

    const schedules = await (prisma as any).trainingSchedule.findMany({
      where: { academyId: user.academyId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json({ schedules })
  } catch (e) {
    console.error("Error fetching training schedules", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/club/training-schedules - Create new training schedule
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
    const data = CreateScheduleSchema.parse(body)

    const schedule = await (prisma as any).trainingSchedule.create({
      data: {
        ...data,
        academyId: user.academyId,
      },
    })

    // Generate initial instances for the next 3 months
    await generateTrainingInstances(schedule.id, user.academyId)

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: e.errors }, { status: 400 })
    }
    console.error("Error creating training schedule", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to generate training instances from schedule
async function generateTrainingInstances(scheduleId: string, academyId: string) {
  const schedule = await (prisma as any).trainingSchedule.findUnique({
    where: { id: scheduleId },
  })

  if (!schedule) return

  const startDate = new Date(schedule.startDate)
  const endDate = schedule.endDate ? new Date(schedule.endDate) : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 months
  
  const instances = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    if (currentDate.getDay() === schedule.dayOfWeek) {
      instances.push({
        scheduleId: schedule.id,
        academyId,
        date: new Date(currentDate),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        location: schedule.location,
        type: schedule.type,
        category: schedule.category,
        status: "SCHEDULED",
      })
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  if (instances.length > 0) {
    await (prisma as any).trainingInstance.createMany({
      data: instances,
      skipDuplicates: true,
    })
  }
}
