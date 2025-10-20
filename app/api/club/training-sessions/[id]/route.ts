import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/club/training-sessions/[id] - Get training session details
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

    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: params.id,
        academyId: user.academyId,
      },
      include: {
        attendance: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ session: trainingSession }, { status: 200 })
  } catch (error) {
    console.error("Error fetching training session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/club/training-sessions/[id] - Delete training session
export async function DELETE(
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

    // Only ADMIN and COACH can delete
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify ownership
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: params.id,
        academyId: user.academyId,
      },
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    // Delete (cascade will handle attendance records)
    await prisma.trainingSession.delete({
      where: { id: params.id },
    })

    console.log(`✅ Training session deleted: ${params.id}`)

    return NextResponse.json(
      { message: "Training session deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting training session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/club/training-sessions/[id] - Update training session
export async function PATCH(
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

    // Only ADMIN and COACH can update
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify ownership
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: params.id,
        academyId: user.academyId,
      },
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Update
    const updated = await prisma.trainingSession.update({
      where: { id: params.id },
      data: {
        ...(body.date && { date: new Date(body.date) }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.focus !== undefined && { focus: body.focus }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status !== undefined && { status: body.status }),
      },
    })

    console.log(`✅ Training session updated: ${params.id}`)

    return NextResponse.json(
      { 
        message: "Training session updated successfully",
        session: updated,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating training session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
