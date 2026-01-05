import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - Update content
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

    // Verify content belongs to academy
    const existing = await prisma.content.findFirst({
      where: { id: params.id, academyId }
    })

    if (!existing) {
      return NextResponse.json({ error: "Contenido no encontrado" }, { status: 404 })
    }

    const data = await request.json()
    const { title, description, type, fileUrl, duration, thumbnailUrl } = data

    if (!title?.trim()) {
      return NextResponse.json({ error: "El título es requerido" }, { status: 400 })
    }

    if (!fileUrl?.trim()) {
      return NextResponse.json({ error: "La URL es requerida" }, { status: 400 })
    }

    // Generate thumbnail for YouTube videos
    let finalThumbnail = thumbnailUrl
    if (type === "YOUTUBE" && !thumbnailUrl) {
      const youtubeId = extractYouTubeId(fileUrl)
      if (youtubeId) {
        finalThumbnail = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
      }
    }

    const content = await prisma.content.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type: type || existing.type,
        fileUrl: fileUrl.trim(),
        thumbnailUrl: finalThumbnail,
        duration: duration ? parseInt(duration) : null
      }
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error updating content:", error)
    return NextResponse.json({ error: "Error al actualizar contenido" }, { status: 500 })
  }
}

// DELETE - Delete content
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

    // Verify content belongs to academy
    const existing = await prisma.content.findFirst({
      where: { id: params.id, academyId }
    })

    if (!existing) {
      return NextResponse.json({ error: "Contenido no encontrado" }, { status: 404 })
    }

    await prisma.content.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting content:", error)
    return NextResponse.json({ error: "Error al eliminar contenido" }, { status: 500 })
  }
}

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}
