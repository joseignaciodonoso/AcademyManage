"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Target, Users, ArrowLeft, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface TrainingSession {
  id: string
  date: string
  startTime?: string
  endTime?: string
  duration: number
  location: string
  focus?: string
  notes?: string
  status: string
  attendance: Array<{
    id: string
    status: string
    player: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function TrainingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<TrainingSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [params.id])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/club/training-sessions/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSession(data.session)
      } else {
        toast.error("Error al cargar entrenamiento")
        router.back()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al cargar entrenamiento")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este entrenamiento?")) return

    try {
      const response = await fetch(`/api/club/training-sessions/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Entrenamiento eliminado")
        router.push(`/${params.orgSlug}/club/trainings`)
      } else {
        toast.error("Error al eliminar entrenamiento")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al eliminar entrenamiento")
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando entrenamiento...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Entrenamiento no encontrado</p>
      </div>
    )
  }

  const presentPlayers = session.attendance.filter(a => a.status === "PRESENT").length
  const totalPlayers = session.attendance.length
  const attendanceRate = totalPlayers > 0 ? (presentPlayers / totalPlayers) * 100 : 0

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold capitalize">
                {formatDate(session.date)}
              </h1>
              {getStatusBadge(session.status)}
            </div>
            {session.focus && (
              <Badge variant="secondary" className="mb-2">
                {session.focus}
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${params.orgSlug}/club/trainings/${session.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Entrenamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <div>
                <p className="text-xs">Fecha</p>
                <p className="font-medium text-foreground">{formatDate(session.date)}</p>
              </div>
            </div>

            {(session.startTime || session.endTime) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <div>
                  <p className="text-xs">Horario</p>
                  <p className="font-medium text-foreground">
                    {session.startTime && session.endTime
                      ? `${session.startTime} - ${session.endTime}`
                      : session.startTime || session.endTime}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <div>
                <p className="text-xs">Duración</p>
                <p className="font-medium text-foreground">{session.duration} minutos</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <div>
                <p className="text-xs">Ubicación</p>
                <p className="font-medium text-foreground">{session.location}</p>
              </div>
            </div>
          </div>

          {session.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Notas / Objetivos</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {session.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Asistencia</CardTitle>
              <CardDescription>
                {presentPlayers} de {totalPlayers} jugadores presentes
                {totalPlayers > 0 && ` (${attendanceRate.toFixed(0)}%)`}
              </CardDescription>
            </div>
            {session.status === "SCHEDULED" && (
              <Button
                onClick={() => router.push(`/${params.orgSlug}/club/trainings/${session.id}/attendance`)}
              >
                <Users className="h-4 w-4 mr-2" />
                Tomar Asistencia
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {session.attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay registros de asistencia aún
            </p>
          ) : (
            <div className="space-y-2">
              {session.attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{record.player.name}</p>
                    <p className="text-xs text-muted-foreground">{record.player.email}</p>
                  </div>
                  <Badge
                    variant={record.status === "PRESENT" ? "default" : "outline"}
                    className={
                      record.status === "PRESENT"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : record.status === "JUSTIFIED"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {record.status === "PRESENT"
                      ? "Presente"
                      : record.status === "JUSTIFIED"
                      ? "Justificado"
                      : "Ausente"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
