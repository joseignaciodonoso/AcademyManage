import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/academies/current - Get current user's academy
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        academy: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            sport: true,
          }
        }
      },
    })

    if (!user?.academy) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 })
    }

    return NextResponse.json({ academy: user.academy }, { status: 200 })
  } catch (error) {
    console.error("Error fetching current academy:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
