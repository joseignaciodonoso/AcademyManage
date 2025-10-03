import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requirePermission } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    requirePermission(session.user.role, "payment:read")

    // Get user's payments
    const payments = await prisma.payment.findMany({
      where: {
        membership: {
          userId: session.user.id,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50 payments
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Error fetching student payments:", error)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}
