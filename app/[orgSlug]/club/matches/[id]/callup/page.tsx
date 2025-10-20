"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Check, X } from "lucide-react"
import type { Match } from "@/lib/types/club"

interface Player {
  id: string
  name: string
  playerProfile?: {
    position: string
    preferredNumber?: number
  }
}

export default function MatchCallupPage() {
  const params = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [starters, setStarters] = useState<string[]>([])
  const [substitutes, setSubstitutes] = useState<string[]>([])
  const [formation, setFormation] = useState("4-4-2")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const isFootball = match?.sport === "FOOTBALL"
  const maxStarters = isFootball ? 11 : 5

  useEffect(() => {
    fetchMatch()
    fetchPlayers()
  }, [])

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/club/matches/${params.id}/stats`)
      if (response.ok) {
        const data = await response.json()
        setMatch(data.match)
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
      const response = await fetch(`/api/club/members`)
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching players:", error)
    }
  }

  const toggleStarter = (playerId: string) => {
    if (starters.includes(playerId)) {
      setStarters(starters.filter(id => id !== playerId))
    } else {
      if (starters.length >= maxStarters) {
        setError(`Máximo ${maxStarters} titulares permitidos`)
        return
      }
      // Remove from substitutes if present
      setSubstitutes(substitutes.filter(id => id !== playerId))
      setStarters([...starters, playerId])
    }
    setError("")
  }

  const toggleSubstitute = (playerId: string) => {
    if (substitutes.includes(playerId)) {
      setSubstitutes(substitutes.filter(id => id !== playerId))
    } else {
      // Remove from starters if present
      setStarters(starters.filter(id => id !== playerId))
      setSubstitutes([...substitutes, playerId])
    }
    setError("")
  }

  const handlePublish = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      if (starters.length === 0) {
        setError("Debes seleccionar al menos un titular")
        return
      }

      const response = await fetch(`/api/club/matches/${params.id}/callup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation: isFootball ? formation : undefined,
          starters,
          substitutes,
        }),
      })

      if (response.ok) {
        setSuccess("Convocatoria publicada exitosamente")
        setTimeout(() => {
          router.push(`/${params.orgSlug}/club/matches`)
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || "Error al publicar convocatoria")
      }
    } catch (error) {
      console.error("Error publishing callup:", error)
      setError("Error al publicar convocatoria")
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

  const availablePlayers = players.filter(
    p => !starters.includes(p.id) && !substitutes.includes(p.id)
  )

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
          <h1 className="text-3xl font-bold">Convocatoria</h1>
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Titulares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Titulares</span>
              <Badge variant="secondary">{starters.length}/{maxStarters}</Badge>
            </CardTitle>
            <CardDescription>
              {isFootball ? "11 jugadores" : "5 jugadores"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {starters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Selecciona jugadores de la lista
              </p>
            ) : (
              starters.map(playerId => {
                const player = players.find(p => p.id === playerId)
                if (!player) return null
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div>
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.playerProfile?.position}
                        {player.playerProfile?.preferredNumber && ` • #${player.playerProfile.preferredNumber}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStarter(player.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Suplentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Suplentes</span>
              <Badge variant="secondary">{substitutes.length}</Badge>
            </CardTitle>
            <CardDescription>Jugadores de reserva</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {substitutes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Selecciona suplentes
              </p>
            ) : (
              substitutes.map(playerId => {
                const player = players.find(p => p.id === playerId)
                if (!player) return null
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800"
                  >
                    <div>
                      <p className="font-medium text-sm">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.playerProfile?.position}
                        {player.playerProfile?.preferredNumber && ` • #${player.playerProfile.preferredNumber}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSubstitute(player.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Jugadores Disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Disponibles
            </CardTitle>
            <CardDescription>Click para convocar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {availablePlayers.map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:border-primary transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {player.playerProfile?.position}
                    {player.playerProfile?.preferredNumber && ` • #${player.playerProfile.preferredNumber}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStarter(player.id)}
                    disabled={starters.length >= maxStarters}
                    title="Titular"
                  >
                    T
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSubstitute(player.id)}
                    title="Suplente"
                  >
                    S
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Formation (Football only) */}
      {isFootball && (
        <Card>
          <CardHeader>
            <CardTitle>Formación Táctica</CardTitle>
            <CardDescription>Selecciona la formación del equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "3-4-3"].map(f => (
                <Button
                  key={f}
                  variant={formation === f ? "default" : "outline"}
                  onClick={() => setFormation(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button
          onClick={handlePublish}
          disabled={saving || starters.length === 0}
        >
          <Check className="h-4 w-4 mr-2" />
          {saving ? "Publicando..." : "Publicar Convocatoria"}
        </Button>
      </div>
    </div>
  )
}
