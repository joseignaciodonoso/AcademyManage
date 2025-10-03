import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const classId = params.id

    // Check if class exists and has capacity
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    if (!classInfo) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (classInfo._count.enrollments >= classInfo.capacity) {
      return NextResponse.json({ error: "Class is full" }, { status: 400 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        classId,
        studentId: session.user.id,
        status: "ACTIVE",
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        classId,
        studentId: session.user.id,
        status: "ACTIVE",
      },
    })

    return NextResponse.json({ success: true, enrollmentId: enrollment.id })
  } catch (error) {
    console.error("Error enrolling in class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const classId = params.id

    // Find and cancel enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        classId,
        studentId: session.user.id,
        status: "ACTIVE",
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling enrollment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
