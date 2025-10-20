import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requirePermission } from "@/lib/rbac"
import { createKPICalculator } from "@/lib/kpis/calculator"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    requirePermission(session.user.role, "report:read")

    if (!session.user.academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const recalculate = searchParams.get("recalculate") === "true"

    const targetMonth = month ? new Date(month) : new Date()
    const kpiCalculator = createKPICalculator(session.user.academyId)

    let metrics
    if (recalculate) {
      // Force recalculation (global)
      metrics = await kpiCalculator.calculateKPIs(targetMonth)
      await kpiCalculator.cacheKPIs(targetMonth, metrics)
    } else {
      // Try to get cached metrics first (global)
      metrics = await kpiCalculator.getCachedKPIs(targetMonth)
      if (!metrics) {
        metrics = await kpiCalculator.calculateKPIs(targetMonth)
        await kpiCalculator.cacheKPIs(targetMonth, metrics)
      }
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error("Error fetching KPIs:", error)
    return NextResponse.json({ error: "Error al obtener métricas" }, { status: 500 })
  }
}
