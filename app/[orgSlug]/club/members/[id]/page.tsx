"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BarChart3, Activity, Calendar, Trophy, Users } from "lucide-react"

interface Member {
  id: string
  name: string
  email: string
  role: string
  playerProfile?: {
    position?: string
    jerseyNumber?: number
    joinDate?: string
  }
}

export default function PlayerDetailPage() {
  const params = useParams() as { id: string; orgSlug: string }
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/club/members`)
        if (res.ok) {
          const data = await res.json()
          const m = (data.members as Member[]).find((x) => x.id === params.id) || null
          setMember(m)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const initials = (name: string) => name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando jugador...</p>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Jugador no encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback>{initials(member.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{member.name}</h1>
          <p className="text-muted-foreground text-sm">{member.email}</p>
          <p className="text-muted-foreground text-sm">
            {member.playerProfile?.position ? `Posición: ${member.playerProfile.position}` : "Posición: -"} · {member.playerProfile?.jerseyNumber ? `#${member.playerProfile.jerseyNumber}` : "#-"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="attendance">Asistencia</TabsTrigger>
          <TabsTrigger value="matches">Partidos</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Información básica del jugador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{member.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posición</p>
                  <p className="font-medium">{member.playerProfile?.position || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-medium">{member.playerProfile?.jerseyNumber ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingreso</p>
                  <p className="font-medium">{member.playerProfile?.joinDate ? new Date(member.playerProfile.joinDate).toLocaleDateString('es-CL') : "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5"/>Estadísticas</CardTitle>
              <CardDescription>Rendimiento por temporada</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Próximamente: puntos, rebotes, asistencias, robos, bloqueos, pérdidas, minutos.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5"/>Asistencia a Entrenamientos</CardTitle>
              <CardDescription>Registro y porcentaje</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Próximamente: asistencia por sesión y % del período.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matches */}
        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5"/>Historial de Partidos</CardTitle>
              <CardDescription>Últimos partidos y desempeño</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Próximamente: lista de partidos con puntajes y rating.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
