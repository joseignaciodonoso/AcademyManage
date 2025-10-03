"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, AlertTriangle } from "lucide-react"
import type { KPIMetrics } from "@/lib/kpis/calculator"

interface KPICardsProps {
  metrics: KPIMetrics
  previousMetrics?: KPIMetrics
}

export function KPICards({ metrics, previousMetrics }: KPICardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTrend = (current: number, previous?: number) => {
    if (!previous) return null
    const change = ((current - previous) / previous) * 100
    return {
      value: change,
      isPositive: change > 0,
      isNegative: change < 0,
    }
  }

  const TrendIndicator = ({ trend }: { trend: { value: number; isPositive: boolean; isNegative: boolean } | null }) => {
    if (!trend) return null

    return (
      <div
        className={`flex items-center gap-1 text-sm ${
          trend.isPositive ? "text-green-600" : trend.isNegative ? "text-red-600" : "text-muted-foreground"
        }`}
      >
        {trend.isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : trend.isNegative ? (
          <TrendingDown className="h-3 w-3" />
        ) : null}
        <span>{Math.abs(trend.value).toFixed(1)}%</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* MRR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">MRR</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Ingresos recurrentes mensuales</p>
            <TrendIndicator trend={getTrend(metrics.mrr, previousMetrics?.mrr)} />
          </div>
        </CardContent>
      </Card>

      {/* Active Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alumnos Activos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeStudents}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">+{metrics.newStudents} nuevos este mes</p>
            <TrendIndicator trend={getTrend(metrics.activeStudents, previousMetrics?.activeStudents)} />
          </div>
        </CardContent>
      </Card>

      {/* Average Attendance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(metrics.averageAttendance)}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Ocupación: {formatPercentage(metrics.classOccupancyRate)}</p>
            <TrendIndicator trend={getTrend(metrics.averageAttendance, previousMetrics?.averageAttendance)} />
          </div>
        </CardContent>
      </Card>

      {/* Students at Risk */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alumnos en Riesgo</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.studentsAtRisk}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Baja asistencia reciente</p>
            {metrics.studentsAtRisk > 0 && (
              <Badge variant="destructive" className="text-xs">
                Atención
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ARPU */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARPU</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.arpu)}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Ingreso promedio por usuario</p>
            <TrendIndicator trend={getTrend(metrics.arpu, previousMetrics?.arpu)} />
          </div>
        </CardContent>
      </Card>

      {/* Churn Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Abandono</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(metrics.churnRate)}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Retención: {formatPercentage(metrics.retentionRate)}</p>
            <TrendIndicator trend={getTrend(metrics.churnRate, previousMetrics?.churnRate)} />
          </div>
        </CardContent>
      </Card>

      {/* LTV */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">LTV</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.ltv)}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Valor de vida del cliente</p>
            <TrendIndicator trend={getTrend(metrics.ltv, previousMetrics?.ltv)} />
          </div>
        </CardContent>
      </Card>

      {/* Growth Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(metrics.growthRate)}</div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Crecimiento mensual</p>
            {metrics.growthRate > 0 ? (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                Creciendo
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Estable
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
