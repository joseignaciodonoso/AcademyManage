import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"

// GET /api/admin/payments/stats - Get payment statistics for financial summary
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!hasPermission(session.user.role, "payment:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") // Format: YYYY-MM

    // Build date filter
    let startDate: Date
    let endDate: Date

    if (month) {
      const [year, monthNum] = month.split("-").map(Number)
      startDate = new Date(year, monthNum - 1, 1)
      endDate = new Date(year, monthNum, 0, 23, 59, 59, 999)
    } else {
      // Current month by default
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    // Get paid payments for the period
    const payments = await prisma.payment.findMany({
      where: {
        academyId,
        status: "PAID",
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true,
        paidAt: true
      }
    })

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)
    const count = payments.length

    // Get previous period for comparison
    const prevStartDate = new Date(startDate)
    prevStartDate.setMonth(prevStartDate.getMonth() - 1)
    const prevEndDate = new Date(endDate)
    prevEndDate.setMonth(prevEndDate.getMonth() - 1)

    const prevPayments = await prisma.payment.findMany({
      where: {
        academyId,
        status: "PAID",
        paidAt: {
          gte: prevStartDate,
          lte: prevEndDate
        }
      },
      select: {
        amount: true
      }
    })

    const prevTotalIncome = prevPayments.reduce((sum, p) => sum + p.amount, 0)
    const growthRate = prevTotalIncome > 0 
      ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 
      : totalIncome > 0 ? 100 : 0

    // Monthly breakdown (last 6 months)
    const monthlyIncome: { month: number; monthName: string; total: number; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(startDate)
      mStart.setMonth(mStart.getMonth() - i)
      mStart.setDate(1)
      const mEnd = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0, 23, 59, 59, 999)

      const mPayments = await prisma.payment.findMany({
        where: {
          academyId,
          status: "PAID",
          paidAt: { gte: mStart, lte: mEnd }
        },
        select: { amount: true }
      })

      monthlyIncome.push({
        month: mStart.getMonth() + 1,
        monthName: mStart.toLocaleDateString("es-CL", { month: "long" }),
        total: mPayments.reduce((s, p) => s + p.amount, 0),
        count: mPayments.length
      })
    }

    return NextResponse.json({
      totalIncome,
      count,
      growthRate,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      monthlyIncome
    })
  } catch (error) {
    console.error("Error fetching payment stats:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
