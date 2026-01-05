import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Create new content
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
    const { title, description, type, fileUrl, channelId, duration, thumbnailUrl } = data

    if (!title?.trim()) {
      return NextResponse.json({ error: "El título es requerido" }, { status: 400 })
    }

    if (!fileUrl?.trim()) {
      return NextResponse.json({ error: "La URL es requerida" }, { status: 400 })
    }

    if (!channelId) {
      return NextResponse.json({ error: "El módulo es requerido" }, { status: 400 })
    }

    // Verify channel belongs to academy
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, academyId }
    })

    if (!channel) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 })
    }

    // Generate thumbnail for YouTube videos
    let finalThumbnail = thumbnailUrl
    if (type === "YOUTUBE" && !thumbnailUrl) {
      const youtubeId = extractYouTubeId(fileUrl)
      if (youtubeId) {
        finalThumbnail = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
      }
    }

    const content = await prisma.content.create({
      data: {
        academyId,
        channelId,
        title: title.trim(),
        description: description?.trim() || null,
        type: type || "YOUTUBE",
        fileUrl: fileUrl.trim(),
        thumbnailUrl: finalThumbnail,
        duration: duration ? parseInt(duration) : null,
        visibility: "PLAN_RESTRICTED"
      }
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error creating content:", error)
    return NextResponse.json({ error: "Error al crear contenido" }, { status: 500 })
  }
}

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}
