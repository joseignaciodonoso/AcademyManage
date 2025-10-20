import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
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

    // Define current month window [startOfMonth, startOfNextMonth)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // KPIs restricted to current month
    const [paidSumAgg, totalCount, successCount, failedCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { academyId, status: "PAID", paidAt: { gte: startOfMonth, lt: startOfNextMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { academyId, createdAt: { gte: startOfMonth, lt: startOfNextMonth } } }),
      prisma.payment.count({ where: { academyId, status: "PAID", paidAt: { gte: startOfMonth, lt: startOfNextMonth } } }),
      prisma.payment.count({ where: { academyId, status: "FAILED", createdAt: { gte: startOfMonth, lt: startOfNextMonth } } }),
    ])

    const totalRevenue = paidSumAgg._sum.amount || 0
    const averageTransaction = successCount > 0 ? totalRevenue / successCount : 0

    // Monthly growth: compare current month vs previous month based on paid revenue
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfThisMonth = startOfMonth
    const startOfNext = startOfNextMonth

    const [currentMonthAgg, prevMonthAgg] = await Promise.all([
      prisma.payment.aggregate({
        where: { academyId, status: "PAID", paidAt: { gte: startOfThisMonth, lt: startOfNext } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { academyId, status: "PAID", paidAt: { gte: startOfPrevMonth, lt: startOfThisMonth } },
        _sum: { amount: true },
      }),
    ])

    const curr = currentMonthAgg._sum.amount || 0
    const prev = prevMonthAgg._sum.amount || 0
    const monthlyGrowth = prev > 0 ? ((curr - prev) / prev) * 100 : 0

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
