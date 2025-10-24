"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Users, Clock, MapPin, CheckCircle, XCircle, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TrainingSession {
  id: string
  date: string
  startTime: string
  endTime: string
  location: string
  focus: string
  notes?: string
  attendance?: {
    present: number
    total: number
  }
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED"
}

export default function TrainingsPage() {
  const params = useParams()
  const router = useRouter()
  // Redirect to the builder page to use the correct weekly schedules constructor
  useEffect(() => {
    if (params?.orgSlug) {
      router.replace(`/${params.orgSlug}/club/training`)
    }
  }, [])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"upcoming" | "past" | "all">("upcoming")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    filterSessions()
  }, [sessions, viewMode, statusFilter])

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/club/training-sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterSessions = () => {
    let filtered = [...sessions]
    const now = new Date()

    // View mode filter
    if (viewMode === "upcoming") {
      filtered = filtered.filter(s => new Date(s.date) >= now)
    } else if (viewMode === "past") {
      filtered = filtered.filter(s => new Date(s.date) < now)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return viewMode === "past" ? dateB - dateA : dateA - dateB
    })

    setFilteredSessions(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Programado</Badge>
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completado</Badge>
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getWeekday = (dateString: string) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const date = new Date(dateString)
    return days[date.getDay()]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getAttendanceColor = (present: number, total: number) => {
    const percentage = (present / total) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando entrenamientos...</p>
        </div>
      </div>
    )
  }

  const upcomingSessions = sessions.filter(s => new Date(s.date) >= new Date())
  const completedSessions = sessions.filter(s => s.status === "COMPLETED")
  const avgAttendance = completedSessions.length > 0
    ? completedSessions.reduce((acc, s) => acc + (s.attendance ? (s.attendance.present / s.attendance.total) * 100 : 0), 0) / completedSessions.length
    : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entrenamientos</h1>
          <p className="text-muted-foreground">
            Planifica y gestiona las sesiones de entrenamiento
          </p>
        </div>
        <Button onClick={() => router.push(`/${params.orgSlug}/club/trainings/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Entrenamiento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendance.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "upcoming" ? "default" : "outline"}
                onClick={() => setViewMode("upcoming")}
              >
                Próximos
              </Button>
              <Button
                variant={viewMode === "past" ? "default" : "outline"}
                onClick={() => setViewMode("past")}
              >
                Pasados
              </Button>
              <Button
                variant={viewMode === "all" ? "default" : "outline"}
                onClick={() => setViewMode("all")}
              >
                Todos
              </Button>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="SCHEDULED">Programado</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {viewMode === "upcoming"
                  ? "No hay entrenamientos próximos programados"
                  : "No hay entrenamientos en este período"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{getWeekday(session.date)}</h3>
                      {getStatusBadge(session.status)}
                      {session.focus && (
                        <Badge variant="secondary">{session.focus}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(session.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.startTime} - {session.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {session.location}
                      </span>
                    </div>

                    {session.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        📝 {session.notes}
                      </p>
                    )}

                    {session.attendance && (
                      <div className="mt-3">
                        <span className={`text-sm font-medium ${getAttendanceColor(session.attendance.present, session.attendance.total)}`}>
                          <Users className="h-4 w-4 inline mr-1" />
                          {session.attendance.present}/{session.attendance.total} jugadores presentes
                          ({((session.attendance.present / session.attendance.total) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {session.status === "SCHEDULED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/${params.orgSlug}/club/trainings/${session.id}/attendance`)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Asistencia
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/${params.orgSlug}/club/trainings/${session.id}`)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
