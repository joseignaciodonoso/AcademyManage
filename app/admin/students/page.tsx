"use client"

import { useState, useEffect } from "react"
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
  Pencil
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

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  createdAt: string
  membership?: {
    id: string
    status: string
    plan: {
      name: string
      price: number
      currency: string
      type: string
    }
    /*
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
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo actualizar el estudiante", variant: "destructive" })
    } finally {
      setEditSaving(false)
    }
  }
    */
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
  const [searchTerm, setSearchTerm] = useState("")
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
  const [editForm, setEditForm] = useState<{ name: string; email: string; phone: string }>({ name: "", email: "", phone: "" })

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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    const statusMap = {
      ACTIVE: { label: "Activo", color: "bg-green-500/20 text-green-300 border-green-500/30" },
      INACTIVE: { label: "Inactivo", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
      CANCELLED: { label: "Cancelado", color: "bg-red-500/20 text-red-300 border-red-500/30" },
      PENDING: { label: "Pendiente", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: "bg-gray-500/20 text-gray-300 border-gray-500/30" }
    return <Badge className={`${statusInfo.color} font-medium`}>{statusInfo.label}</Badge>
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
    if (d.getDate() < day) d.setDate(0)
    return d
  }

  const getNextPayment = (student: Student): { date: Date | null; overdue: boolean } => {
    const m = student.membership
    if (!m) return { date: null, overdue: false }
    if (m.nextBillingDate) {
      const dt = new Date(m.nextBillingDate)
      return { date: dt, overdue: Date.now() > dt.getTime() }
    }
    // fallback: last paidAt or membership startDate
    const lastPaid = (student.payments || [])
      .filter((p) => p.status === "PAID" && p.paidAt)
      .sort((a, b) => new Date(b.paidAt as string).getTime() - new Date(a.paidAt as string).getTime())[0]
    const base = lastPaid?.paidAt ? new Date(lastPaid.paidAt) : (m.startDate ? new Date(m.startDate) : null)
    if (!base) return { date: null, overdue: false }
    const months = monthsForPlanType(m.plan?.type)
    const next = addMonths(base, months)
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

  const kpiCardData = [
    {
      title: 'Total Estudiantes',
      value: metrics.totalStudents,
      change: 'Estudiantes registrados',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      progress: Math.min((metrics.totalStudents / 100) * 100, 100),
    },
    {
      title: 'Suscripciones Activas',
      value: metrics.activeSubscriptions,
      change: 'Pagos al día',
      icon: CreditCard,
      color: 'from-green-500 to-emerald-600',
      progress: metrics.totalStudents > 0 ? Math.min((metrics.activeSubscriptions / metrics.totalStudents) * 100, 100) : 0,
    },
    {
      title: 'Ingresos Mensuales',
      value: formatCurrency(metrics.monthlyRevenue),
      change: 'Recaudación mensual',
      icon: DollarSign,
      color: 'from-purple-500 to-violet-600',
      progress: Math.min((metrics.monthlyRevenue / 50000) * 100, 100),
    },
    {
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
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-blue-500 rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Estudiantes</h1>
            <p className="text-gray-400">Administra y supervisa todos los estudiantes de tu academia</p>
          </div>
          <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:scale-105">
            <UserPlus className="mr-2 h-4 w-4" />
            Agregar Estudiante
          </Button>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCardData.map((kpi, index) => (
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

        {/* Search and Students Table */}
        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Lista de Estudiantes</CardTitle>
                <CardDescription className="text-gray-400">
                  Busca y gestiona todos los estudiantes de tu academia
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-indigo-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-gray-700/50 overflow-hidden bg-gray-800/30 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800/50 hover:bg-gray-800/70 border-gray-700/50">
                    <TableHead className="font-semibold text-gray-300">Estudiante</TableHead>
                    <TableHead className="font-semibold text-gray-300">Plan</TableHead>
                    <TableHead className="font-semibold text-gray-300">Estado</TableHead>
                    <TableHead className="font-semibold text-gray-300">Próximo Pago</TableHead>
                    <TableHead className="font-semibold text-gray-300">Registro</TableHead>
                    <TableHead className="text-right font-semibold text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 bg-gray-800/50 rounded-full">
                            <Users className="h-12 w-12 text-gray-500" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-gray-400">
                              {searchTerm ? "No se encontraron estudiantes" : "No hay estudiantes registrados"}
                            </p>
                            {!searchTerm && (
                              <p className="text-sm text-gray-500">
                                Los estudiantes aparecerán aquí cuando se registren con un plan
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-800/30 transition-colors border-gray-700/30">
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-white">{student.name}</div>
                                {student.status === "SUSPENDED" && (
                                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                                    Suspendido
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center text-sm text-gray-400">
                                <Mail className="mr-1 h-3 w-3" />
                                {student.email}
                              </div>
                              {student.phone && (
                                <div className="flex items-center text-sm text-gray-400">
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
                              <div className="font-medium text-white">{student.membership.plan.name}</div>
                              <div className="text-sm text-gray-400">
                                {formatCurrency(student.membership.plan.price)} / {student.membership.plan.type === "MONTHLY" ? "mes" : "año"}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <span className="text-gray-400">Sin plan</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {student.membership ? (
                            getStatusBadge(student.membership.status)
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Sin suscripción</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {student.membership ? (
                            (() => {
                              const info = getNextPayment(student)
                              return info.date ? (
                                <div className={`flex items-center text-sm ${info.overdue ? 'text-red-300' : 'text-white'}`}>
                                  <Calendar className={`mr-2 h-4 w-4 ${info.overdue ? 'text-red-400' : 'text-gray-400'}`} />
                                  {formatDate(info.date.toISOString())}
                                  {info.overdue && <span className="ml-2 text-red-400">⚠️</span>}
                                </div>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )
                            })()
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-gray-400">
                            {formatDate(student.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger 
                              className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Abrir menú</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white z-50">
                              <DropdownMenuLabel className="text-gray-300">Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-gray-700" />
                              <DropdownMenuItem 
                                onClick={() => handleOpenEdit(student)}
                                className="hover:bg-gray-700 focus:bg-gray-700 cursor-pointer text-white"
                              >
                                <Pencil className="mr-2 h-4 w-4 text-blue-400" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleSuspendStudent(student)}
                                disabled={actionLoading}
                                className="hover:bg-gray-700 focus:bg-gray-700 cursor-pointer text-white"
                              >
                                {student.status === "SUSPENDED" ? (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    <span>Activar</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4 text-yellow-500" />
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
                                className="hover:bg-red-900/50 focus:bg-red-900/50 cursor-pointer text-red-400"
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
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Nuevo estudiante</DialogTitle>
              <DialogDescription className="text-gray-400">
                Ingresa los datos básicos para registrar al estudiante.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Nombre</label>
                <Input
                  value={newStudent.name}
                  onChange={(e) => setNewStudent((p) => ({ ...p, name: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Email</label>
                <Input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent((p) => ({ ...p, email: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Teléfono (opcional)</label>
                <Input
                  type="tel"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              {((session?.user as any)?.role === "SUPER_ADMIN" && !(session?.user as any)?.academyId) && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Academia ID</label>
                  <Input
                    value={createAcademyId}
                    onChange={(e) => setCreateAcademyId(e.target.value)}
                    placeholder="ID de la academia"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <div className="flex items-center justify-end gap-3 w-full">
                <Button variant="outline" onClick={() => setOpenCreate(false)} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                  Cancelar
                </Button>
                <Button onClick={saveStudent} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving ? "Guardando..." : "Crear"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Student Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Editar estudiante</DialogTitle>
              <DialogDescription className="text-gray-400">
                Actualiza los datos del estudiante.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Nombre</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Teléfono</label>
                <Input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <div className="flex items-center justify-end gap-3 w-full">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                  Cancelar
                </Button>
                <Button onClick={saveEditStudent} disabled={editSaving} className="bg-indigo-600 hover:bg-indigo-700">
                  {editSaving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Esta acción no se puede deshacer. Se eliminará permanentemente a{" "}
                <span className="font-semibold text-white">{selectedStudent?.name}</span> y todos sus datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStudent}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
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
