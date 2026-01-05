import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List all modules (channels) available to the student
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    // Get modules visible to students or public
    const modules = await prisma.channel.findMany({
      where: { 
        academyId,
        visibility: {
          in: ["STUDENTS", "PUBLIC"]
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { contents: true }
        }
      }
    })

    return NextResponse.json({ modules })
  } catch (error) {
    console.error("Error fetching modules:", error)
    return NextResponse.json({ error: "Error al cargar módulos" }, { status: 500 })
  }
}
