import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = (session.user as any).academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    // Get academy info to determine primary sport
    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: {
        id: true,
        name: true,
        discipline: true,
      }
    })

    if (!academy) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    // Map discipline to sport type
    let primarySport: "FOOTBALL" | "BASKETBALL" = "FOOTBALL"
    
    if (academy.discipline) {
      const discipline = academy.discipline.toLowerCase()
      if (discipline.includes("basquet") || discipline.includes("basketball")) {
        primarySport = "BASKETBALL"
      } else if (discipline.includes("futbol") || discipline.includes("football") || discipline.includes("soccer")) {
        primarySport = "FOOTBALL"
      }
      // Add more mappings as needed
    }

    return NextResponse.json({
      id: academy.id,
      name: academy.name,
      discipline: academy.discipline,
      primarySport,
    })

  } catch (error) {
    console.error("Error fetching club info:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
