"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Book,
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  ShieldCheck,
  FileText,
  Clock,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Target,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

type DashboardMetrics = {
  totalStudents: number
  activeStudents: number
  newStudentsThisMonth: number
  activeMemberships: number
  revenueTotal: number
  revenueMTD: number
  revenueLastMonth: number
  arpuMTD: number
  revenueTrend: { month: string; revenue: number }[]
  recentPayments: { id: string; amount: number; currency: string; paidAt?: string; userName?: string; planName?: string }[]
  planDistribution: { planId: string; name: string; count: number }[]
  studentsTrend: { month: string; signups: number; starts: number; ends: number }[]
  pendingPayments: number
  pendingAmountMTD: number
  // New expense and profit metrics
  expensesMTD: number
  expensesLastMonth: number
  expensesCountThisMonth: number
  actualProfitMTD: number
  projectedRevenueMTD: number
  projectedProfitMTD: number
  expensesTrend: { month: string; expenses: number }[]
  profitTrend: { month: string; revenue: number; expenses: number; profit: number }[]
}

function formatCurrency(amount: number, currency = "CLP") {
  try {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(0)}`
  }
}

const quickActions = [
  { label: 'Nuevo Alumno', icon: Users, color: 'text-blue-500' },
  { label: 'Registrar Pago', icon: DollarSign, color: 'text-green-500' },
  { label: 'Agendar Clase', icon: Calendar, color: 'text-amber-500' },
  { label: 'Ver Reportes', icon: BarChart3, color: 'text-indigo-500' },
];

const activityFeed = [
  { user: 'Juan Pérez', action: 'se inscribió al plan anual.', time: 'hace 5m', icon: Users, color: 'text-green-500' },
  { user: 'Clase de Karate (Avanzado)', action: 'ha comenzado.', time: 'hace 10m', icon: ShieldCheck, color: 'text-blue-500' },
  { user: 'Factura #1034', action: 'fue pagada por María Rojas.', time: 'hace 1h', icon: FileText, color: 'text-emerald-500' },
  { user: 'Nuevo contenido', action: '"Técnicas de Poomsae" publicado.', time: 'hace 3h', icon: Book, color: 'text-purple-500' },
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/dashboard/metrics")
        if (!res.ok) throw new Error("No se pudieron cargar las métricas")
        const data = await res.json()
        setMetrics(data)
      } catch (e: any) {
        console.error("Error loading dashboard metrics", e)
        setError(e?.message || "Error al cargar métricas")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const kpiCardData = metrics ? [
    {
      title: 'Ingresos del Mes (MTD)',
      value: formatCurrency(metrics.revenueMTD, 'CLP'),
      change: metrics.revenueLastMonth > 0
        ? `${(((metrics.revenueMTD - metrics.revenueLastMonth) / metrics.revenueLastMonth) * 100).toFixed(1)}% vs mes anterior`
        : '—',
      icon: DollarSign,
      color: 'from-blue-500 to-indigo-600',
      progress: Math.min(100, Math.round((metrics.revenueMTD / Math.max(1, metrics.revenueLastMonth || metrics.revenueMTD)) * 80)),
    },
    {
      title: 'Gastos del Mes (MTD)',
      value: formatCurrency(metrics.expensesMTD, 'CLP'),
      change: metrics.expensesLastMonth > 0
        ? `${(((metrics.expensesMTD - metrics.expensesLastMonth) / Math.max(1, metrics.expensesLastMonth)) * 100).toFixed(1)}% vs mes anterior`
        : '—',
      icon: TrendingDown,
      color: 'from-red-500 to-pink-600',
      progress: Math.min(100, Math.round((metrics.expensesMTD / Math.max(1, metrics.expensesLastMonth || metrics.expensesMTD)) * 80)),
    },
    {
      title: 'Ganancia Efectiva (MTD)',
      value: formatCurrency(metrics.actualProfitMTD, 'CLP'),
      change: metrics.actualProfitMTD >= 0 ? 'Utilidad del mes' : 'Pérdida del mes',
      icon: metrics.actualProfitMTD >= 0 ? TrendingUp : TrendingDown,
      color: metrics.actualProfitMTD >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-orange-600',
      progress: Math.min(100, Math.max(0, Math.round((metrics.actualProfitMTD / Math.max(1, metrics.revenueMTD)) * 100))),
    },
    {
      title: 'Ganancia Proyectada (MTD)',
      value: formatCurrency(metrics.projectedProfitMTD, 'CLP'),
      change: 'Incluye pagos pendientes',
      icon: Target,
      color: metrics.projectedProfitMTD >= 0 ? 'from-purple-500 to-indigo-600' : 'from-orange-500 to-red-600',
      progress: Math.min(100, Math.max(0, Math.round((metrics.projectedProfitMTD / Math.max(1, metrics.projectedRevenueMTD)) * 100))),
    },
    {
      title: 'Pagos Pendientes (mes)',
      value: metrics.pendingPayments,
      change: 'Cantidad por cobrar',
      icon: Clock,
      color: 'from-amber-500 to-yellow-600',
      progress: 0,
    },
    {
      title: 'Monto Pendiente (mes)',
      value: formatCurrency(metrics.pendingAmountMTD, 'CLP'),
      change: 'Total por cobrar',
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
      progress: 0,
    },
    {
      title: 'Alumnos Activos',
      value: metrics.activeStudents,
      change: `+${metrics.newStudentsThisMonth} nuevos este mes`,
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      progress: Math.min(100, Math.round((metrics.activeStudents / Math.max(1, metrics.totalStudents)) * 100)),
    },
    {
      title: 'ARPU del Mes',
      value: formatCurrency(metrics.arpuMTD, 'CLP'),
      change: 'Ingreso promedio por alumno (MTD)',
      icon: Activity,
      color: 'from-purple-500 to-fuchsia-600',
      progress: Math.min(100, Math.round((metrics.arpuMTD / Math.max(1, metrics.revenueMTD || 1)) * 100)),
    },
  ] : []

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-[hsl(var(--primary,210_90%_56%))] rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-[hsl(var(--accent,262_83%_58%))] rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>

      <div className="relative z-10">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de la Academia</h1>
            <p className="text-gray-400">Resumen del rendimiento y actividad reciente.</p>
          </div>
          <Button className="font-semibold transition-all duration-300 transform hover:scale-105">
            Generar Reporte
          </Button>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading && (
            <div className="text-gray-400">Cargando métricas...</div>
          )}
          {error && (
            <div className="text-red-400">{error}</div>
          )}
          {!loading && !error && kpiCardData.map((kpi, index) => (
            <Card key={index} className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br ${kpi.color} p-4`}>
                <CardTitle className="text-sm font-medium text-white/90">{kpi.title}</CardTitle>
                <kpi.icon className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-3xl font-bold text-white">{kpi.value}</div>
                <p className="text-xs text-gray-400 mt-1">{kpi.change}</p>
                <Progress value={kpi.progress} className="mt-4 h-2 bg-gray-700/50" indicatorClassName={`bg-gradient-to-r ${kpi.color}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Evolution Chart */}
            <Card className="glass-effect rounded-2xl border-gray-700/50">
              <CardHeader>
                <CardTitle>Evolución de Ingresos</CardTitle>
                <CardDescription>Ingresos (Últimos 6 meses)</CardDescription>
              </CardHeader>
              <CardContent className="h-64 sm:h-72 lg:h-80">
                {!metrics || metrics.revenueTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">Sin datos para mostrar</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.revenueTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, stroke: '#a78bfa', strokeWidth: 1 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Profit Evolution Chart */}
            <Card className="glass-effect rounded-2xl border-gray-700/50">
              <CardHeader>
                <CardTitle>Evolución de Ganancias</CardTitle>
                <CardDescription>Ingresos vs Gastos vs Ganancia (Últimos 6 meses)</CardDescription>
              </CardHeader>
              <CardContent className="h-64 sm:h-72 lg:h-80">
                {!metrics || metrics.profitTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">Sin datos para mostrar</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.profitTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="expenses" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="profit" name="Ganancia" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, stroke: '#a78bfa', strokeWidth: 1 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="glass-effect rounded-2xl border-gray-700/50">
              <CardHeader>
                <CardTitle>Evolución de Inscritos</CardTitle>
                <CardDescription>Altas, activaciones y bajas (últimos 6 meses)</CardDescription>
              </CardHeader>
              <CardContent className="h-64 sm:h-72 lg:h-80">
                {!metrics || metrics.studentsTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">Sin datos para mostrar</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(metrics.studentsTrend || []).map(t => ({ ...t, net: (t.starts || 0) - (t.ends || 0) }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                      <Legend />
                      <Line type="monotone" dataKey="signups" name="Altas (usuarios)" stroke="#60a5fa" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="starts" name="Activaciones (membresías)" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ends" name="Bajas (membresías)" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="net" name="Neto (starts - ends)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="glass-effect rounded-2xl border-gray-700/50">
              <CardHeader>
                <CardTitle>Distribución por Plan</CardTitle>
                <CardDescription>Membresías activas por plan</CardDescription>
              </CardHeader>
              <CardContent className="h-64 sm:h-72 lg:h-80">
                {!metrics || metrics.planDistribution.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">Sin datos para mostrar</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie dataKey="count" nameKey="name" data={metrics.planDistribution} cx="50%" cy="50%" outerRadius={90} fill="#8884d8" label>
                        {metrics.planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v} membresías`} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card className="glass-effect rounded-2xl border-gray-700/50">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {quickActions.map(action => (
                  <Button key={action.label} variant="outline" className="flex flex-col h-24 items-center justify-center gap-2 bg-gray-800/50 border-gray-700 hover:bg-gray-700/70 hover:border-indigo-500/50 transition-colors">
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                    <span className="text-xs font-medium text-gray-300">{action.label}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="glass-effect rounded-2xl border-gray-700/50">
              <CardHeader>
                <CardTitle>Pagos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {!metrics || metrics.recentPayments.length === 0 ? (
                  <div className="text-gray-500">Aún no hay pagos</div>
                ) : (
                  <div className="space-y-4">
                    {metrics.recentPayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between border-b border-gray-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-800/60 rounded-full p-2">
                            <DollarSign className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">{p.userName || 'Alumno'}</p>
                            <p className="text-xs text-gray-400">{p.planName || '—'} • {p.paidAt ? new Date(p.paidAt).toLocaleString('es-CL') : '—'}</p>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-white">{formatCurrency(p.amount, p.currency)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
