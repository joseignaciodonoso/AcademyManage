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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.academyId) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 })
    }

    // Get all members (students and coaches)
    // Note: playerProfile will be queried separately for now
    const members = await prisma.user.findMany({
      where: {
        academyId: user.academyId,
        role: {
          in: ["STUDENT", "COACH"],
        },
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
    })

    // Get player profiles for all members
    const memberIds = members.map((m: any) => m.id)
    const profiles = await (prisma as any).playerProfile.findMany({
      where: {
        userId: {
          in: memberIds,
        },
      },
    })

    // Merge profiles with members
    const membersWithProfiles = members.map((member: any) => ({
      ...member,
      playerProfile: profiles.find((p: any) => p.userId === member.id) || null,
    }))

    return NextResponse.json({ members: membersWithProfiles }, { status: 200 })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
