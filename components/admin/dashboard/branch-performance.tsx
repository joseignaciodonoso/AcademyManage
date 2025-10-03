"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { KPIMetrics } from "@/lib/kpis/calculator"

interface BranchPerformanceProps {
  branchPerformance: KPIMetrics["branchPerformance"]
}

export function BranchPerformance({ branchPerformance }: BranchPerformanceProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const maxStudents = Math.max(...branchPerformance.map((b) => b.students))
  const maxRevenue = Math.max(...branchPerformance.map((b) => b.revenue))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por Sede</CardTitle>
        <CardDescription>Comparación de alumnos e ingresos por sede</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {branchPerformance.map((branch, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{branch.branchName}</h4>
                <div className="flex gap-2">
                  <Badge variant="secondary">{branch.students} alumnos</Badge>
                  <Badge variant="outline">{formatCurrency(branch.revenue)}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Alumnos</span>
                  <span>
                    {branch.students} / {maxStudents}
                  </span>
                </div>
                <Progress value={maxStudents > 0 ? (branch.students / maxStudents) * 100 : 0} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Ingresos</span>
                  <span>{formatCurrency(branch.revenue)}</span>
                </div>
                <Progress value={maxRevenue > 0 ? (branch.revenue / maxRevenue) * 100 : 0} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
