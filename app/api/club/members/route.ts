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
    const members = await prisma.user.findMany({
      where: {
        academyId: user.academyId,
        role: {
          in: ["STUDENT", "COACH"],
        },
      },
      include: {
        playerProfile: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ members }, { status: 200 })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
