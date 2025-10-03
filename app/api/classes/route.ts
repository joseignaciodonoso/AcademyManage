import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const branchId = searchParams.get("branchId")

    const where: any = {}

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (branchId) {
      where.branchId = branchId
    }

    // Filter by user's academy
    if (session.user.role !== "SUPER_ADMIN" && session.user.academyId) {
      where.academyId = session.user.academyId
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    const formattedClasses = classes.map((cls) => ({
      id: cls.id,
      title: cls.title,
      startTime: cls.startTime,
      endTime: cls.endTime,
      instructor: cls.coach?.name ?? "",
      capacity: cls.maxCapacity,
      enrolled: cls._count.enrollments,
      location: cls.branch.name,
      level: cls.level,
      status: String(cls.status).toLowerCase(),
      description: cls.description ?? undefined,
    }))

    return NextResponse.json(formattedClasses)
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      instructorId,
      locationId,
      capacity,
      level,
      discipline,
    } = body

    // Combine date and time
    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = new Date(`${date}T${endTime}`)

    const newClass = await prisma.class.create({
      data: {
        academyId: session.user.academyId!,
        branchId: locationId,
        coachId: instructorId,
        title,
        description,
        startTime: startDateTime,
        endTime: endDateTime,
        discipline,
        level,
        status: "SCHEDULED",
        maxCapacity: Number.parseInt(String(capacity)),
      },
      include: {
        coach: { select: { name: true } },
        branch: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: newClass.id,
      title: newClass.title,
      startTime: newClass.startTime,
      endTime: newClass.endTime,
      instructor: newClass.coach?.name ?? "",
      capacity: newClass.maxCapacity,
      enrolled: 0,
      location: newClass.branch.name,
      level: newClass.level,
      status: String(newClass.status).toLowerCase(),
      description: newClass.description ?? undefined,
    })
  } catch (error) {
    console.error("Error creating class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
