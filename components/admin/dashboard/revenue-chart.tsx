"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface RevenueChartProps {
  data: Array<{
    month: string
    mrr: number
    totalRevenue: number
    newStudents: number
  }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* MRR Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución MRR</CardTitle>
          <CardDescription>Ingresos recurrentes mensuales en los últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => [formatCurrency(value as number), "MRR"]} />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue vs New Students */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Nuevos Alumnos</CardTitle>
          <CardDescription>Correlación entre ingresos totales y adquisición de alumnos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="revenue" orientation="left" tickFormatter={formatCurrency} />
              <YAxis yAxisId="students" orientation="right" />
              <Tooltip
                formatter={(value, name) => [
                  name === "totalRevenue" ? formatCurrency(value as number) : value,
                  name === "totalRevenue" ? "Ingresos" : "Nuevos Alumnos",
                ]}
              />
              <Bar yAxisId="revenue" dataKey="totalRevenue" fill="hsl(var(--primary))" opacity={0.8} />
              <Bar yAxisId="students" dataKey="newStudents" fill="hsl(var(--secondary))" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
