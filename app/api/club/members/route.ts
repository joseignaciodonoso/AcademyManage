import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/club/members - List club members
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 })
    }

    const members = await prisma.user.findMany({
      where: {
        academyId: user.academyId,
        role: { in: ["STUDENT", "COACH"] },
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
    })

    const memberIds = members.map((m: any) => m.id)
    const profiles = await (prisma as any).playerProfile.findMany({
      where: { userId: { in: memberIds } },
    })

    const membersWithProfiles = members.map((member: any) => ({
      ...member,
      playerProfile: profiles.find((p: any) => p.userId === member.id) || null,
    }))

    return NextResponse.json({ members: membersWithProfiles }, { status: 200 })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/club/members - Create new player
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const name = (body?.name || "").trim()
    const email = (body?.email || "").trim().toLowerCase()
    const position = (body?.position || "").trim() || undefined
    const preferredNumber = typeof body?.preferredNumber === "number" ? body.preferredNumber : undefined
    const shirtSize = (body?.shirtSize || "M").toString()

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 })
    }

    const existing = await prisma.user.findFirst({ where: { email, academyId: user.academyId } })
    if (existing) {
      return NextResponse.json({ error: "Ya existe un miembro con ese email" }, { status: 409 })
    }

    const created = await prisma.user.create({
      data: {
        academyId: user.academyId,
        name,
        email,
        role: "STUDENT",
        status: "ACTIVE",
      },
    })

    if (position || typeof preferredNumber === "number" || shirtSize) {
      await (prisma as any).playerProfile.create({
        data: {
          userId: created.id,
          position,
          preferredNumber,
          shirtSize,
        },
      })
    }

    const profile = await (prisma as any).playerProfile.findFirst({ where: { userId: created.id } })
    return NextResponse.json({ member: { ...created, playerProfile: profile || null } }, { status: 201 })
  } catch (error) {
    console.error("Error creating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
