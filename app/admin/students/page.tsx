"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Users, 
  UserPlus, 
  CreditCard, 
  TrendingUp, 
  Search,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Trash2,
  Ban,
  CheckCircle,
  MoreVertical,
  Pencil,
  Key,
  Info,
  Check,
  AlertTriangle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  createdAt: string
  image?: string
  photoUrl?: string
  avatarUrl?: string
  membership?: {
    id: string
    status: string
    plan: {
      name: string
      price: number
      currency: string
      type: string
    }
    startDate: string
    endDate: string
    nextBillingDate: string
  }
  payments?: {
    id: string
    amount: number
    currency: string
    status: string
    paidAt?: string
  }[]
}

interface StudentMetrics {
  totalStudents: number
  activeSubscriptions: number
  monthlyRevenue: number
  newStudentsThisMonth: number
}

export default function StudentsPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [metrics, setMetrics] = useState<StudentMetrics>({
    totalStudents: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    newStudentsThisMonth: 0
  })
  // KPI visibility
  const [kpiVisibility, setKpiVisibility] = useState({
    total: true,
    active: true,
    monthly: true,
    projected: true,
    due: true,
    new: true,
  })
  const [searchTerm, setSearchTerm] = useState("")
  // Filtros
  const [debtFilter, setDebtFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [planFilter, setPlanFilter] = useState<string>("ALL")
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newStudent, setNewStudent] = useState<{ name: string; email: string; phone: string }>(
    { name: "", email: "", phone: "" }
  )
  const [createAcademyId, setCreateAcademyId] = useState<string>("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  // Solid avatar colors (varied)
  const avatarPalette = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-cyan-600",
    "bg-indigo-600",
    "bg-teal-600",
    "bg-rose-600",
    "bg-lime-600",
  ] as const

  const avatarBgFor = (key: string) => {
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i)
      hash |= 0
    }
    const idx = Math.abs(hash) % avatarPalette.length
    return avatarPalette[idx]
  }
  const [editForm, setEditForm] = useState<{ name: string; email: string; phone: string }>({ name: "", email: "", phone: "" })
  // Reset password dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetStudentId, setResetStudentId] = useState<string | null>(null)
  const [resetSaving, setResetSaving] = useState(false)
  const [resetForm, setResetForm] = useState<{ password: string; confirm: string }>({ password: "", confirm: "" })

  useEffect(() => {
    fetchStudents()
    fetchMetrics()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/admin/students", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
        if (typeof data.total === 'number') {
          setMetrics((m) => ({ ...m, totalStudents: data.total }))
        } else if (Array.isArray(data.students)) {
          setMetrics((m) => ({ ...m, totalStudents: data.students.length }))
        }
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/admin/students/metrics", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    }
  }

  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s) => { if (s.membership?.status) set.add(s.membership.status) })
    return ["ALL", ...Array.from(set).sort()]
  }, [students])

  const planOptions = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s) => { if (s.membership?.plan?.name) set.add(s.membership.plan.name) })
    return ["ALL", ...Array.from(set).sort()]
  }, [students])

  const resetFilters = () => {
    setSearchTerm("")
    setDebtFilter("ALL")
    setStatusFilter("ALL")
    setPlanFilter("ALL")
  }

  const filteredStudents = students
    .filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(student => {
      if (debtFilter === "ALL") return true
      const hasMembership = Boolean(student.membership)
      const nextInfo = hasMembership ? getNextPayment(student) : { date: null as Date | null, overdue: false }
      const overdue = nextInfo.overdue
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      switch (debtFilter) {
        case "UP_TO_DATE":
          // Al día: requiere membresía y no vencido
          return hasMembership && !overdue
        case "OVERDUE":
          // Atrasado: requiere membresía y vencido
          return hasMembership && overdue
        case "NO_PLAN":
          // Sin plan: no tiene membresía
          return !hasMembership
        case "DUE_THIS_MONTH":
          // Pagan este mes: requiere membresía ACTIVA y próxima fecha dentro del mes actual
          return (
            hasMembership &&
            student.membership?.status === "ACTIVE" &&
            !!nextInfo.date &&
            nextInfo.date >= startOfMonth &&
            nextInfo.date < startOfNextMonth
          )
        default:
          return true
      }
    })
    .filter(student => {
      if (statusFilter === "ALL") return true
      return student.membership?.status === statusFilter
    })
    .filter(student => {
      if (planFilter === "ALL") return true
      return student.membership?.plan?.name === planFilter
    })

  // Projected revenue (filters applied): sum of
  // - paid this month (payments.status === 'PAID' within current month)
  // - plus dues this month (ACTIVE membership with next payment in current month) if not already paid this month
  const projectedRevenue = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    let paid = 0
    let due = 0

    for (const s of filteredStudents) {
      // sum paid payments this month
      if (Array.isArray(s.payments)) {
        for (const p of s.payments) {
          if (p.status === "PAID" && p.paidAt) {
            const d = new Date(p.paidAt)
            if (d >= startOfMonth && d < startOfNextMonth) {
              paid += p.amount || 0
            }
          }
        }
      }

      // add due if active and next payment is within this month and not already paid this month
      if (s.membership?.status === "ACTIVE") {
        const info = getNextPayment(s)
        if (info.date && info.date >= startOfMonth && info.date < startOfNextMonth) {
          const paidThisStudent = (s.payments || []).some((p) => {
            if (p.status !== "PAID" || !p.paidAt) return false
            const d = new Date(p.paidAt)
            return d >= startOfMonth && d < startOfNextMonth
          })
          if (!paidThisStudent) {
            due += s.membership.plan?.price || 0
          }
        }
      }
    }

    return paid + due
  }, [filteredStudents])

  // Detailed breakdown lists for modal
  const projectedBreakdown = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const paidList: { id: string; name: string; amount: number; date: string }[] = []
    const dueList: { id: string; name: string; amount: number; date: Date }[] = []
    for (const s of filteredStudents) {
      if (Array.isArray(s.payments)) {
        for (const p of s.payments) {
          if (p.status === "PAID" && p.paidAt) {
            const d = new Date(p.paidAt)
            if (d >= startOfMonth && d < startOfNextMonth) {
              paidList.push({ id: s.id, name: s.name, amount: p.amount || 0, date: p.paidAt })
            }
          }
        }
      }
      if (s.membership?.status === "ACTIVE") {
        const info = getNextPayment(s)
        if (info.date && info.date >= startOfMonth && info.date < startOfNextMonth) {
          const paidThisStudent = (s.payments || []).some((p) => {
            if (p.status !== "PAID" || !p.paidAt) return false
            const d = new Date(p.paidAt)
            return d >= startOfMonth && d < startOfNextMonth
          })
          if (!paidThisStudent) {
            dueList.push({ id: s.id, name: s.name, amount: s.membership.plan?.price || 0, date: info.date })
          }
        }
      }
    }
    return { paidList, dueList }
  }, [filteredStudents])

  const [projectedDetailOpen, setProjectedDetailOpen] = useState(false)

  // Compare projection vs actual monthly revenue (backend metric)
  const projectedDelta = useMemo(() => projectedRevenue - (metrics.monthlyRevenue || 0), [projectedRevenue, metrics.monthlyRevenue])
  const projectedPercent = useMemo(() => {
    const actual = metrics.monthlyRevenue || 0
    if (actual <= 0) return 0
    return Math.round((projectedRevenue / actual) * 100)
  }, [projectedRevenue, metrics.monthlyRevenue])

  // Breakdown for tooltip
  const { paidThisMonth, dueThisMonth } = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    let paidSum = 0
    let dueSum = 0
    for (const s of filteredStudents) {
      if (Array.isArray(s.payments)) {
        for (const p of s.payments) {
          if (p.status === "PAID" && p.paidAt) {
            const d = new Date(p.paidAt)
            if (d >= startOfMonth && d < startOfNextMonth) {
              paidSum += p.amount || 0
            }
          }
        }
      }
      if (s.membership?.status === "ACTIVE") {
        const info = getNextPayment(s)
        if (info.date && info.date >= startOfMonth && info.date < startOfNextMonth) {
          const paidThisStudent = (s.payments || []).some((p) => {
            if (p.status !== "PAID" || !p.paidAt) return false
            const d = new Date(p.paidAt)
            return d >= startOfMonth && d < startOfNextMonth
          })
          if (!paidThisStudent) dueSum += s.membership.plan?.price || 0
        }
      }
    }
    return { paidThisMonth: paidSum, dueThisMonth: dueSum }
  }, [filteredStudents])

  const resetNewStudent = () => setNewStudent({ name: "", email: "", phone: "" })

  const handleOpenCreate = () => {
    resetNewStudent()
    setCreateAcademyId((session?.user as any)?.academyId || "")
    setOpenCreate(true)
  }

  const saveStudent = async () => {
    try {
      if (!newStudent.name || !newStudent.email) {
        toast({ title: "Faltan datos", description: "Nombre y email son obligatorios", variant: "destructive" })
        return
      }
      const userRole = (session?.user as any)?.role
      const academyIdToSend = (session?.user as any)?.academyId || createAcademyId
      if (userRole === "SUPER_ADMIN" && !academyIdToSend) {
        toast({ title: "Falta academia", description: "Ingresa el ID de la academia", variant: "destructive" })
        return
      }
      setSaving(true)
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newStudent, academyId: academyIdToSend }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo crear el estudiante")
      }
      toast({ title: "Estudiante creado" })
      setOpenCreate(false)
      resetNewStudent()
      fetchStudents()
      fetchMetrics()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo crear el estudiante", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo eliminar el estudiante")
      }
      toast({ title: "Estudiante eliminado" })
      setDeleteDialogOpen(false)
      setSelectedStudent(null)
      fetchStudents()
      fetchMetrics()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo eliminar el estudiante", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspendStudent = async (student: Student) => {
    try {
      setActionLoading(true)
      const newStatus = student.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo actualizar el estudiante")
      }
      toast({ title: newStatus === "SUSPENDED" ? "Estudiante suspendido" : "Estudiante activado" })
      fetchStudents()
      fetchMetrics()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo actualizar el estudiante", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ACTIVE: {
        label: "Activo",
        className: "bg-green-500/15 text-green-400 border-green-500/30",
      },
      INACTIVE: {
        label: "Inactivo",
        className: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      },
      CANCELLED: {
        label: "Cancelado",
        className: "bg-red-500/15 text-red-400 border-red-500/30",
      },
      PENDING: {
        label: "Pendiente",
        className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      },
    }

    const statusInfo = statusMap[status] || {
      label: status,
      className: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    }
    return <Badge className={`${statusInfo.className} font-medium`}>{statusInfo.label}</Badge>
  }

  const formatCurrency = (amount: number, currency: string = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL")
  }

  // Helpers to compute next payment date when membership has no nextBillingDate
  function monthsForPlanType(type?: string) {
    switch (type) {
      case "MONTHLY": return 1
      case "QUARTERLY": return 3
      case "YEARLY": return 12
      default: return 1
    }
  }

  function addMonths(date: Date, months: number) {
    const d = new Date(date)
    const day = d.getDate()
    d.setMonth(d.getMonth() + months)
    if (d.getDate() < day) d.setDate(0)
    return d
  }

  function addMonthsUTCAnchored(date: Date, months: number) {
    const y = date.getUTCFullYear()
    const m = date.getUTCMonth()
    const d = date.getUTCDate()
    const base = new Date(Date.UTC(y, m, d, 12, 0, 0))
    const day = base.getUTCDate()
    base.setUTCMonth(base.getUTCMonth() + months)
    if (base.getUTCDate() < day) base.setUTCDate(0)
    return base
  }

  function getNextPayment(student: Student): { date: Date | null; overdue: boolean } {
    const m = student.membership
    if (!m) return { date: null, overdue: false }
    const lastPaid = (student.payments || [])
      .filter((p) => p.status === "PAID" && p.paidAt)
      .sort((a, b) => new Date(b.paidAt as string).getTime() - new Date(a.paidAt as string).getTime())[0]
    const months = monthsForPlanType(m.plan?.type)
    if (m.nextBillingDate) {
      const nb = new Date(m.nextBillingDate)
      if (lastPaid?.paidAt) {
        const computed = addMonthsUTCAnchored(new Date(lastPaid.paidAt), months)
        const chosen = computed > nb ? computed : nb
        return { date: chosen, overdue: Date.now() > chosen.getTime() }
      }
      return { date: nb, overdue: Date.now() > nb.getTime() }
    }
    // fallback: last paidAt or membership startDate
    const base = lastPaid?.paidAt ? new Date(lastPaid.paidAt) : (m.startDate ? new Date(m.startDate) : null)
    if (!base) return { date: null, overdue: false }
    const next = addMonthsUTCAnchored(base, months)
    return { date: next, overdue: Date.now() > next.getTime() }
  }

  // Edit handlers (correct location)
  const handleOpenEdit = (student: Student) => {
    setEditingStudentId(student.id)
    setEditForm({ name: student.name || "", email: student.email || "", phone: student.phone || "" })
    setEditDialogOpen(true)
  }

  const saveEditStudent = async () => {
    try {
      if (!editingStudentId) return
      if (!editForm.name || !editForm.email) {
        toast({ title: "Faltan datos", description: "Nombre y email son obligatorios", variant: "destructive" })
        return
      }
      setEditSaving(true)
      const res = await fetch(`/api/admin/students/${editingStudentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, email: editForm.email, phone: editForm.phone })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo actualizar el estudiante")
      }
      toast({ title: "Datos actualizados" })
      setEditDialogOpen(false)
      setEditingStudentId(null)
      fetchStudents()
      fetchMetrics()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo actualizar el estudiante", variant: "destructive" })
    } finally {
      setEditSaving(false)
    }
  }

  // Reset password handlers
  const handleOpenResetPassword = (student: Student) => {
    setResetStudentId(student.id)
    setResetForm({ password: "", confirm: "" })
    setResetDialogOpen(true)
  }

  const saveResetPassword = async () => {
    try {
      if (!resetStudentId) return
      const pwd = resetForm.password.trim()
      const conf = resetForm.confirm.trim()
      if (!pwd || pwd.length < 8) {
        toast({ title: "Contraseña inválida", description: "Debe tener al menos 8 caracteres", variant: "destructive" })
        return
      }
      if (pwd !== conf) {
        toast({ title: "Las contraseñas no coinciden", description: "Verifica e intenta nuevamente", variant: "destructive" })
        return
      }
      setResetSaving(true)
      const res = await fetch(`/api/admin/students/${resetStudentId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo reestablecer la contraseña")
      }
      toast({ title: "Contraseña actualizada" })
      setResetDialogOpen(false)
      setResetStudentId(null)
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo reestablecer la contraseña", variant: "destructive" })
    } finally {
      setResetSaving(false)
    }
  }

  const kpiCardData = [
    {
      id: 'total',
      title: 'Total Estudiantes',
      value: metrics.totalStudents,
      change: 'Estudiantes registrados',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      progress: Math.min((metrics.totalStudents / 100) * 100, 100),
    },
    {
      id: 'active',
      title: 'Suscripciones Activas',
      value: metrics.activeSubscriptions,
      change: 'Pagos al día',
      icon: CreditCard,
      color: 'from-green-500 to-emerald-600',
      progress: metrics.totalStudents > 0 ? Math.min((metrics.activeSubscriptions / metrics.totalStudents) * 100, 100) : 0,
    },
    {
      id: 'monthly',
      title: 'Ingresos Mensuales',
      value: formatCurrency(metrics.monthlyRevenue),
      change: 'Recaudación mensual',
      icon: DollarSign,
      color: 'from-purple-500 to-violet-600',
      progress: Math.min((metrics.monthlyRevenue / 50000) * 100, 100),
    },
    {
      id: 'projected',
      title: 'Ingresos Proyectados (mes)',
      value: formatCurrency(projectedRevenue),
      change: `Vs actual: ${projectedDelta >= 0 ? '+' : ''}${formatCurrency(projectedDelta)} (${projectedPercent}%)`,
      icon: DollarSign,
      color: 'from-sky-500 to-cyan-600',
      progress: metrics.monthlyRevenue > 0 ? Math.min((projectedRevenue / metrics.monthlyRevenue) * 100, 100) : 0,
      tooltipContent: (
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-300">Pagado este mes</span>
            <span className="text-white font-medium">{formatCurrency(paidThisMonth)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Por cobrar este mes</span>
            <span className="text-white font-medium">{formatCurrency(dueThisMonth)}</span>
          </div>
          <div className="border-t border-gray-700 my-1" />
          <div className="flex justify-between">
            <span className="text-gray-300">Proyección</span>
            <span className="text-white font-semibold">{formatCurrency(projectedRevenue)}</span>
          </div>
        </div>
      ),
      extraAction: (
        <div className="mt-2">
          <Button variant="outline" onClick={() => setProjectedDetailOpen(true)} className="border-white/30 text-white/90 hover:bg-white/10">
            Ver detalle
          </Button>
        </div>
      ),
    },
    {
      id: 'due',
      title: 'Por cobrar este mes',
      value: formatCurrency(dueThisMonth),
      change: 'Pendiente de recaudar',
      icon: AlertTriangle,
      color: 'from-amber-500 to-orange-600',
      progress: (() => {
        const total = paidThisMonth + dueThisMonth
        if (total <= 0) return 0
        return Math.min((dueThisMonth / total) * 100, 100)
      })(),
    },
    {
      id: 'new',
      title: 'Nuevos Este Mes',
      value: metrics.newStudentsThisMonth,
      change: 'Registros recientes',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      progress: Math.min((metrics.newStudentsThisMonth / 20) * 100, 100),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="text-gray-400">Cargando estudiantes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-[hsl(var(--primary))] rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-[hsl(var(--accent))] rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Estudiantes</h1>
            <p className="text-gray-400">Administra y supervisa todos los estudiantes de tu academia</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3 py-2 rounded-md bg-[hsl(var(--muted))]/60 border border-border text-[hsl(var(--foreground))] text-sm hover:bg-[hsl(var(--muted))]">
                KPIs
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[hsl(var(--background))] border border-border text-[hsl(var(--foreground))]">
                {[
                  { id: 'total', label: 'Total Estudiantes' },
                  { id: 'active', label: 'Suscripciones Activas' },
                  { id: 'monthly', label: 'Ingresos Mensuales' },
                  { id: 'projected', label: 'Ingresos Proyectados (mes)' },
                  { id: 'due', label: 'Por cobrar este mes' },
                  { id: 'new', label: 'Nuevos Este Mes' },
                ].map((opt) => {
                  const visible = (kpiVisibility as any)[opt.id]
                  return (
                    <DropdownMenuItem
                      key={opt.id}
                      onClick={() => setKpiVisibility((v) => ({ ...v, [opt.id]: !visible }))}
                      className="hover:bg-[hsl(var(--muted))] focus:bg-[hsl(var(--muted))] cursor-pointer text-[hsl(var(--foreground))] flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                      {visible && <Check className="h-4 w-4 text-green-400" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleOpenCreate} className="font-semibold transition-all duration-300 transform hover:scale-105">
              <UserPlus className="mr-2 h-4 w-4" />
              Agregar Estudiante
            </Button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCardData.filter(k => (kpiVisibility as any)[k.id]).map((kpi, index) => (
            <Card key={index} className="glass-effect rounded-2xl border-border overflow-hidden transition-all duration-300 hover:border-[hsl(var(--primary))]/50 hover:shadow-2xl hover:shadow-[hsl(var(--primary))]/10">
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br ${kpi.color} p-4`}>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium text-white/90">{kpi.title}</CardTitle>
                  {kpi.tooltipContent && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button aria-label="Detalle proyección" className="text-white/80 hover:text-white focus:outline-none">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[hsl(var(--background))] border border-border text-[hsl(var(--foreground))]">
                          {kpi.tooltipContent}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <kpi.icon className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-3xl font-bold text-white">{kpi.value}</div>
                <p className="text-xs text-gray-300 mt-1">{kpi.change}</p>
                <Progress
                  value={kpi.progress}
                  className="mt-4 h-2 bg-[hsl(var(--muted))]/50"
                  indicatorClassName={(() => {
                    const fromClass = (kpi.color || "").split(" ").find((c: string) => c.startsWith("from-"))
                    return fromClass ? fromClass.replace("from-", "bg-") : "bg-[hsl(var(--primary,210_90%_56%))]"
                  })()}
                />
                {kpi.extraAction}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Students Table */}
        <Card className="glass-effect rounded-2xl border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[hsl(var(--foreground))]">Lista de Estudiantes</CardTitle>
                <CardDescription className="text-gray-300">
                  Busca y gestiona todos los estudiantes de tu academia
                </CardDescription>
              </div>
              {/* Mobile Filters */}
              <div className="flex flex-col space-y-3 md:hidden">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar estudiantes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={debtFilter} onValueChange={setDebtFilter}>
                    <SelectTrigger className="bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))]">
                      <SelectValue placeholder="Estado pago" />
                    </SelectTrigger>
                    <SelectContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="UP_TO_DATE">Al día</SelectItem>
                      <SelectItem value="OVERDUE">Atrasado</SelectItem>
                      <SelectItem value="DUE_THIS_MONTH">Este mes</SelectItem>
                      <SelectItem value="NO_PLAN">Sin plan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt === "ALL" ? "Todos" : opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="flex-1 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))]">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
                      {planOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt === "ALL" ? "Todos" : opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="border-border"
                    size="sm"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>

              {/* Desktop Filters */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
                  />
                </div>
                <Select value={debtFilter} onValueChange={setDebtFilter}>
                  <SelectTrigger className="w-48 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))]">
                    <SelectValue placeholder="Estado de pago" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
                    <SelectItem value="ALL">Todos (estado de pago)</SelectItem>
                    <SelectItem value="UP_TO_DATE">Al día</SelectItem>
                    <SelectItem value="OVERDUE">Atrasado</SelectItem>
                    <SelectItem value="DUE_THIS_MONTH">Pagan este mes</SelectItem>
                    <SelectItem value="NO_PLAN">Sin plan</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt === "ALL" ? "Todos (estado)" : opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-48 bg-[hsl(var(--muted))]/50 border-border text-[hsl(var(--foreground))]">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
                    {planOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt === "ALL" ? "Todos (plan)" : opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="border-border"
                  title="Limpiar búsqueda y filtros"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
              {filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center space-y-4 py-12">
                  <div className="p-4 bg-[hsl(var(--muted))]/50 rounded-full">
                    <Users className="h-12 w-12 text-[hsl(var(--foreground))]/50" />
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-lg font-medium text-[hsl(var(--foreground))]/70">
                      {searchTerm ? "No se encontraron estudiantes" : "No hay estudiantes registrados"}
                    </p>
                    {!searchTerm && (
                      <p className="text-sm text-[hsl(var(--foreground))]/60">
                        Los estudiantes aparecerán aquí cuando se registren con un plan
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <Card key={student.id} className="border-border bg-[hsl(var(--muted))]/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={(student.image || student.photoUrl || student.avatarUrl) ?? undefined} alt={student.name} />
                            <AvatarFallback className={`${avatarBgFor(student.id || student.email || student.name)} text-white font-semibold`}>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-[hsl(var(--foreground))] truncate">{student.name}</div>
                              {student.status === "SUSPENDED" && (
                                <Badge className="bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30 text-xs">
                                  Suspendido
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-[hsl(var(--foreground))]/70">
                              <Mail className="mr-1 h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{student.email}</span>
                            </div>
                            {student.phone && (
                              <div className="flex items-center text-sm text-[hsl(var(--foreground))]/70">
                                <Phone className="mr-1 h-3 w-3 flex-shrink-0" />
                                {student.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSuspend(student)}>
                              {student.status === "SUSPENDED" ? (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Reactivar
                                </>
                              ) : (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspender
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(student)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[hsl(var(--foreground))]/60">Plan:</span>
                          {student.membership ? (
                            <div className="text-right">
                              <div className="font-medium text-sm">{student.membership.plan.name}</div>
                              <div className="text-xs text-[hsl(var(--foreground))]/70">
                                {formatCurrency(student.membership.plan.price)} / {student.membership.plan.type === "MONTHLY" ? "mes" : "año"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-[hsl(var(--foreground))]/60">Sin plan</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[hsl(var(--foreground))]/60">Estado:</span>
                          {student.membership ? (
                            getStatusBadge(student.membership.status)
                          ) : (
                            <Badge className="bg-[hsl(var(--muted))]/40 text-[hsl(var(--foreground))]/70 border-[hsl(var(--muted))]/50">Sin suscripción</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[hsl(var(--foreground))]/60">Próximo pago:</span>
                          <span className="text-sm">
                            {student.membership?.endDate ? formatDate(student.membership.endDate) : "N/A"}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[hsl(var(--foreground))]/60">Registro:</span>
                          <span className="text-sm">{formatDate(student.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-lg border border-border overflow-hidden bg-[hsl(var(--muted))]/30 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsl(var(--muted))]/40 hover:bg-[hsl(var(--muted))]/60 border-border">
                    <TableHead className="font-semibold text-[hsl(var(--foreground))]/80">Estudiante</TableHead>
                    <TableHead className="font-semibold text-[hsl(var(--foreground))]/80">Plan</TableHead>
                    <TableHead className="font-semibold text-[hsl(var(--foreground))]/80">Estado</TableHead>
                    <TableHead className="font-semibold text-[hsl(var(--foreground))]/80">Próximo Pago</TableHead>
                    <TableHead className="font-semibold text-[hsl(var(--foreground))]/80">Registro</TableHead>
                    <TableHead className="text-right font-semibold text-[hsl(var(--foreground))]/80">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 bg-[hsl(var(--muted))]/50 rounded-full">
                            <Users className="h-12 w-12 text-[hsl(var(--foreground))]/50" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-[hsl(var(--foreground))]/70">
                              {searchTerm ? "No se encontraron estudiantes" : "No hay estudiantes registrados"}
                            </p>
                            {!searchTerm && (
                              <p className="text-sm text-[hsl(var(--foreground))]/60">
                                Los estudiantes aparecerán aquí cuando se registren con un plan
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-[hsl(var(--muted))]/30 transition-colors border-border/30">
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={(student.image || student.photoUrl || student.avatarUrl) ?? undefined} alt={student.name} />
                              <AvatarFallback className={`${avatarBgFor(student.id || student.email || student.name)} text-white font-semibold text-sm`}>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-[hsl(var(--foreground))]">{student.name}</div>
                                {student.status === "SUSPENDED" && (
                                  <Badge className="bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30 text-xs">
                                    Suspendido
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center text-sm text-[hsl(var(--foreground))]/70">
                                <Mail className="mr-1 h-3 w-3" />
                                {student.email}
                              </div>
                              {student.phone && (
                                <div className="flex items-center text-sm text-[hsl(var(--foreground))]/70">
                                  <Phone className="mr-1 h-3 w-3" />
                                  {student.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {student.membership ? (
                            <div className="space-y-1">
                              <div className="font-medium text-[hsl(var(--foreground))]">{student.membership.plan.name}</div>
                              <div className="text-sm text-[hsl(var(--foreground))]/70">
                                {formatCurrency(student.membership.plan.price)} / {student.membership.plan.type === "MONTHLY" ? "mes" : "año"}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-[hsl(var(--muted))] rounded-full"></div>
                              <span className="text-[hsl(var(--foreground))]/60">Sin plan</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {student.membership ? (
                            getStatusBadge(student.membership.status)
                          ) : (
                            <Badge className="bg-[hsl(var(--muted))]/40 text-[hsl(var(--foreground))]/70 border-[hsl(var(--muted))]/50">Sin suscripción</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {student.membership ? (
                            (() => {
                              const info = getNextPayment(student)
                              if (!info.date) return <span className="text-gray-500">-</span>
                              const now = new Date()
                              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                              const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                              const dueThisMonth = (
                                student.membership?.status === "ACTIVE" &&
                                info.date >= startOfMonth &&
                                info.date < startOfNextMonth
                              )
                              const paidThisStudent = (student.payments || []).some((p) => {
                                if (p.status !== "PAID" || !p.paidAt) return false
                                const d = new Date(p.paidAt)
                                return d >= startOfMonth && d < startOfNextMonth
                              })
                              const showOverdue = info.overdue && !paidThisStudent
                              const showDueBadge = dueThisMonth && !paidThisStudent
                              return (
                                <div className={`flex items-center gap-2 text-sm ${showOverdue ? 'text-[hsl(var(--destructive))]/80' : 'text-[hsl(var(--foreground))]'}`}>
                                  <div className="flex items-center">
                                    <Calendar className={`mr-2 h-4 w-4 ${showOverdue ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--foreground))]/60'}`} />
                                    {formatDate(info.date.toISOString())}
                                    {showOverdue && <span className="ml-2 text-[hsl(var(--destructive))]">⚠️</span>}
                                  </div>
                                  {showDueBadge && (
                                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Paga este mes</Badge>
                                  )}
                                  {!showDueBadge && paidThisStudent && (
                                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Pagado</Badge>
                                  )}
                                </div>
                              )
                            })()
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-[hsl(var(--foreground))]/70">
                            {formatDate(student.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger 
                              className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md text-[hsl(var(--foreground))]/60 hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] focus:outline-none"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Abrir menú</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))] z-50">
                              <DropdownMenuLabel className="text-[hsl(var(--foreground))]/70">Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-[hsl(var(--muted))]" />
                              <DropdownMenuItem 
                                onClick={() => handleOpenEdit(student)}
                                className="hover:bg-[hsl(var(--muted))] focus:bg-[hsl(var(--muted))] cursor-pointer"
                              >
                                <Pencil className="mr-2 h-4 w-4 text-[hsl(var(--primary))]" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleOpenResetPassword(student)}
                                disabled={actionLoading}
                                className="hover:bg-[hsl(var(--muted))] focus:bg-[hsl(var(--muted))] cursor-pointer"
                              >
                                <Key className="mr-2 h-4 w-4 text-[hsl(var(--primary))]" />
                                <span>Resetear contraseña</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleSuspendStudent(student)}
                                disabled={actionLoading}
                                className="hover:bg-[hsl(var(--muted))] focus:bg-[hsl(var(--muted))] cursor-pointer"
                              >
                                {student.status === "SUSPENDED" ? (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-[hsl(var(--primary))]" />
                                    <span>Activar</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4 text-[hsl(var(--accent))]" />
                                    <span>Suspender</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setDeleteDialogOpen(true)
                                }}
                                disabled={actionLoading}
                                className="hover:bg-[hsl(var(--destructive))]/20 focus:bg-[hsl(var(--destructive))]/20 cursor-pointer text-[hsl(var(--destructive))]"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Student Dialog */}
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
            <DialogHeader>
              <DialogTitle>Nuevo estudiante</DialogTitle>
              <DialogDescription className="text-[hsl(var(--foreground))]/70">
                Ingresa los datos básicos para registrar al estudiante.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[hsl(var(--foreground))]/80">Nombre</label>
                <Input
                  value={newStudent.name}
                  onChange={(e) => setNewStudent((p) => ({ ...p, name: e.target.value }))}
                  className="bg-[hsl(var(--muted))]/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[hsl(var(--foreground))]/80">Email</label>
                <Input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent((p) => ({ ...p, email: e.target.value }))}
                  className="bg-[hsl(var(--muted))]/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[hsl(var(--foreground))]/80">Teléfono (opcional)</label>
                <Input
                  type="tel"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-[hsl(var(--muted))]/50 border-border"
                />
              </div>
              {((session?.user as any)?.role === "SUPER_ADMIN" && !(session?.user as any)?.academyId) && (
                <div className="space-y-2">
                  <label className="text-sm text-[hsl(var(--foreground))]/80">Academia ID</label>
                  <Input
                    value={createAcademyId}
                    onChange={(e) => setCreateAcademyId(e.target.value)}
                    placeholder="ID de la academia"
                    className="bg-[hsl(var(--muted))]/50 border-border"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <div className="flex items-center justify-end gap-3 w-full">
                <Button variant="outline" onClick={() => setOpenCreate(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveStudent} disabled={saving}>
                  {saving ? "Guardando..." : "Crear"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
            <DialogHeader>
              <DialogTitle>Resetear contraseña</DialogTitle>
              <DialogDescription className="text-[hsl(var(--foreground))]/70">
                Define una nueva contraseña para el estudiante seleccionado. Debe tener al menos 8 caracteres.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[hsl(var(--foreground))]/80">Nueva contraseña</label>
                <Input
                  type="password"
                  value={resetForm.password}
                  onChange={(e) => setResetForm((p) => ({ ...p, password: e.target.value }))}
                  className="bg-[hsl(var(--muted))]/50 border-border"
                  placeholder="********"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[hsl(var(--foreground))]/80">Confirmar contraseña</label>
                <Input
                  type="password"
                  value={resetForm.confirm}
                  onChange={(e) => setResetForm((p) => ({ ...p, confirm: e.target.value }))}
                  className="bg-[hsl(var(--muted))]/50 border-border"
                  placeholder="********"
                />
              </div>
            </div>
            <DialogFooter>
              <div className="flex items-center justify-end gap-3 w-full">
                <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveResetPassword} disabled={resetSaving}>
                  {resetSaving ? "Guardando..." : "Actualizar"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Student Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
            <DialogHeader>
              <DialogTitle>Editar estudiante</DialogTitle>
              <DialogDescription className="text-[hsl(var(--foreground))]/70">
                Actualiza los datos del estudiante.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[hsl(var(--foreground))]/80">Nombre</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-[hsl(var(--muted))]/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[hsl(var(--foreground))]/80">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="bg-[hsl(var(--muted))]/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[hsl(var(--foreground))]/80">Teléfono</label>
                <Input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-[hsl(var(--muted))]/50 border-border"
                />
              </div>
            </div>

            <DialogFooter>
              <div className="flex items-center justify-end gap-3 w-full">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveEditStudent} disabled={editSaving}>
                  {editSaving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-[hsl(var(--background))] border-border text-[hsl(var(--foreground))]">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
              <AlertDialogDescription className="text-[hsl(var(--foreground))]/70">
                Esta acción no se puede deshacer. Se eliminará permanentemente a{" "}
                <span className="font-semibold text-white">{selectedStudent?.name}</span> y todos sus datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStudent}
                disabled={actionLoading}
                className="bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/80 text-[hsl(var(--destructive-foreground))]"
              >
                {actionLoading ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
