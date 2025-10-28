"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BarChart3, Activity, Calendar, Trophy, Users, ArrowLeft } from "lucide-react"

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

interface PlayerMetrics {
  id: string
  goals?: number
  assists?: number
  matches?: number
  rating?: number
  minutes?: number
  trend?: number[]
}

export default function PlayerDetailPage() {
  const params = useParams() as { id: string; orgSlug: string }
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<PlayerMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)

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

  useEffect(() => {
    const loadMetrics = async () => {
      if (!member) return
      try {
        setMetricsLoading(true)
        const res = await fetch(`/api/club/metrics?ids=${encodeURIComponent(member.id)}`)
        if (res.ok) {
          const data: PlayerMetrics[] = await res.json()
          setMetrics(data.find(d => d.id === member.id) || null)
        }
      } catch (e) {
        // noop
      } finally {
        setMetricsLoading(false)
      }
    }
    loadMetrics()
  }, [member])

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
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
        <Button className="ml-auto" variant="ghost" size="sm" onClick={() => router.push(`/${params.orgSlug}/club/members`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a jugadores
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--primary))]/10 to-transparent border-[hsl(var(--primary))]/30">
          <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-[hsl(var(--primary))]/15" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Goles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.goals ?? "—"}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--accent))]/10 to-transparent border-[hsl(var(--accent))]/30">
          <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-[hsl(var(--accent))]/15" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Asistencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.assists ?? "—"}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
          <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-green-500/15" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Partidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.matches ?? "—"}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30">
          <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-amber-500/15" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.rating ?? "—"}</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30">
          <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-purple-500/15" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Minutos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.minutes ?? "—"}</div>
          </CardContent>
        </Card>
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
              <CardDescription>Rendimiento reciente</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : metrics?.trend && metrics.trend.length > 1 ? (
                <div className="w-full">
                  {/* Sparkline simple con SVG */}
                  {(() => {
                    const values = metrics.trend!
                    const width = 600
                    const height = 120
                    const pad = 12
                    const min = Math.min(...values)
                    const max = Math.max(...values)
                    const scaleX = (i: number) => pad + (i * (width - 2 * pad)) / (values.length - 1)
                    const scaleY = (v: number) => height - pad - ((v - min) * (height - 2 * pad)) / Math.max(1, max - min)
                    const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ')
                    return (
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
                        <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                        {values.map((v, i) => (
                          <circle key={i} cx={scaleX(i)} cy={scaleY(v)} r="2.5" fill="hsl(var(--primary))" />
                        ))}
                      </svg>
                    )
                  })()}
                  <div className="mt-2 text-sm text-muted-foreground">Trend de desempeño (últimos períodos)</div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sin datos de tendencia disponibles.</p>
              )}
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
      {/* Mobile sticky back button */}
      <Button
        onClick={() => router.push(`/${params.orgSlug}/club/members`)}
        className="sm:hidden fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg"
        variant="default"
        size="icon"
        aria-label="Volver a jugadores"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
    </div>
  )
}
