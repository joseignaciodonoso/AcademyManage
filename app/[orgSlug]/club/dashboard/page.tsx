"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Target, TrendingUp, Users, Calendar, Activity, BarChart3 } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import type { TeamMetrics } from "@/lib/types/club"

export default function ClubDashboardPage() {
  const params = useParams()
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState<"FOOTBALL" | "BASKETBALL">("FOOTBALL")
  const [period, setPeriod] = useState("30d")

  useEffect(() => {
    fetchMetrics()
  }, [sport, period])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/club/metrics/team?sport=${sport}&period=${period}`)
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
          <p className="text-muted-foreground">Cargando métricas...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    )
  }

  const winRate = metrics.winRate.toFixed(1)
  const record = sport === "FOOTBALL" 
    ? `${metrics.wins}W - ${metrics.draws}D - ${metrics.losses}L`
    : `${metrics.wins}W - ${metrics.losses}L`

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard del Club</h1>
          <p className="text-muted-foreground">Métricas y estadísticas del equipo</p>
        </div>
        
        <div className="flex gap-2">
          {/* Sport Selector */}
          <Tabs value={sport} onValueChange={(v) => setSport(v as "FOOTBALL" | "BASKETBALL")}>
            <TabsList>
              <TabsTrigger value="FOOTBALL">⚽ Fútbol</TabsTrigger>
              <TabsTrigger value="BASKETBALL">🏀 Básquet</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Period Selector */}
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
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Record */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récord</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{record}</div>
            <p className="text-xs text-muted-foreground">
              {winRate}% de victorias
            </p>
          </CardContent>
        </Card>

        {/* Offensive */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {sport === "FOOTBALL" ? "Goles a Favor" : "Puntos a Favor"}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sport === "FOOTBALL" ? metrics.totalGoalsFor : metrics.totalPointsFor}
            </div>
            <p className="text-xs text-muted-foreground">
              {sport === "FOOTBALL" 
                ? `${metrics.avgGoalsPerMatch?.toFixed(1)} por partido`
                : `${metrics.avgPointsPerMatch?.toFixed(1)} por partido`
              }
            </p>
          </CardContent>
        </Card>

        {/* Defensive */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {sport === "FOOTBALL" ? "Goles en Contra" : "Puntos en Contra"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sport === "FOOTBALL" ? metrics.totalGoalsAgainst : metrics.totalPointsAgainst}
            </div>
            <p className="text-xs text-muted-foreground">
              {sport === "FOOTBALL" 
                ? `${metrics.avgGoalsAgainstPerMatch?.toFixed(1)} por partido`
                : `${metrics.avgPointsAgainstPerMatch?.toFixed(1)} por partido`
              }
            </p>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.avgTrainingAttendance.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Entrenamientos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers and Recent Matches */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top Performers</CardTitle>
            <CardDescription>Mejores jugadores del período</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="scorers">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="scorers">
                  {sport === "FOOTBALL" ? "Goles" : "Puntos"}
                </TabsTrigger>
                <TabsTrigger value="assists">Asistencias</TabsTrigger>
                {sport === "BASKETBALL" && (
                  <TabsTrigger value="rebounds">Rebotes</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="scorers" className="space-y-2">
                {metrics.topScorers.slice(0, 5).map((player, index) => (
                  <div key={player.playerId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{player.playerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.matchesPlayed} partidos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{player.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.perMatch.toFixed(1)}/partido
                      </p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="assists" className="space-y-2">
                {metrics.topAssists.slice(0, 5).map((player, index) => (
                  <div key={player.playerId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{player.playerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.matchesPlayed} partidos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{player.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.perMatch.toFixed(1)}/partido
                      </p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {sport === "BASKETBALL" && metrics.topRebounds && (
                <TabsContent value="rebounds" className="space-y-2">
                  {metrics.topRebounds.slice(0, 5).map((player, index) => (
                    <div key={player.playerId} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{player.playerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {player.matchesPlayed} partidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{player.value}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.perMatch.toFixed(1)}/partido
                        </p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Form Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Forma Reciente
            </CardTitle>
            <CardDescription>Últimos 5 partidos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.recentMatches.reverse()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="opponent" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                            {data.scoreFor} - {data.scoreAgainst}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(data.date).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scoreFor" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Goles/Puntos"
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {metrics.recentMatches.slice().reverse().map((match) => {
                const resultColor = 
                  match.result === "WIN" ? "bg-green-500" :
                  match.result === "LOSS" ? "bg-red-500" :
                  "bg-yellow-500"
                
                const resultText = 
                  match.result === "WIN" ? "V" :
                  match.result === "LOSS" ? "D" :
                  "E"

                return (
                  <div key={match.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${resultColor}`}>
                        {resultText}
                      </div>
                      <div>
                        <p className="font-medium text-sm">vs {match.opponent}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.date).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {match.scoreFor} - {match.scoreAgainst}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <a
              href={`/${params.orgSlug}/club/training-sessions/new`}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer"
            >
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <p className="font-medium">Nuevo Entrenamiento</p>
            </a>

            <a
              href={`/${params.orgSlug}/club/matches/new`}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer"
            >
              <Trophy className="h-8 w-8 mb-2 text-primary" />
              <p className="font-medium">Nuevo Partido</p>
            </a>

            <a
              href={`/${params.orgSlug}/club/training-sessions`}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer"
            >
              <Users className="h-8 w-8 mb-2 text-primary" />
              <p className="font-medium">Pasar Asistencia</p>
            </a>

            <a
              href={`/${params.orgSlug}/club/matches`}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer"
            >
              <Activity className="h-8 w-8 mb-2 text-primary" />
              <p className="font-medium">Ver Partidos</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
