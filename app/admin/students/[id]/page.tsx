"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Award,
  Target,
  Activity,
  Building2,
  Edit,
  MoreVertical
} from "lucide-react"
import { toast } from "sonner"

interface Student {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  role: string
  belt: string | null
  level: string | null
  membership: {
    id: string
    status: string
    startDate: string
    nextBillingDate: string | null
    plan: {
      id: string
      name: string
      type: string
      price: number
      currency: string
    }
  } | null
  branch: {
    id: string
    name: string
  } | null
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  method: string | null
  paidAt: string | null
  createdAt: string
  transactionId: string | null
}

interface AttendanceRecord {
  id: string
  date: string
  checkInTime: string | null
  status: string
  className: string | null
}

const formatCurrency = (amount: number, currency: string = "CLP") => {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency }).format(amount)
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PAID":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Pagado</Badge>
    case "PENDING":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
    case "FAILED":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>
    case "CANCELED":
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getMembershipStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Activa</Badge>
    case "EXPIRED":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Vencida</Badge>
    case "PENDING":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendiente</Badge>
    case "CANCELED":
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Cancelada</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function StudentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/students/${studentId}`)
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Alumno no encontrado")
          router.push("/admin/students")
          return
        }
        throw new Error("Error al cargar alumno")
      }
      const data = await res.json()
      setStudent(data.student)
    } catch (e) {
      console.error("Error fetching student:", e)
      toast.error("Error al cargar información del alumno")
    } finally {
      setLoading(false)
    }
  }, [studentId, router])

  const fetchPayments = useCallback(async () => {
    try {
      setPaymentsLoading(true)
      const res = await fetch(`/api/admin/students/${studentId}/payments`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
      }
    } catch (e) {
      console.error("Error fetching payments:", e)
    } finally {
      setPaymentsLoading(false)
    }
  }, [studentId])

  const fetchAttendance = useCallback(async () => {
    try {
      setAttendanceLoading(true)
      const res = await fetch(`/api/admin/students/${studentId}/attendance`)
      if (res.ok) {
        const data = await res.json()
        setAttendance(data.attendance || [])
      }
    } catch (e) {
      console.error("Error fetching attendance:", e)
    } finally {
      setAttendanceLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchStudent()
    fetchPayments()
    fetchAttendance()
  }, [fetchStudent, fetchPayments, fetchAttendance])

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const totalPaid = payments.filter(p => p.status === "PAID").reduce((acc, p) => acc + p.amount, 0)
  const pendingPayments = payments.filter(p => p.status === "PENDING").length
  const attendanceRate = attendance.length > 0 
    ? Math.round((attendance.filter(a => a.status === "PRESENT").length / attendance.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background p-6">
        <div className="container mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Perfil del Alumno</h1>
            <p className="text-muted-foreground">Información detallada y historial</p>
          </div>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{student.name}</h2>
                <p className="text-muted-foreground">{student.email}</p>
                
                {student.membership && (
                  <div className="mt-3">
                    {getMembershipStatusBadge(student.membership.status)}
                  </div>
                )}

                <Separator className="my-4" />

                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{student.email}</span>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Registrado: {formatDate(student.createdAt)}</span>
                  </div>
                  {student.branch && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.branch.name}</span>
                    </div>
                  )}
                  {student.belt && (
                    <div className="flex items-center gap-3">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Cinturón: {student.belt}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats and Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pagado</p>
                      <p className="text-lg font-bold">{formatCurrency(totalPaid)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pendientes</p>
                      <p className="text-lg font-bold">{pendingPayments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Asistencia</p>
                      <p className="text-lg font-bold">{attendanceRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Target className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clases</p>
                      <p className="text-lg font-bold">{attendance.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Membership Info */}
            {student.membership && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Membresía Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="font-medium">{student.membership.plan.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Precio</p>
                      <p className="font-medium">{formatCurrency(student.membership.plan.price, student.membership.plan.currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Inicio</p>
                      <p className="font-medium">{formatDate(student.membership.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Próximo Pago</p>
                      <p className="font-medium">
                        {student.membership.nextBillingDate 
                          ? formatDate(student.membership.nextBillingDate)
                          : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="payments">
              <TabsList>
                <TabsTrigger value="payments">Historial de Pagos</TabsTrigger>
                <TabsTrigger value="attendance">Asistencia</TabsTrigger>
              </TabsList>

              <TabsContent value="payments" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {paymentsLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      </div>
                    ) : payments.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No hay pagos registrados
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {payment.paidAt ? formatDateTime(payment.paidAt) : formatDateTime(payment.createdAt)}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(payment.amount, payment.currency)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(payment.status)}
                              </TableCell>
                              <TableCell>
                                {payment.method === "TRANSFER" ? "Transferencia" : 
                                 payment.method === "CASH" ? "Efectivo" : 
                                 payment.method || "-"}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {payment.transactionId || payment.id.slice(-8)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attendance" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {attendanceLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      </div>
                    ) : attendance.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No hay registros de asistencia
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Clase</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendance.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{formatDate(record.date)}</TableCell>
                              <TableCell>
                                {record.checkInTime 
                                  ? new Date(record.checkInTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
                                  : "-"}
                              </TableCell>
                              <TableCell>{record.className || "-"}</TableCell>
                              <TableCell>
                                {record.status === "PRESENT" ? (
                                  <Badge className="bg-green-500/20 text-green-400">Presente</Badge>
                                ) : record.status === "ABSENT" ? (
                                  <Badge className="bg-red-500/20 text-red-400">Ausente</Badge>
                                ) : (
                                  <Badge variant="secondary">{record.status}</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
