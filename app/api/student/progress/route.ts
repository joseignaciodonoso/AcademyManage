import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const discipline = searchParams.get("discipline")

    // Get student's progress
    const progress = await prisma.studentProgress.findMany({
      where: {
        studentId: session.user.id,
        curriculumItem: {
          level: {
            curriculum: discipline ? { discipline } : undefined,
          },
        },
      },
      include: {
        curriculumItem: {
          include: {
            level: {
              include: {
                curriculum: true,
              },
            },
          },
        },
      },
    })

    // Get all curriculum items for the discipline
    const curricula = await prisma.curriculum.findMany({
      where: {
        discipline: discipline || undefined,
        academyId: session.user.academyId,
      },
      include: {
        levels: {
          include: {
            items: {
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    // Combine curriculum with progress data
    const result = curricula.map((curriculum) => ({
      ...curriculum,
      levels: curriculum.levels.map((level) => ({
        ...level,
        items: level.items.map((item) => {
          const itemProgress = progress.find((p) => p.curriculumItemId === item.id)
          return {
            ...item,
            completed: itemProgress?.completed || false,
            score: itemProgress?.score,
            completedAt: itemProgress?.completedAt,
          }
        }),
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching student progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { curriculumItemId, completed, score } = body

    const progress = await prisma.studentProgress.upsert({
      where: {
        studentId_curriculumItemId: {
          studentId: session.user.id,
          curriculumItemId,
        },
      },
      update: {
        completed,
        score,
        completedAt: completed ? new Date() : null,
      },
      create: {
        studentId: session.user.id,
        curriculumItemId,
        completed,
        score,
        completedAt: completed ? new Date() : null,
      },
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Error updating student progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
