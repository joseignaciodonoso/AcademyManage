import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-simple"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!hasPermission(session.user.role, "plan:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const [totalPlans, activePlans, avgPriceAgg, revenueAgg] = await Promise.all([
      prisma.plan.count({ where: { academyId } }),
      prisma.plan.count({ where: { academyId, status: "ACTIVE" } }),
      prisma.plan.aggregate({ where: { academyId }, _avg: { price: true } }),
      prisma.payment.aggregate({ where: { academyId, status: "PAID" }, _sum: { amount: true } }),
    ])

    return NextResponse.json({
      totalPlans,
      activePlans,
      totalRevenue: revenueAgg._sum.amount || 0,
      averagePrice: avgPriceAgg._avg.price || 0,
    })
  } catch (error) {
    console.error("Error fetching plan metrics:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
