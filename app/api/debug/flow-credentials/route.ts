import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: {
        id: true,
        name: true,
        slug: true,
        flowEnabled: true,
        flowApiKey: true,
        flowSecretKey: true,
      }
    })

    if (!academy) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      academyId: academy.id,
      academyName: academy.name,
      academySlug: academy.slug,
      flowEnabled: academy.flowEnabled,
      flowApiKey: academy.flowApiKey || "NOT SET",
      flowApiKeyLength: academy.flowApiKey?.length || 0,
      flowSecretKeySet: !!academy.flowSecretKey,
      flowSecretKeyLength: academy.flowSecretKey?.length || 0,
      // Validate API key format (should be UUID-like)
      apiKeyFormat: academy.flowApiKey ? 
        (/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/i.test(academy.flowApiKey) ? "VALID UUID" : "INVALID FORMAT") 
        : "NOT SET",
    })
  } catch (error) {
    console.error("Error fetching Flow credentials:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
