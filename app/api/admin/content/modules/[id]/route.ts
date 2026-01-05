import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get module with its contents
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ACADEMY_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    const module = await prisma.channel.findFirst({
      where: { 
        id: params.id,
        academyId 
      },
      include: {
        contents: {
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

// PUT - Update module
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ACADEMY_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    // Verify module belongs to academy
    const existing = await prisma.channel.findFirst({
      where: { id: params.id, academyId }
    })

    if (!existing) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 })
    }

    const data = await request.json()
    const { name, description, visibility } = data

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const module = await prisma.channel.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        visibility: visibility || existing.visibility
      },
      include: {
        _count: {
          select: { contents: true }
        }
      }
    })

    return NextResponse.json({ module })
  } catch (error) {
    console.error("Error updating module:", error)
    return NextResponse.json({ error: "Error al actualizar módulo" }, { status: 500 })
  }
}

// DELETE - Delete module and all its contents
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ACADEMY_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    // Verify module belongs to academy
    const existing = await prisma.channel.findFirst({
      where: { id: params.id, academyId }
    })

    if (!existing) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 })
    }

    // Delete all contents first
    await prisma.content.deleteMany({
      where: { channelId: params.id }
    })

    // Delete the module
    await prisma.channel.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting module:", error)
    return NextResponse.json({ error: "Error al eliminar módulo" }, { status: 500 })
  }
}
