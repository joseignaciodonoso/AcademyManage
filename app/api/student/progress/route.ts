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
        technique: {
          unit: {
            module: {
              curriculum: discipline ? { discipline } : undefined,
            },
          },
        },
      },
      include: {
        technique: {
          include: {
            unit: {
              include: {
                module: {
                  include: {
                    curriculum: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Get all curricula for the discipline
    const curricula = await prisma.curriculum.findMany({
      where: {
        discipline: discipline || undefined,
        academyId: session.user.academyId,
      },
      include: {
        modules: {
          include: {
            units: {
              include: {
                techniques: {
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
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    // Combine curriculum with progress data
    const result = curricula.map((curriculum) => ({
      ...curriculum,
      modules: curriculum.modules.map((module) => ({
        ...module,
        units: module.units.map((unit) => ({
          ...unit,
          techniques: unit.techniques.map((technique) => {
            const techniqueProgress = progress.find((p) => p.techniqueId === technique.id)
            return {
              ...technique,
              completed: techniqueProgress?.completed || false,
              score: techniqueProgress?.score,
              notes: techniqueProgress?.notes,
              completedAt: techniqueProgress?.completedAt,
            }
          }),
        })),
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
    const { techniqueId, completed, score, notes } = body

    if (!techniqueId) {
      return NextResponse.json({ error: "techniqueId is required" }, { status: 400 })
    }

    const progress = await prisma.studentProgress.upsert({
      where: {
        studentId_techniqueId: {
          studentId: session.user.id,
          techniqueId,
        },
      },
      update: {
        completed,
        score,
        notes,
        completedAt: completed ? new Date() : null,
      },
      create: {
        studentId: session.user.id,
        techniqueId,
        completed,
        score,
        notes,
        completedAt: completed ? new Date() : null,
      },
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Error updating student progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
