import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/club/expenses/stats - Obtener estadísticas y KPIs de gastos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get("academyId")
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null

    if (!academyId) {
      return NextResponse.json({ error: "academyId es requerido" }, { status: 400 })
    }

    // Verificar permisos
    const userRole = session.user.role
    if (!["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    // Definir rangos de fechas
    const currentDate = new Date()
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59)
    
    let startOfPeriod = startOfYear
    let endOfPeriod = endOfYear
    
    if (month !== null) {
      startOfPeriod = new Date(year, month - 1, 1)
      endOfPeriod = new Date(year, month, 0, 23, 59, 59)
    }

    // Obtener gastos del período
    const expenses = await prisma.clubExpense.findMany({
      where: {
        academyId,
        date: {
          gte: startOfPeriod,
          lte: endOfPeriod
        }
      },
      select: {
        id: true,
        amount: true,
        category: true,
        date: true,
        concept: true
      }
    })

    // Calcular totales por categoría
    const totalByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Calcular gastos por mes (para el año completo)
    const monthlyExpenses = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(year, i, 1)
      const monthEnd = new Date(year, i + 1, 0, 23, 59, 59)
      
      const monthExpenses = expenses.filter(expense => 
        expense.date >= monthStart && expense.date <= monthEnd
      )
      
      return {
        month: i + 1,
        monthName: monthStart.toLocaleDateString('es-ES', { month: 'long' }),
        total: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        count: monthExpenses.length
      }
    })

    // Calcular KPIs
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0
    
    // Comparar con período anterior
    const previousPeriodStart = month !== null 
      ? new Date(year, month - 2, 1)
      : new Date(year - 1, 0, 1)
    const previousPeriodEnd = month !== null
      ? new Date(year, month - 1, 0, 23, 59, 59)
      : new Date(year - 1, 11, 31, 23, 59, 59)

    const previousExpenses = await prisma.clubExpense.findMany({
      where: {
        academyId,
        date: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd
        }
      },
      select: { amount: true }
    })

    const previousTotal = previousExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const growthRate = previousTotal > 0 ? ((totalExpenses - previousTotal) / previousTotal) * 100 : 0

    // Top 5 gastos más altos
    const topExpenses = expenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(exp => ({
        id: exp.id,
        concept: exp.concept,
        amount: exp.amount,
        category: exp.category,
        date: exp.date
      }))

    // Categorías con nombres legibles
    const categoryNames = {
      FIELD_RENTAL: "Arriendo de Cancha",
      EQUIPMENT: "Equipamiento",
      TRANSPORTATION: "Transporte",
      BALLS: "Balones",
      REFEREES: "Árbitros",
      INSCRIPTIONS: "Inscripciones",
      UNIFORMS: "Uniformes",
      MEDICAL: "Médico",
      OTHER: "Otros"
    }

    const categoryStats = Object.entries(totalByCategory).map(([category, total]) => ({
      category,
      categoryName: categoryNames[category as keyof typeof categoryNames] || category,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      count: expenses.filter(exp => exp.category === category).length
    })).sort((a, b) => b.total - a.total)

    return NextResponse.json({
      summary: {
        totalExpenses,
        totalCount: expenses.length,
        averageExpense,
        growthRate,
        period: month ? `${month}/${year}` : year.toString()
      },
      categoryStats,
      monthlyExpenses,
      topExpenses,
      recentExpenses: expenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
        .map(exp => ({
          id: exp.id,
          concept: exp.concept,
          amount: exp.amount,
          category: exp.category,
          categoryName: categoryNames[exp.category as keyof typeof categoryNames] || exp.category,
          date: exp.date
        }))
    })

  } catch (error) {
    console.error("Error fetching expense stats:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
