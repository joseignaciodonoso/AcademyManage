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
    const discipline = searchParams.get("discipline")

    const where: any = {}

    if (discipline) {
      where.discipline = discipline
    }

    // Filter by user's academy
    if (session.user.role !== "SUPER_ADMIN") {
      where.academyId = session.user.academyId
    }

    const curricula = await prisma.curriculum.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(curricula)
  } catch (error) {
    console.error("Error fetching curricula:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { discipline, name, description, levels } = body

    const curriculum = await prisma.curriculum.create({
      data: {
        discipline,
        name,
        description,
        academyId: session.user.academyId,
        levels: {
          create: levels.map((level: any, index: number) => ({
            name: level.name,
            description: level.description,
            color: level.color,
            order: index,
            items: {
              create: level.items.map((item: any, itemIndex: number) => ({
                title: item.title,
                description: item.description,
                type: item.type.toUpperCase(),
                duration: item.duration,
                content: item.content,
                videoUrl: item.videoUrl,
                isRequired: item.isRequired,
                order: itemIndex,
                prerequisites: item.prerequisites || [],
              })),
            },
          })),
        },
      },
      include: {
        levels: {
          include: {
            items: true,
          },
        },
      },
    })

    return NextResponse.json(curriculum)
  } catch (error) {
    console.error("Error creating curriculum:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
