import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const academyId = session.user.academyId
    if (!academyId && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Missing academy" }, { status: 400 })
    }

    // Optionally allow SUPER_ADMIN to pass academyId param
    const { searchParams } = new URL(req.url)
    const requestedAcademyId = searchParams.get("academyId") || academyId || undefined

    const channels = await prisma.channel.findMany({
      where: requestedAcademyId ? { academyId: requestedAcademyId } : undefined,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ channels })
  } catch (e) {
    console.error("GET /admin/channels error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!["SUPER_ADMIN", "ACADEMY_ADMIN"].includes(String(session.user.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const academyId = session.user.academyId
    const body = await req.json()
    const { name, slug, visibility = "PUBLIC", description } = body || {}

    if (!name || !slug) return NextResponse.json({ error: "Missing name or slug" }, { status: 400 })
    if (!academyId && session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Missing academy" }, { status: 400 })

    const channel = await prisma.channel.create({
      data: {
        academyId: academyId || body.academyId, // allow SUPER_ADMIN to specify
        name,
        slug,
        visibility,
        description,
      },
    })

    return NextResponse.json(channel, { status: 201 })
  } catch (e: any) {
    console.error("POST /admin/channels error", e)
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Slug ya existe para esta academia" }, { status: 409 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
