import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - List all modules (channels) for the academy
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ACADEMY_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    const modules = await prisma.channel.findMany({
      where: { academyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { contents: true }
        }
      }
    })

    return NextResponse.json({ 
      modules: modules.map(m => ({
        ...m,
        order: 0 // Placeholder since Channel doesn't have order field
      }))
    })
  } catch (error) {
    console.error("Error fetching modules:", error)
    return NextResponse.json({ error: "Error al cargar módulos" }, { status: 500 })
  }
}

// POST - Create a new module (channel)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ACADEMY_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    const data = await request.json()
    const { name, description, visibility } = data

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + Date.now().toString(36)

    const module = await prisma.channel.create({
      data: {
        academyId,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        visibility: visibility || "STUDENTS"
      },
      include: {
        _count: {
          select: { contents: true }
        }
      }
    })

    return NextResponse.json({ module })
  } catch (error) {
    console.error("Error creating module:", error)
    return NextResponse.json({ error: "Error al crear módulo" }, { status: 500 })
  }
}
