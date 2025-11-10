import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/bank-accounts/stats - Obtener estadísticas de pagos por cuenta bancaria
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = (session.user as any).academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academy ID no encontrado" }, { status: 400 })
    }

    // Verificar permisos
    const userRole = session.user.role
    if (!["SUPER_ADMIN", "ACADEMY_ADMIN", "FINANCE"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Construir filtros de fecha
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    // Obtener todas las cuentas activas
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        academyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        bank: true,
        accountType: true,
      },
    })

    // Obtener estadísticas de pagos por cuenta
    const stats = await Promise.all(
      bankAccounts.map(async (account) => {
        const payments = await prisma.payment.findMany({
          where: {
            academyId,
            bankAccountId: account.id,
            status: "PAID",
            ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
          },
          select: {
            amount: true,
            currency: true,
            paidAt: true,
          },
        })

        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
        const count = payments.length

        // Agrupar por mes
        const monthlyStats = payments.reduce((acc, payment) => {
          if (!payment.paidAt) return acc
          const monthKey = `${payment.paidAt.getFullYear()}-${String(payment.paidAt.getMonth() + 1).padStart(2, "0")}`
          if (!acc[monthKey]) {
            acc[monthKey] = { month: monthKey, amount: 0, count: 0 }
          }
          acc[monthKey].amount += payment.amount
          acc[monthKey].count += 1
          return acc
        }, {} as Record<string, { month: string; amount: number; count: number }>)

        return {
          ...account,
          totalAmount,
          count,
          monthlyStats: Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month)),
        }
      })
    )

    // Estadísticas generales
    const totalPayments = stats.reduce((sum, s) => sum + s.totalAmount, 0)
    const totalCount = stats.reduce((sum, s) => sum + s.count, 0)

    // Pagos sin cuenta asignada
    const paymentsWithoutAccount = await prisma.payment.aggregate({
      where: {
        academyId,
        bankAccountId: null,
        status: "PAID",
        ...(Object.keys(dateFilter).length > 0 && { paidAt: dateFilter }),
      },
      _sum: { amount: true },
      _count: { _all: true },
    })

    return NextResponse.json({
      stats,
      summary: {
        totalPayments,
        totalCount,
        paymentsWithoutAccount: {
          amount: paymentsWithoutAccount._sum.amount || 0,
          count: paymentsWithoutAccount._count._all || 0,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching bank account stats:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
