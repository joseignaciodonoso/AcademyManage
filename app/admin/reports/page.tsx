"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import { RefreshCw, TrendingUp, Users, DollarSign, Activity, AlertTriangle } from "lucide-react"

// Shape returned by /api/admin/kpis
interface KPIMetrics {
  mrr: number
  arpu: number
  churnRate: number
  ltv: number
  totalRevenue: number
  failedPayments: number
  recoveredPayments: number
  activeStudents: number
  newStudents: number
  totalStudents: number
  studentsAtRisk: number
  averageAttendance: number
  classOccupancyRate: number
  popularClasses: Array<{ name: string; count: number }>
  branchPerformance: Array<{ branchName: string; students: number; revenue: number }>
  growthRate: number
  retentionRate: number
}

export default function ReportsPage() {
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7))
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [recalcLoading, setRecalcLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [branchId, setBranchId] = useState<string>("ALL")
  const [loadingBranches, setLoadingBranches] = useState<boolean>(true)

  const fetchKPIs = async (opts?: { recalculate?: boolean }) => {
    try {
      const params = new URLSearchParams()
      if (month) params.set("month", `${month}-01`)
      if (opts?.recalculate) params.set("recalculate", "true")
      if (branchId && branchId !== "ALL") params.set("branchId", branchId)
      const res = await fetch(`/api/admin/kpis?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.metrics)
      }
    } catch (e) {
      console.error("Error fetching KPIs", e)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchKPIs().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, branchId])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingBranches(true)
        const res = await fetch("/api/admin/branches")
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.branches)) setBranches(data.branches)
        }
      } catch (e) {
        console.error("Error loading branches", e)
      } finally {
        setLoadingBranches(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const formatCLP = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n || 0)
  const formatPct = (n: number) => `${(n || 0).toFixed(1)}%`

  const popularData = useMemo(() => metrics?.popularClasses || [], [metrics])
  const branchData = useMemo(() => {
    if (!metrics?.branchPerformance || !Array.isArray(metrics.branchPerformance)) {
      return []
    }
    return metrics.branchPerformance.map(b => ({ name: b.branchName, students: b.students, revenue: b.revenue }))
  }, [metrics])

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-blue-500 rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float" />
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
            <p className="text-gray-400">KPIs financieros, estudiantes y operación por mes</p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white"
            />
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-56 bg-gray-800/50 border-gray-700 text-white">
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="ALL">Todas las sedes</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={async () => {
                setRecalcLoading(true)
                await fetchKPIs({ recalculate: true })
                setRecalcLoading(false)
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${recalcLoading ? "animate-spin" : ""}`} />
              {recalcLoading ? "Recalculando..." : "Recalcular"}
            </Button>
          </div>
        </header>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : !metrics ? (
          <div className="rounded-2xl border border-gray-700/50 bg-gray-800/30 p-8 text-center text-gray-400">
            No hay datos para el período seleccionado.
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden">
                <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-green-500 to-emerald-600 p-4">
                  <CardTitle className="text-sm font-medium text-white/90">MRR</CardTitle>
                  <DollarSign className="h-5 w-5 text-white/80" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-white">{formatCLP(metrics.mrr)}</div>
                  <p className="text-xs text-gray-400 mt-1">Monthly Recurring Revenue</p>
                </CardContent>
              </Card>

              <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden">
                <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-purple-500 to-violet-600 p-4">
                  <CardTitle className="text-sm font-medium text-white/90">ARPU</CardTitle>
                  <TrendingUp className="h-5 w-5 text-white/80" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-white">{formatCLP(metrics.arpu)}</div>
                  <p className="text-xs text-gray-400 mt-1">Ingreso promedio por usuario</p>
                </CardContent>
              </Card>

              <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden">
                <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-amber-500 to-orange-600 p-4">
                  <CardTitle className="text-sm font-medium text-white/90">Churn</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-white/80" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-white">{formatPct(metrics.churnRate)}</div>
                  <p className="text-xs text-gray-400 mt-1">Tasa de cancelación mensual</p>
                </CardContent>
              </Card>

              <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden">
                <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
                  <CardTitle className="text-sm font-medium text-white/90">LTV</CardTitle>
                  <Activity className="h-5 w-5 text-white/80" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-white">{formatCLP(metrics.ltv)}</div>
                  <p className="text-xs text-gray-400 mt-1">Valor de vida del cliente</p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiMini title="Ingresos Totales" value={formatCLP(metrics.totalRevenue)} icon={<DollarSign className="h-4 w-4" />} />
              <KpiMini title="Pagos Fallidos" value={String(metrics.failedPayments)} icon={<AlertTriangle className="h-4 w-4" />} />
              <KpiMini title="Pagos Recuperados" value={String(metrics.recoveredPayments)} icon={<RefreshCw className="h-4 w-4" />} />
              <KpiMini title="Estudiantes Activos" value={String(metrics.activeStudents)} icon={<Users className="h-4 w-4" />} />
            </div>

            {/* Tabs */}
            <Card className="glass-effect rounded-2xl border-gray-700/50">
              <CardHeader>
                <CardTitle>Detalle</CardTitle>
                <CardDescription className="text-gray-400">Popularidad de clases y rendimiento por sede</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-gray-800/50 border border-gray-700">
                    <TabsTrigger value="overview">Clases populares</TabsTrigger>
                    <TabsTrigger value="branches">Rendimiento por sede</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <ChartContainer
                      config={{
                        count: {
                          label: "Clases",
                          theme: { light: "#6366f1", dark: "#6366f1" },
                        },
                      }}
                      className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-2"
                    >
                      <BarChart data={popularData} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} strokeOpacity={0.2} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </TabsContent>

                  <TabsContent value="branches" className="mt-4">
                    <ChartContainer
                      config={{
                        students: { label: "Estudiantes", theme: { light: "#22c55e", dark: "#22c55e" } },
                        revenue: { label: "Ingresos", theme: { light: "#a78bfa", dark: "#a78bfa" } },
                      }}
                      className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-2"
                    >
                      <BarChart data={branchData} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} strokeOpacity={0.2} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="students" fill="var(--color-students)" radius={4} />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function KpiMini({ title, value, icon }: { title: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-gray-700/50 bg-gray-800/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-gray-300 font-medium">{title}</CardTitle>
          {icon ? <span className="text-gray-400">{icon}</span> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  )
}
