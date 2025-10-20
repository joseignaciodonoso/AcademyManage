"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Save, Star } from "lucide-react"
import type { Match } from "@/lib/types/club"

interface Player {
  id: string
  name: string
  playerProfile?: {
    position: string
    preferredNumber?: number
  }
}

interface PlayerEvaluation {
  playerId: string
  technique: number
  tactics: number
  physical: number
  attitude: number
  comments: string
}

export default function MatchEvaluationPage() {
  const params = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [evaluations, setEvaluations] = useState<Record<string, PlayerEvaluation>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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
      // Get players from callup
      const response = await fetch(`/api/club/matches/${params.id}/callup`)
      if (response.ok) {
        const data = await response.json()
        if (data.callup?.players) {
          const playersList = data.callup.players.map((cp: any) => cp.player)
          setPlayers(playersList)
          
          // Initialize evaluations
          const initialEvals: Record<string, PlayerEvaluation> = {}
          playersList.forEach((player: Player) => {
            initialEvals[player.id] = {
              playerId: player.id,
              technique: 5,
              tactics: 5,
              physical: 5,
              attitude: 5,
              comments: "",
            }
          })
          setEvaluations(initialEvals)
        }
      }
    } catch (error) {
      console.error("Error fetching players:", error)
    }
  }

  const updateEvaluation = (
    playerId: string,
    field: keyof PlayerEvaluation,
    value: number | string
  ) => {
    setEvaluations(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const evaluationsArray = Object.values(evaluations)

      const response = await fetch(`/api/club/matches/${params.id}/evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluations: evaluationsArray }),
      })

      if (response.ok) {
        setSuccess("Evaluaciones guardadas exitosamente")
        setTimeout(() => {
          router.push(`/${params.orgSlug}/club/matches`)
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || "Error al guardar evaluaciones")
      }
    } catch (error) {
      console.error("Error saving evaluations:", error)
      setError("Error al guardar evaluaciones")
    } finally {
      setSaving(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excelente"
    if (score >= 8) return "Muy Bueno"
    if (score >= 7) return "Bueno"
    if (score >= 6) return "Aceptable"
    if (score >= 5) return "Regular"
    return "Necesita Mejorar"
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

  if (players.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            No hay jugadores convocados para este partido. Primero debes crear la convocatoria.
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => router.push(`/${params.orgSlug}/club/matches/${params.id}/callup`)}
        >
          Ir a Convocatoria
        </Button>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold">Evaluación de Jugadores</h1>
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

      {/* Evaluation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Criterios de Evaluación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <h4 className="font-semibold mb-1">Técnica</h4>
              <p className="text-sm text-muted-foreground">
                Habilidades individuales, control, precisión
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Táctica</h4>
              <p className="text-sm text-muted-foreground">
                Posicionamiento, lectura del juego, decisiones
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Físico</h4>
              <p className="text-sm text-muted-foreground">
                Velocidad, resistencia, fuerza, agilidad
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Actitud</h4>
              <p className="text-sm text-muted-foreground">
                Compromiso, disciplina, trabajo en equipo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Evaluations */}
      <div className="space-y-4">
        {players.map((player) => {
          const eval = evaluations[player.id]
          if (!eval) return null

          const avgScore = (eval.technique + eval.tactics + eval.physical + eval.attitude) / 4

          return (
            <Card key={player.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{player.name}</CardTitle>
                    <CardDescription>
                      {player.playerProfile?.position}
                      {player.playerProfile?.preferredNumber && ` • #${player.playerProfile.preferredNumber}`}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                      {avgScore.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getScoreLabel(avgScore)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Technique */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Técnica</Label>
                    <span className={`font-bold ${getScoreColor(eval.technique)}`}>
                      {eval.technique}/10
                    </span>
                  </div>
                  <Slider
                    value={[eval.technique]}
                    onValueChange={([value]) => updateEvaluation(player.id, "technique", value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Tactics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Táctica</Label>
                    <span className={`font-bold ${getScoreColor(eval.tactics)}`}>
                      {eval.tactics}/10
                    </span>
                  </div>
                  <Slider
                    value={[eval.tactics]}
                    onValueChange={([value]) => updateEvaluation(player.id, "tactics", value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Physical */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Físico</Label>
                    <span className={`font-bold ${getScoreColor(eval.physical)}`}>
                      {eval.physical}/10
                    </span>
                  </div>
                  <Slider
                    value={[eval.physical]}
                    onValueChange={([value]) => updateEvaluation(player.id, "physical", value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Attitude */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Actitud</Label>
                    <span className={`font-bold ${getScoreColor(eval.attitude)}`}>
                      {eval.attitude}/10
                    </span>
                  </div>
                  <Slider
                    value={[eval.attitude]}
                    onValueChange={([value]) => updateEvaluation(player.id, "attitude", value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Comments */}
                <div className="space-y-2">
                  <Label>Comentarios</Label>
                  <Textarea
                    placeholder="Observaciones sobre el desempeño del jugador..."
                    value={eval.comments}
                    onChange={(e) => updateEvaluation(player.id, "comments", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
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
          {saving ? "Guardando..." : "Guardar Evaluaciones"}
        </Button>
      </div>
    </div>
  )
}
