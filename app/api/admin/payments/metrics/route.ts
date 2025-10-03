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
    if (!hasPermission(session.user.role, "payment:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }
    if (!session.user.academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const academyId = session.user.academyId

    const [paidSumAgg, totalCount, successCount, failedCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { academyId, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { academyId } }),
      prisma.payment.count({ where: { academyId, status: "PAID" } }),
      prisma.payment.count({ where: { academyId, status: "FAILED" } }),
    ])

    const totalRevenue = paidSumAgg._sum.amount || 0
    const averageTransaction = totalCount > 0 ? totalRevenue / totalCount : 0

    // Simple monthly growth placeholder: compare last 30 days with previous 30 days
    const now = new Date()
    const start30 = new Date(now)
    start30.setDate(start30.getDate() - 30)
    const prevStart30 = new Date(now)
    prevStart30.setDate(prevStart30.getDate() - 60)

    const [last30, prev30] = await Promise.all([
      prisma.payment.aggregate({
        where: { academyId, status: "PAID", paidAt: { gte: start30 } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          academyId,
          status: "PAID",
          paidAt: { gte: prevStart30, lt: start30 },
        },
        _sum: { amount: true },
      }),
    ])

    const last = last30._sum.amount || 0
    const prev = prev30._sum.amount || 0
    const monthlyGrowth = prev > 0 ? ((last - prev) / prev) * 100 : 0

    return NextResponse.json({
      totalRevenue,
      totalTransactions: totalCount,
      successfulPayments: successCount,
      failedPayments: failedCount,
      averageTransaction,
      monthlyGrowth,
    })
  } catch (error) {
    console.error("Error fetching payment metrics:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
