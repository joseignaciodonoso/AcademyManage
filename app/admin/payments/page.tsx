"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Calendar,
  Copy
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface Payment {
  id: string
  amount: number
  currency: string
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELED" | "REFUNDED"
  method: string
  transactionId?: string
  paidAt?: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  membership?: {
    plan: {
      name: string
      type: string
    }
  }
  acquirerCode?: string
  proofUrl?: string
}

interface PaymentMetrics {
  totalRevenue: number
  totalTransactions: number
  successfulPayments: number
  failedPayments: number
  averageTransaction: number
  monthlyGrowth: number
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    failedPayments: 0,
    averageTransaction: 0,
    monthlyGrowth: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const inputRef = useRef<HTMLInputElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [openManual, setOpenManual] = useState(false)
  const [savingManual, setSavingManual] = useState(false)
  const [manualPayment, setManualPayment] = useState<{
    amount: string
    method: "TRANSFER" | "CASH"
    paidAt: string
  }>({ amount: "", method: "TRANSFER", paidAt: "" })
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string; email: string } | null>(null)
  const [studentsOptions, setStudentsOptions] = useState<{ 
    id: string; 
    name: string; 
    email: string; 
    hasMembership: boolean;
    membershipPlanType?: "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNLIMITED";
    membershipNextBillingDate?: string | null;
    membershipStartDate?: string | null;
    lastPaidAt?: string | null;
  }[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false)
  const [plansOptions, setPlansOptions] = useState<{ id: string; name: string; price: number; currency: string; type?: "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNLIMITED" }[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: number; currency: string; type?: "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNLIMITED" } | null>(null)
  // Edit payment dialog state
  const [openEdit, setOpenEdit] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [editPayment, setEditPayment] = useState<{
    amount: string
    currency: string
    method: "TRANSFER" | "CASH"
    status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELED" | "REFUNDED"
    paidAt: string
    transactionId: string
  }>({ amount: "", currency: "CLP", method: "TRANSFER", status: "PAID", paidAt: "", transactionId: "" })
  // Review transfer proof dialog state
  const [openReview, setOpenReview] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [selectedPaymentForReview, setSelectedPaymentForReview] = useState<Payment | null>(null)
  
  const monthsForPlanType = (type?: string) => {
    switch (type) {
      case "MONTHLY": return 1
      case "QUARTERLY": return 3
      case "YEARLY": return 12
      default: return 1
    }
  }

  const addMonths = (date: Date, months: number) => {
    const d = new Date(date)
    const day = d.getDate()
    d.setMonth(d.getMonth() + months)
    // handle month overflow (e.g., Jan 31 -> Mar 3)
    if (d.getDate() < day) d.setDate(0)
    return d
  }

  const nextPaymentInfo = useMemo(() => {
    if (!selectedStudent) return null
    const s = studentsOptions.find(o => o.id === selectedStudent.id)
    if (!s) return null
    const planType = selectedPlan?.type || s.membershipPlanType
    if (!planType || planType === "UNLIMITED") {
      return { date: null as Date | null, overdue: false, reason: "UNLIMITED" }
    }
    // Prefer explicit nextBillingDate from membership if present
    if (s.membershipNextBillingDate) {
      const next = new Date(s.membershipNextBillingDate)
      return { date: next, overdue: next.getTime() < Date.now(), reason: "NEXT_BILLING" }
    }
    const base = s.lastPaidAt ? new Date(s.lastPaidAt) : s.membershipStartDate ? new Date(s.membershipStartDate) : null
    if (!base) return { date: null as Date | null, overdue: false, reason: "NO_DATA" }
    const next = addMonths(base, monthsForPlanType(planType))
    return { date: next, overdue: next.getTime() < Date.now(), reason: s.lastPaidAt ? "LAST_PAID" : "START_DATE" }
  }, [selectedStudent, selectedPlan, studentsOptions])

  const resetManual = () => {
    setManualPayment({ amount: "", method: "TRANSFER", paidAt: "" })
    setSelectedStudent(null)
  }

  const submitManualPayment = async () => {
    try {
      if (!selectedStudent || !selectedPlan || !manualPayment.amount) {
        toast({ title: "Faltan datos", description: "Selecciona alumno, plan e ingresa el monto", variant: "destructive" })
        return
      }
      const amountNum = Number(manualPayment.amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        toast({ title: "Monto inválido", description: "Ingresa un monto numérico mayor a 0", variant: "destructive" })
        return
      }
      setSavingManual(true)
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          planId: selectedPlan.id,
          amount: amountNum,
          method: manualPayment.method,
          paidAt: manualPayment.paidAt || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo registrar el pago")
      }
      toast({ title: "Pago registrado" })
      setOpenManual(false)
      resetManual()
      fetchPayments()
      fetchMetrics()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo registrar el pago", variant: "destructive" })
    } finally {
      setSavingManual(false)
    }
  }

  const submitEditPayment = async () => {
    try {
      if (!selectedPaymentId) return
      const amt = Number(editPayment.amount)
      if (isNaN(amt) || amt <= 0) {
        toast({ title: "Monto inválido", description: "Ingresa un monto mayor a 0", variant: "destructive" })
        return
      }
      setSavingEdit(true)
      const res = await fetch(`/api/admin/payments/${selectedPaymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          currency: editPayment.currency,
          method: editPayment.method,
          status: editPayment.status,
          paidAt: editPayment.paidAt || null,
          transactionId: editPayment.transactionId || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo actualizar el pago")
      }
      toast({ title: "Pago actualizado" })
      setOpenEdit(false)
      setSelectedPaymentId(null)
      await fetchPayments()
      await fetchMetrics()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo actualizar el pago", variant: "destructive" })
    } finally {
      setSavingEdit(false)
    }
  }

  const counts = useMemo(() => {
    const acc: Record<string, number> = { ALL: payments.length, PAID: 0, PENDING: 0, FAILED: 0, CANCELED: 0, REFUNDED: 0 }
    for (const p of payments) acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, [payments])

  useEffect(() => {
    fetchPayments()
    fetchMetrics()
  }, [])

  // Load students for combobox when dialog opens
  useEffect(() => {
    const load = async () => {
      if (!openManual) return
      try {
        setStudentsLoading(true)
        const resp = await fetch("/api/admin/students")
        if (resp.ok) {
          const data = await resp.json()
          const opts = (data.students || []).map((s: any) => {
            const lastPaid = (s.payments || []).find((p: any) => p.status === "PAID")?.paidAt || null
            return {
              id: s.id,
              name: s.name || s.email,
              email: s.email,
              hasMembership: Boolean(s.membership),
              membershipPlanType: s.membership?.plan?.type || undefined,
              membershipNextBillingDate: s.membership?.nextBillingDate || null,
              membershipStartDate: s.membership?.startDate || null,
              lastPaidAt: lastPaid,
            }
          })
          // Mostrar alumnos del sistema (inscritos)
          setStudentsOptions(opts)
        }
        // Cargar planes activos
        setPlansLoading(true)
        const respPlans = await fetch("/api/plans")
        if (respPlans.ok) {
          const dataP = await respPlans.json()
          const popts = (dataP.plans || []).map((p: any) => ({ id: p.id, name: p.name, price: p.price, currency: p.currency, type: p.type }))
          setPlansOptions(popts)
        }
      } catch (e) {
        console.error("Error loading students for combobox", e)
      } finally {
        setStudentsLoading(false)
        setPlansLoading(false)
      }
    }
    load()
  }, [openManual])

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(id)
  }, [searchTerm])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/admin/payments")
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const approvePayment = async (p: Payment) => {
    try {
      setReviewing(true)
      const res = await fetch(`/api/admin/payments/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", method: "TRANSFER", paidAt: new Date().toISOString() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data.error || "No se pudo aprobar el pago")
      }
      toast({ title: "Pago aprobado", description: "La membresía del alumno fue activada" })
      setOpenReview(false)
      setSelectedPaymentForReview(null)
      await fetchPayments()
      await fetchMetrics()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo aprobar el pago", variant: "destructive" })
    } finally {
      setReviewing(false)
    }
  }

  const rejectPayment = async (p: Payment) => {
    try {
      setReviewing(true)
      const res = await fetch(`/api/admin/payments/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FAILED" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data.error || "No se pudo rechazar el pago")
      }
      toast({ title: "Pago rechazado" })
      setOpenReview(false)
      setSelectedPaymentForReview(null)
      await fetchPayments()
      await fetchMetrics()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo rechazar el pago", variant: "destructive" })
    } finally {
      setReviewing(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/admin/payments/metrics")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const term = debouncedSearch.toLowerCase()
    const matchesSearch = payment.user.name.toLowerCase().includes(term) ||
                         payment.user.email.toLowerCase().includes(term) ||
                         payment.transactionId?.toLowerCase().includes(term)
    
    const matchesStatus = statusFilter === "ALL" || payment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const sortedPayments = useMemo(() => {
    const arr = [...filteredPayments]
    arr.sort((a, b) => {
      if (sortBy === "amount") {
        return (a.amount - b.amount) * (sortDir === "asc" ? 1 : -1)
      }
      if (sortBy === "status") {
        const order = ["PAID", "PENDING", "FAILED", "CANCELED", "REFUNDED"] as const
        return (order.indexOf(a.status as any) - order.indexOf(b.status as any)) * (sortDir === "asc" ? 1 : -1)
      }
      const da = new Date(a.paidAt || a.createdAt).getTime()
      const db = new Date(b.paidAt || b.createdAt).getTime()
      return (da - db) * (sortDir === "asc" ? 1 : -1)
    })
    return arr
  }, [filteredPayments, sortBy, sortDir])

  const toggleSort = (key: "date" | "amount" | "status") => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else {
      setSortBy(key)
      setSortDir("desc")
    }
  }

  const renderSortIcon = (key: "date" | "amount" | "status") => {
    if (sortBy !== key) return <ChevronsUpDown className="inline h-3 w-3 ml-1 opacity-50" />
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-1" />
    )
  }

  const formatCurrency = (amount: number, currency: string = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMethod = (method?: string) => {
    if (!method) return "-"
    if (method === "TRANSFER") return "Transferencia"
    if (method === "CASH") return "Efectivo"
    return method
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PAID: { 
        label: "Pagado", 
        color: "bg-green-500/20 text-green-300 border-green-500/30",
        icon: CheckCircle
      },
      PENDING: { 
        label: "Pendiente", 
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        icon: Clock
      },
      FAILED: { 
        label: "Fallido", 
        color: "bg-red-500/20 text-red-300 border-red-500/30",
        icon: XCircle
      },
      CANCELED: { 
        label: "Cancelado", 
        color: "bg-red-500/15 text-red-300 border-red-500/25",
        icon: XCircle
      },
      REFUNDED: { 
        label: "Reembolsado", 
        color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
        icon: RefreshCw
      }
    }
    
    const statusInfo = (statusMap as any)[status] || { 
      label: status, 
      color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      icon: AlertTriangle
    }
    
    const IconComponent = statusInfo.icon
    
    return (
      <Badge className={`${statusInfo.color} font-medium flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  const kpiCardData = [
    {
      title: 'Ingresos Totales',
      value: formatCurrency(metrics.totalRevenue),
      change: `+${metrics.monthlyGrowth.toFixed(1)}% vs mes anterior`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      progress: Math.min((metrics.totalRevenue / 500000) * 100, 100),
    },
    {
      title: 'Pagos Pendientes',
      value: metrics.pendingPayments ?? 0,
      change: 'Pendientes del mes',
      icon: Clock,
      color: 'from-amber-500 to-yellow-600',
      progress: 0,
    },
    {
      title: 'Monto Pendiente',
      value: formatCurrency(metrics.pendingAmountMTD ?? 0),
      change: 'Por cobrar este mes',
      icon: TrendingDown,
      color: 'from-orange-500 to-red-500',
      progress: 0,
    },
    {
      title: 'Pagos Exitosos',
      value: metrics.successfulPayments,
      change: `${metrics.totalTransactions > 0 ? ((metrics.successfulPayments / metrics.totalTransactions) * 100).toFixed(1) : 0}% tasa de éxito`,
      icon: CheckCircle,
      color: 'from-emerald-500 to-green-600',
      progress: metrics.totalTransactions > 0 ? (metrics.successfulPayments / metrics.totalTransactions) * 100 : 0,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary))]"></div>
          <p className="text-[hsl(var(--foreground))]/70">Cargando pagos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-4 sm:p-6 lg:p-8 relative overflow-x-hidden">
      {/* Elementos decorativos de fondo (con clipping para evitar overflow) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-bg opacity-20 absolute inset-0" />
        <div className="absolute top-10 -left-24 w-72 h-72 bg-[hsl(var(--primary,210_90%_56%))] rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float" />
        <div className="absolute bottom-5 -right-20 w-80 h-80 bg-[hsl(var(--accent,262_83%_58%))] rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000" />
      </div>

      <div className="relative z-10 space-y-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Pagos</h1>
            <p className="text-[hsl(var(--foreground))]/70">Monitorea y administra todas las transacciones de tu academia</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              className="bg-[hsl(var(--muted))]/60 border-border text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-300"
              onClick={fetchPayments}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button 
              className="font-semibold transition-all duration-300 transform hover:scale-105"
              onClick={() => setOpenManual(true)}
            >
              Registrar Pago
            </Button>
            <Button variant="outline" className="font-semibold transition-all duration-300 transform hover:scale-105">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCardData.map((kpi, index) => (
            <Card key={index} className="glass-effect rounded-2xl border-border overflow-hidden transition-all duration-300 hover:border-[hsl(var(--primary,210_90%_56%))]/50 hover:shadow-2xl hover:shadow-[hsl(var(--primary,210_90%_56%))]/10">
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br ${kpi.color} p-4`}>
                <CardTitle className="text-sm font-medium text-white/90">{kpi.title}</CardTitle>
                <kpi.icon className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-3xl font-bold text-white">{kpi.value}</div>
                <p className="text-xs text-[hsl(var(--foreground))]/70 mt-1">{kpi.change}</p>
                <Progress
                  value={kpi.progress}
                  className="mt-4 h-2 bg-[hsl(var(--muted,215_20%_18%))]/50"
                  indicatorClassName={(() => {
                    const fromClass = (kpi.color || "").split(" ").find((c: string) => c.startsWith("from-"))
                    return fromClass ? fromClass.replace("from-", "bg-") : "bg-[hsl(var(--primary,210_90%_56%))]"
                  })()}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payments Table */}
        <Card className="glass-effect rounded-2xl border-border">
          <CardHeader>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-[hsl(var(--foreground))]">Historial de Pagos</CardTitle>
                <CardDescription className="text-[hsl(var(--foreground))]/70">
                  Todas las transacciones y su estado actual
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-[hsl(var(--foreground))]/60" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[hsl(var(--background))] border-border">
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="PAID">Pagados</SelectItem>
                      <SelectItem value="PENDING">Pendientes</SelectItem>
                      <SelectItem value="FAILED">Fallidos</SelectItem>
                      <SelectItem value="CANCELED">Cancelados</SelectItem>
                      <SelectItem value="REFUNDED">Reembolsados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-[hsl(var(--foreground))]/60" />
                  <Input
                    ref={inputRef}
                    placeholder="Buscar pagos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-w-full overflow-x-auto p-0">
            <div className="w-full">
              <div className="rounded-lg border border-border bg-[hsl(var(--background))]/40 backdrop-blur-sm">
                <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="bg-[hsl(var(--muted))]/40 hover:bg-[hsl(var(--muted))]/60 border-border">
                    <TableHead className="font-semibold text-[hsl(var(--foreground))]/80">Cliente</TableHead>
                    <TableHead className="font-semibold text-[hsl(var(--foreground))]/80">Plan</TableHead>
                    <TableHead onClick={() => toggleSort("amount")} className="font-semibold text-[hsl(var(--foreground))]/80 cursor-pointer select-none whitespace-nowrap">
                      Monto {renderSortIcon("amount")}
                    </TableHead>
                    <TableHead className="font-semibold text-[hsl(var(--foreground))]/80 whitespace-nowrap">Estado</TableHead>
                    <TableHead className="font-semibold text-[hsl(var(--foreground))]/80 whitespace-nowrap">Método</TableHead>
                    <TableHead onClick={() => toggleSort("date")} className="font-semibold text-[hsl(var(--foreground))]/80 cursor-pointer select-none whitespace-nowrap">
                      Fecha {renderSortIcon("date")}
                    </TableHead>
                    <TableHead className="text-right font-semibold text-[hsl(var(--foreground))]/80 whitespace-nowrap">ID Transacción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 bg-[hsl(var(--muted))]/50 rounded-full">
                            <CreditCard className="h-12 w-12 text-[hsl(var(--foreground))]/50" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-[hsl(var(--foreground))]/70">
                              {searchTerm || statusFilter !== "ALL" ? "No se encontraron pagos" : "No hay pagos registrados"}
                            </p>
                            {!searchTerm && statusFilter === "ALL" && (
                              <p className="text-sm text-[hsl(var(--foreground))]/60">
                                Los pagos aparecerán aquí cuando los estudiantes realicen transacciones
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedPayments.map((payment: Payment) => (
                      <TableRow key={payment.id} className="hover:bg-[hsl(var(--background))]/30 transition-colors border-border/50">
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="font-medium text-[hsl(var(--foreground))] break-words">{payment.user.name}</div>
                            <div className="text-sm text-[hsl(var(--foreground))]/70 break-all">{payment.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {payment.membership ? (
                            <div className="space-y-1">
                              <div className="font-medium text-[hsl(var(--foreground))]">{payment.membership.plan.name}</div>
                              <div className="text-sm text-[hsl(var(--foreground))]/70">
                                {payment.membership.plan.type === "MONTHLY" ? "Mensual" : 
                                 payment.membership.plan.type === "QUARTERLY" ? "Trimestral" : "Anual"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[hsl(var(--foreground))]/70">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 whitespace-nowrap">
                          <div className="font-medium text-[hsl(var(--foreground))]">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="py-4 whitespace-nowrap">
                          <div className="text-[hsl(var(--foreground))] whitespace-nowrap">{formatMethod(payment.method)}</div>
                        </TableCell>
                        <TableCell className="py-4 whitespace-nowrap">
                          <div className="text-sm text-[hsl(var(--foreground))]/75 whitespace-nowrap">
                            {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex items-center justify-end gap-2 text-sm text-[hsl(var(--foreground))]/70 font-mono break-all">
                            <span className="break-all">{payment.transactionId || payment.id.slice(-8)}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                              onClick={() => {
                                navigator.clipboard.writeText(payment.transactionId || payment.id)
                                setCopiedId(payment.id)
                                setTimeout(() => setCopiedId(null), 1000)
                              }}
                              title={copiedId === payment.id ? "Copiado" : "Copiar ID"}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {(payment.status === "PENDING" || payment.status === "PROCESSING") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                                onClick={() => { setSelectedPaymentForReview(payment); setOpenReview(true) }}
                                title="Revisar comprobante"
                              >
                                Revisar
                              </Button>
                            )}
                            {(payment.status === "PENDING" || payment.status === "PROCESSING") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                                onClick={() => approvePayment(payment)}
                                title="Aprobar pago"
                              >
                                Aprobar
                              </Button>
                            )}
                            {(payment.status === "PENDING" || payment.status === "PROCESSING") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                                onClick={() => rejectPayment(payment)}
                                title="Rechazar pago"
                              >
                                Rechazar
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                              onClick={() => {
                                setSelectedPaymentId(payment.id)
                                setEditPayment({
                                  amount: String(payment.amount),
                                  currency: payment.currency || "CLP",
                                  method: (payment.method === "CASH" ? "CASH" : "TRANSFER") as any,
                                  status: (payment.status as any),
                                  paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString().slice(0,16) : "",
                                  transactionId: payment.transactionId || "",
                                })
                                setOpenEdit(true)
                              }}
                              title="Editar pago"
                            >
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Manual Payment Dialog */}
      <Dialog open={openManual} onOpenChange={setOpenManual}>
        <DialogContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
          <DialogHeader>
            <DialogTitle>Registrar pago manual</DialogTitle>
            <DialogDescription className="text-[hsl(var(--foreground))]/70">
              Ingresa los datos del pago recibido por transferencia o efectivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-[hsl(var(--foreground))]/80">Alumno</Label>
              <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentPopoverOpen}
                    className="w-full justify-between bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))]"
                  >
                    {selectedStudent ? (
                      <span className="truncate text-left font-medium">{selectedStudent.name}</span>
                    ) : (
                      <span className="text-[hsl(var(--foreground))]/60">Selecciona un alumno...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[360px] bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
                  <Command className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] [&_*[data-slot=command-input-wrapper]]:h-12 [&_*[data-slot=command-input-wrapper]]:border-border [&_*[data-slot=command-empty]]:text-[hsl(var(--foreground))]/70 [&_*[data-slot=command-group]]:px-2 [&_*[data-slot=command-item]]:px-2 [&_*[data-slot=command-item]]:py-3">
                    <CommandInput placeholder="Buscar alumno..." className="text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground))]/60" />
                    <CommandList>
                      <CommandEmpty>
                        {studentsLoading ? "Cargando..." : "No se encontraron alumnos"}
                      </CommandEmpty>
                      <CommandGroup heading="Alumnos">
                        {studentsOptions.map((s) => (
                          <CommandItem
                            key={s.id}
                            className="data-[selected=true]:bg-[hsl(var(--muted))] data-[selected=true]:text-[hsl(var(--foreground))]"
                            onSelect={() => {
                              setSelectedStudent({ id: s.id, name: s.name, email: s.email })
                              setStudentPopoverOpen(false)
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm text-[hsl(var(--foreground))] font-medium">{s.name}</span>
                              <span className="text-xs text-[hsl(var(--foreground))]/70">{s.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Plan</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-gray-800/50 border-gray-700 text-white"
                  >
                    {selectedPlan ? (
                      <span className="truncate text-left">
                        {selectedPlan.name} <span className="text-gray-400">({formatCurrency(selectedPlan.price, selectedPlan.currency)})</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">Selecciona un plan...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[360px] bg-gray-900 border-gray-700 text-white">
                  <Command className="bg-gray-900 text-white [&_*[data-slot=command-input-wrapper]]:h-12 [&_*[data-slot=command-input-wrapper]]:border-gray-700 [&_*[data-slot=command-empty]]:text-gray-400 [&_*[data-slot=command-group]]:px-2 [&_*[data-slot=command-item]]:px-2 [&_*[data-slot=command-item]]:py-3">
                    <CommandInput placeholder="Buscar plan..." className="text-white placeholder:text-gray-400" />
                    <CommandList>
                      <CommandEmpty>
                        {plansLoading ? "Cargando..." : "No se encontraron planes"}
                      </CommandEmpty>
                      <CommandGroup heading="Planes">
                        {plansOptions.map((p) => (
                          <CommandItem
                            key={p.id}
                            className="data-[selected=true]:bg-gray-800 data-[selected=true]:text-white"
                            onSelect={() => {
                              setSelectedPlan(p)
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm text-white">{p.name}</span>
                              <span className="text-xs text-gray-400">{formatCurrency(p.price, p.currency)}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Next payment info */}
            {selectedStudent && (
              <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {nextPaymentInfo?.overdue ? (
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    ) : (
                      <Calendar className="h-5 w-5 text-emerald-400" />
                    )}
                    <div>
                      <div className="text-xs text-gray-400">Próximo pago</div>
                      <div className="text-sm font-semibold text-white">
                        {nextPaymentInfo?.date ? formatDate(nextPaymentInfo.date.toISOString()) : "Sin datos"}
                        {nextPaymentInfo?.overdue && <span className="ml-2 text-red-400">Atrasado ⚠️</span>}
                      </div>
                    </div>
                  </div>
                  {selectedPlan?.type && (
                    <Badge className="bg-gray-700/60 text-gray-200 border-gray-600">
                      {selectedPlan.type === "MONTHLY" ? "Mensual" : selectedPlan.type === "QUARTERLY" ? "Trimestral" : selectedPlan.type === "YEARLY" ? "Anual" : "Ilimitado"}
                    </Badge>
                  )}
                </div>
                {nextPaymentInfo && (
                  <div className="mt-1 text-[11px] text-gray-400">
                    {nextPaymentInfo.reason === "NEXT_BILLING" && "Basado en próxima facturación de la membresía."}
                    {nextPaymentInfo.reason === "LAST_PAID" && "Calculado desde el último pago registrado."}
                    {nextPaymentInfo.reason === "START_DATE" && "Calculado desde el inicio de la membresía."}
                    {nextPaymentInfo.reason === "NO_DATA" && "No hay historial suficiente para estimar."}
                    {nextPaymentInfo.reason === "UNLIMITED" && "Plan ilimitado sin ciclo de pago."}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Monto</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualPayment.amount}
                  onChange={(e) => setManualPayment((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0"
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Método</Label>
                <Select value={manualPayment.method} onValueChange={(v) => setManualPayment((p) => ({ ...p, method: v as any }))}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                    <SelectValue placeholder="Selecciona método" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Fecha y hora (opcional)</Label>
              <Input
                type="datetime-local"
                value={manualPayment.paidAt}
                onChange={(e) => setManualPayment((p) => ({ ...p, paidAt: e.target.value }))}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="outline" onClick={() => setOpenManual(false)} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                Cancelar
              </Button>
              <Button onClick={submitManualPayment} disabled={savingManual} className="bg-green-600 hover:bg-green-700">
                {savingManual ? "Guardando..." : "Registrar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Review Transfer Proof Dialog */}
      <Dialog open={openReview} onOpenChange={setOpenReview}>
        <DialogContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
          <DialogHeader>
            <DialogTitle>Revisar comprobante de transferencia</DialogTitle>
            <DialogDescription className="text-[hsl(var(--foreground))]/70">
              Verifica el comprobante y aprueba o rechaza el pago.
            </DialogDescription>
          </DialogHeader>
          {selectedPaymentForReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Alumno</div>
                  <div className="font-medium">{selectedPaymentForReview.user.name} · {selectedPaymentForReview.user.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Monto</div>
                  <div className="font-medium">{formatCurrency(selectedPaymentForReview.amount, selectedPaymentForReview.currency)}</div>
                </div>
              </div>
              {selectedPaymentForReview.proofUrl ? (
                <a href={selectedPaymentForReview.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-[hsl(var(--primary))] hover:underline text-sm">Abrir comprobante en nueva pestaña</a>
              ) : (
                <div className="text-sm text-muted-foreground">Sin comprobante</div>
              )}
            </div>
          )}
          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" disabled={reviewing} onClick={() => setOpenReview(false)}>Cerrar</Button>
              {selectedPaymentForReview && (
                <>
                  <Button variant="destructive" disabled={reviewing} onClick={() => rejectPayment(selectedPaymentForReview!)}>Rechazar</Button>
                  <Button disabled={reviewing} onClick={() => approvePayment(selectedPaymentForReview!)}>
                    {reviewing ? "Procesando..." : "Aprobar"}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Editar pago</DialogTitle>
            <DialogDescription className="text-gray-400">
              Actualiza los datos del pago manual (transferencia o efectivo).
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Monto</Label>
              <Input
                type="number"
                min="0"
                value={editPayment.amount}
                onChange={(e) => setEditPayment((p) => ({ ...p, amount: e.target.value }))}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Moneda</Label>
              <Input
                value={editPayment.currency}
                onChange={(e) => setEditPayment((p) => ({ ...p, currency: e.target.value }))}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Método</Label>
              <Select value={editPayment.method} onValueChange={(v: any) => setEditPayment((p) => ({ ...p, method: v }))}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Estado</Label>
              <Select value={editPayment.status} onValueChange={(v: any) => setEditPayment((p) => ({ ...p, status: v }))}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="PAID">Pagado</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="FAILED">Fallido</SelectItem>
                  <SelectItem value="CANCELED">Cancelado</SelectItem>
                  <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Fecha de pago</Label>
              <Input
                type="datetime-local"
                value={editPayment.paidAt}
                onChange={(e) => setEditPayment((p) => ({ ...p, paidAt: e.target.value }))}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm text-gray-300">ID Transacción</Label>
              <Input
                value={editPayment.transactionId}
                onChange={(e) => setEditPayment((p) => ({ ...p, transactionId: e.target.value }))}
                placeholder="Opcional"
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="outline" onClick={() => setOpenEdit(false)} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                Cancelar
              </Button>
              <Button onClick={submitEditPayment} disabled={savingEdit || !selectedPaymentId} className="bg-indigo-600 hover:bg-indigo-700">
                {savingEdit ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Manual Payment Dialog
// Placed after default export for clarity
// Note: Inlined below return for better placement
