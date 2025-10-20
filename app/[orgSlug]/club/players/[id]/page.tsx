"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Target, Activity, TrendingUp, Calendar, Users } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts"
import type { PlayerMetrics } from "@/lib/types/club"

export default function PlayerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [metrics, setMetrics] = useState<PlayerMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30d")

  useEffect(() => {
    fetchMetrics()
  }, [period])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/club/metrics/player/${params.id}?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Jugador no encontrado</p>
      </div>
    )
  }

  const isFootball = metrics.sport === "FOOTBALL"

  // Prepare radar chart data for evaluations
  const radarData = metrics.avgTechnique ? [
    {
      category: "Técnica",
      value: metrics.avgTechnique,
      fullMark: 10,
    },
    {
      category: "Táctica",
      value: metrics.avgTactics || 0,
      fullMark: 10,
    },
    {
      category: "Físico",
      value: metrics.avgPhysical || 0,
      fullMark: 10,
    },
    {
      category: "Actitud",
      value: metrics.avgAttitude || 0,
      fullMark: 10,
    },
  ] : []

  // Prepare line chart data for recent performance
  const performanceData = metrics.recentStats.map((stat, index) => ({
    match: `P${metrics.recentStats.length - index}`,
    opponent: stat.opponent,
    value: isFootball ? stat.goals : stat.points,
    assists: stat.assists,
    minutes: stat.minutes,
  })).reverse()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{metrics.playerName}</h1>
          <p className="text-muted-foreground">
            {isFootball ? "⚽ Fútbol" : "🏀 Básquetbol"}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push(`/${params.orgSlug}/club/players/compare?player1=${params.id}`)}
        >
          <Users className="h-4 w-4 mr-2" />
          Comparar
        </Button>
        
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
          <option value="365d">Último año</option>
          <option value="all">Todo el tiempo</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.matchesPlayed}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.avgMinutesPerMatch.toFixed(0)} min/partido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isFootball ? "Goles" : "Puntos"}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isFootball ? metrics.totalGoals : metrics.totalPoints}
            </div>
            <p className="text-xs text-muted-foreground">
              {isFootball 
                ? `${metrics.goalsPerMatch?.toFixed(1)} por partido`
                : `${metrics.pointsPerGame?.toFixed(1)} por partido`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.trainingAttendanceRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Entrenamientos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avgOverall?.toFixed(1) || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio general
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento Reciente</CardTitle>
            <CardDescription>Últimos 5 partidos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="match" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.opponent}</p>
                          <p className="text-sm">
                            {isFootball ? "Goles" : "Puntos"}: {data.value}
                          </p>
                          <p className="text-sm">Asistencias: {data.assists}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.minutes} minutos
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name={isFootball ? "Goles" : "Puntos"}
                />
                <Line 
                  type="monotone" 
                  dataKey="assists" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Asistencias"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evaluation Radar */}
        {radarData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluación Integral</CardTitle>
              <CardDescription>Promedios por criterio</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Radar 
                    name="Evaluación" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6} 
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="attendance">Asistencia</TabsTrigger>
          <TabsTrigger value="recent">Últimos Partidos</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Detalladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {isFootball ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Ofensiva</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goles totales:</span>
                          <span className="font-medium">{metrics.totalGoals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goles por partido:</span>
                          <span className="font-medium">{metrics.goalsPerMatch?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goles por 90 min:</span>
                          <span className="font-medium">{metrics.goalsPer90?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asistencias:</span>
                          <span className="font-medium">{metrics.totalAssists}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asistencias por 90 min:</span>
                          <span className="font-medium">{metrics.assistsPer90?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Disciplina</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tarjetas amarillas:</span>
                          <span className="font-medium">{metrics.yellowCards}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tarjetas rojas:</span>
                          <span className="font-medium">{metrics.redCards}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Minutos jugados:</span>
                          <span className="font-medium">{metrics.minutesPlayed}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Ofensiva</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Puntos totales:</span>
                          <span className="font-medium">{metrics.totalPoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Puntos por partido:</span>
                          <span className="font-medium">{metrics.pointsPerGame?.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Puntos por 36 min:</span>
                          <span className="font-medium">{metrics.pointsPer36?.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asistencias:</span>
                          <span className="font-medium">{metrics.totalAssists}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asistencias por 36 min:</span>
                          <span className="font-medium">{metrics.assistsPer36?.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Defensiva/Otras</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rebotes:</span>
                          <span className="font-medium">{metrics.totalRebounds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rebotes por partido:</span>
                          <span className="font-medium">{metrics.reboundsPerGame?.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Robos:</span>
                          <span className="font-medium">{metrics.totalSteals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tapas:</span>
                          <span className="font-medium">{metrics.totalBlocks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Faltas:</span>
                          <span className="font-medium">{metrics.fouls}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asistencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Entrenamientos</span>
                    <span className="text-2xl font-bold">{metrics.trainingAttendanceRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${metrics.trainingAttendanceRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Convocatorias</span>
                    <span className="text-2xl font-bold">{metrics.matchAttendanceRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${metrics.matchAttendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimos Partidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">vs {stat.opponent}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(stat.date).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {isFootball 
                          ? `${stat.goals} goles, ${stat.assists} asist.`
                          : `${stat.points} pts, ${stat.rebounds} reb.`
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.minutes} minutos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
