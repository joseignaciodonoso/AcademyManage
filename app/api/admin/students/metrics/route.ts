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

    // Check permissions
    if (!hasPermission(session.user.role, "students:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    // Calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Total students
    const totalStudents = await prisma.user.count({
      where: {
        academyId,
        role: "STUDENT"
      }
    })

    // Active subscriptions
    const activeSubscriptions = await prisma.membership.count({
      where: {
        academyId,
        status: "ACTIVE"
      }
    })

    // Monthly revenue (from payments this month)
    const monthlyPayments = await prisma.payment.aggregate({
      where: {
        academyId,
        status: "PAID",
        paidAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        amount: true
      }
    })

    const monthlyRevenue = monthlyPayments._sum.amount || 0

    // New students this month
    const newStudentsThisMonth = await prisma.user.count({
      where: {
        academyId,
        role: "STUDENT",
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    return NextResponse.json({
      totalStudents,
      activeSubscriptions,
      monthlyRevenue,
      newStudentsThisMonth
    })

  } catch (error) {
    console.error("Error fetching student metrics:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
