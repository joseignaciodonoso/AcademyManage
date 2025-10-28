"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Calendar,
  Target,
  AlertTriangle
} from "lucide-react"
import { ExpensesNavigation } from "@/components/club/expenses/ExpensesNavigation"

interface ExpenseStats {
  summary: {
    totalExpenses: number
    totalCount: number
    averageExpense: number
    growthRate: number
    period: string
  }
  categoryStats: Array<{
    category: string
    categoryName: string
    total: number
    percentage: number
    count: number
  }>
  monthlyExpenses: Array<{
    month: number
    monthName: string
    total: number
    count: number
  }>
  topExpenses: Array<{
    id: string
    concept: string
    amount: number
    category: string
    date: string
  }>
  recentExpenses: Array<{
    id: string
    concept: string
    amount: number
    category: string
    categoryName: string
    date: string
  }>
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
]

const EXPENSE_CATEGORIES = {
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

export default function ExpensesDashboardPage() {
  const params = useParams()
  const { data: session } = useSession()
  const orgSlug = params?.orgSlug as string

  const [stats, setStats] = useState<ExpenseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")

  const academyId = (session?.user as any)?.academyId

  useEffect(() => {
    if (academyId) {
      fetchStats()
    }
  }, [academyId, selectedYear, selectedMonth])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ 
        academyId,
        year: selectedYear,
        ...(selectedMonth !== "all" && { month: selectedMonth })
      })

      const response = await fetch(`/api/club/expenses/stats?${params}`)
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }
    } catch (err) {
      console.error("Error fetching stats:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return formatCurrency(amount)
  }

  // Preparar datos para gráficos
  const pieChartData = stats?.categoryStats.map((cat, index) => ({
    name: cat.categoryName,
    value: cat.total,
    percentage: cat.percentage,
    color: COLORS[index % COLORS.length]
  })) || []

  const monthlyChartData = stats?.monthlyExpenses.map(month => ({
    name: month.monthName.substring(0, 3),
    total: month.total,
    count: month.count
  })) || []

  if (loading) {
    return (
      <div className="min-h-screen">
        <ExpensesNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen">
        <ExpensesNavigation />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <ExpensesNavigation />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Gastos</h1>
            <p className="text-muted-foreground">Análisis y KPIs de gastos del club</p>
          </div>
          
          <div className="flex gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el año</SelectItem>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1
                  const monthName = new Date(2024, i, 1).toLocaleDateString('es-ES', { month: 'long' })
                  return (
                    <SelectItem key={month} value={month.toString()}>
                      {monthName}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.summary.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalCount} gastos en {stats.summary.period}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Gasto</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.summary.averageExpense)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gasto promedio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variación</CardTitle>
              {stats.summary.growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                stats.summary.growthRate >= 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {stats.summary.growthRate >= 0 ? '+' : ''}{stats.summary.growthRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categoría Principal</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.categoryStats[0]?.percentage.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.categoryStats[0]?.categoryName || "Sin gastos"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Expenses Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos Mensuales</CardTitle>
              <CardDescription>Evolución de gastos por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatCompactCurrency} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Total"]}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Categoría</CardTitle>
              <CardDescription>Porcentaje de gastos por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Category Stats and Top Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
              <CardDescription>Detalle de gastos por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.categoryStats.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{category.categoryName}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.count} gastos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(category.total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos Más Altos</CardTitle>
              <CardDescription>Los 5 gastos individuales más altos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topExpenses.map((expense, index) => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{expense.concept}</p>
                        <p className="text-sm text-muted-foreground">
                          {EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(expense.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos Recientes</CardTitle>
            <CardDescription>Últimos gastos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{expense.concept}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {expense.categoryName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(expense.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
