import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get module with its contents for student view
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    const module = await prisma.channel.findFirst({
      where: { 
        id: params.id,
        academyId,
        visibility: {
          in: ["STUDENTS", "PUBLIC"]
        }
      },
      include: {
        contents: {
          where: {
            visibility: {
              in: ["PUBLIC", "PLAN_RESTRICTED"]
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: { contents: true }
        }
      }
    })

    if (!module) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ module })
  } catch (error) {
    console.error("Error fetching module:", error)
    return NextResponse.json({ error: "Error al cargar módulo" }, { status: 500 })
  }
}
