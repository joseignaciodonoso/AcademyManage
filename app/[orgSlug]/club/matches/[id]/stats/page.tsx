"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, ArrowLeft } from "lucide-react"
import type { Match, MatchPlayerStat, UpdateMatchStatsPayload } from "@/lib/types/club"

interface Player {
  id: string
  name: string
  playerProfile?: {
    position: string
    preferredNumber?: number
  }
}

export default function MatchStatsPage() {
  const params = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<Record<string, UpdateMatchStatsPayload>>({})
  const [existingStats, setExistingStats] = useState<MatchPlayerStat[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchMatchAndStats()
    fetchPlayers()
  }, [])

  const fetchMatchAndStats = async () => {
    try {
      const response = await fetch(`/api/club/matches/${params.id}/stats`)
      if (response.ok) {
        const data = await response.json()
        setMatch(data.match)
        setExistingStats(data.stats)
        
        // Initialize stats from existing
        const initialStats: Record<string, UpdateMatchStatsPayload> = {}
        data.stats.forEach((stat: MatchPlayerStat) => {
          initialStats[stat.playerId] = {
            playerId: stat.playerId,
            goals: stat.goals,
            assists: stat.assists,
            yellow: stat.yellow,
            red: stat.red,
            points: stat.points,
            rebounds: stat.rebounds,
            steals: stat.steals,
            blocks: stat.blocks,
            fouls: stat.fouls,
            minutes: stat.minutes,
          }
        })
        setStats(initialStats)
      }
    } catch (error) {
      console.error("Error fetching match:", error)
      setError("Error al cargar el partido")
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayers = async () => {
    try {
      // Get all players from academy (you'll need to create this endpoint)
      const response = await fetch(`/api/club/members`)
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching players:", error)
    }
  }

  const updateStat = (playerId: string, field: keyof UpdateMatchStatsPayload, value: number) => {
    setStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        playerId,
        [field]: value,
      }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      // Only send stats that have been modified
      const statsToSend = Object.values(stats).filter(stat => {
        // Check if any field has a value > 0
        return stat.goals || stat.assists || stat.yellow || stat.red ||
               stat.points || stat.rebounds || stat.steals || stat.blocks ||
               stat.fouls || stat.minutes
      })

      const response = await fetch(`/api/club/matches/${params.id}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: statsToSend }),
      })

      if (response.ok) {
        setSuccess("Estadísticas guardadas exitosamente")
        // Refresh data
        await fetchMatchAndStats()
      } else {
        const data = await response.json()
        setError(data.error || "Error al guardar estadísticas")
      }
    } catch (error) {
      console.error("Error saving stats:", error)
      setError("Error al guardar estadísticas")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando partido...</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Partido no encontrado</p>
      </div>
    )
  }

  const isFootball = match.sport === "FOOTBALL"

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
        <div>
          <h1 className="text-3xl font-bold">Estadísticas del Partido</h1>
          <p className="text-muted-foreground">
            vs {match.opponent} - {new Date(match.date).toLocaleDateString('es-CL')}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isFootball ? "⚽ Estadísticas de Fútbol" : "🏀 Estadísticas de Básquetbol"}
          </CardTitle>
          <CardDescription>
            Ingresa las estadísticas de cada jugador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {players.map((player) => {
              const playerStats = stats[player.id] || {}
              
              return (
                <div key={player.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{player.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {player.playerProfile?.position}
                        {player.playerProfile?.preferredNumber && ` • #${player.playerProfile.preferredNumber}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {isFootball ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-goals`}>Goles</Label>
                          <Input
                            id={`${player.id}-goals`}
                            type="number"
                            min="0"
                            value={playerStats.goals || 0}
                            onChange={(e) => updateStat(player.id, "goals", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-assists`}>Asistencias</Label>
                          <Input
                            id={`${player.id}-assists`}
                            type="number"
                            min="0"
                            value={playerStats.assists || 0}
                            onChange={(e) => updateStat(player.id, "assists", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-yellow`}>T. Amarillas</Label>
                          <Input
                            id={`${player.id}-yellow`}
                            type="number"
                            min="0"
                            max="2"
                            value={playerStats.yellow || 0}
                            onChange={(e) => updateStat(player.id, "yellow", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-red`}>T. Rojas</Label>
                          <Input
                            id={`${player.id}-red`}
                            type="number"
                            min="0"
                            max="1"
                            value={playerStats.red || 0}
                            onChange={(e) => updateStat(player.id, "red", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-points`}>Puntos</Label>
                          <Input
                            id={`${player.id}-points`}
                            type="number"
                            min="0"
                            value={playerStats.points || 0}
                            onChange={(e) => updateStat(player.id, "points", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-rebounds`}>Rebotes</Label>
                          <Input
                            id={`${player.id}-rebounds`}
                            type="number"
                            min="0"
                            value={playerStats.rebounds || 0}
                            onChange={(e) => updateStat(player.id, "rebounds", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-assists`}>Asistencias</Label>
                          <Input
                            id={`${player.id}-assists`}
                            type="number"
                            min="0"
                            value={playerStats.assists || 0}
                            onChange={(e) => updateStat(player.id, "assists", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-steals`}>Robos</Label>
                          <Input
                            id={`${player.id}-steals`}
                            type="number"
                            min="0"
                            value={playerStats.steals || 0}
                            onChange={(e) => updateStat(player.id, "steals", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-blocks`}>Tapas</Label>
                          <Input
                            id={`${player.id}-blocks`}
                            type="number"
                            min="0"
                            value={playerStats.blocks || 0}
                            onChange={(e) => updateStat(player.id, "blocks", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${player.id}-fouls`}>Faltas</Label>
                          <Input
                            id={`${player.id}-fouls`}
                            type="number"
                            min="0"
                            max="6"
                            value={playerStats.fouls || 0}
                            onChange={(e) => updateStat(player.id, "fouls", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor={`${player.id}-minutes`}>Minutos</Label>
                      <Input
                        id={`${player.id}-minutes`}
                        type="number"
                        min="0"
                        max="120"
                        value={playerStats.minutes || 0}
                        onChange={(e) => updateStat(player.id, "minutes", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Estadísticas"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
