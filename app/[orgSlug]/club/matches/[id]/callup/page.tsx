"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, Check, X, Search, Star, UserPlus, UserMinus, Shield, Target } from "lucide-react"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState<"available" | "selected">("available")

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

  const filteredPlayers = availablePlayers.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.playerProfile?.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedPlayers = [...starters, ...substitutes]
  const getPlayerStatus = (playerId: string) => {
    if (starters.includes(playerId)) return "starter"
    if (substitutes.includes(playerId)) return "substitute"
    return "available"
  }

  const getPositionIcon = (position?: string) => {
    if (!position) return <Users className="h-4 w-4" />
    const pos = position.toLowerCase()
    if (pos.includes("portero") || pos.includes("goalkeeper")) return <Shield className="h-4 w-4" />
    if (pos.includes("delantero") || pos.includes("forward")) return <Target className="h-4 w-4" />
    return <Users className="h-4 w-4" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
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
          <h1 className="text-3xl font-bold">Convocatoria</h1>
          <p className="text-muted-foreground">
            vs {match.opponent} - {new Date(match.date).toLocaleDateString('es-CL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {starters.length + substitutes.length} convocados
          </Badge>
          <Badge variant={starters.length === maxStarters ? "default" : "secondary"}>
            {starters.length}/{maxStarters} titulares
          </Badge>
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

      {/* Formation Selection (Football only) */}
      {isFootball && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Formación Táctica
            </CardTitle>
            <CardDescription>Selecciona la formación del equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "3-4-3", "5-3-2"].map(f => (
                <Button
                  key={f}
                  variant={formation === f ? "default" : "outline"}
                  onClick={() => setFormation(f)}
                  className="min-w-[80px]"
                >
                  {f}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Player Selection */}
        <div className="space-y-6">
          {/* Search and Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Selección de Jugadores
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={selectedTab === "available" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTab("available")}
                  >
                    Disponibles ({filteredPlayers.length})
                  </Button>
                  <Button
                    variant={selectedTab === "selected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTab("selected")}
                  >
                    Convocados ({selectedPlayers.length})
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar jugadores por nombre o posición..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {selectedTab === "available" ? (
                <div className="space-y-2">
                  {filteredPlayers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {searchTerm ? "No se encontraron jugadores" : "Todos los jugadores están convocados"}
                    </p>
                  ) : (
                    filteredPlayers.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border hover:border-primary/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-background rounded-full">
                            {getPositionIcon(player.playerProfile?.position)}
                          </div>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{player.playerProfile?.position || "Sin posición"}</span>
                              {player.playerProfile?.preferredNumber && (
                                <>
                                  <span>•</span>
                                  <span>#{player.playerProfile.preferredNumber}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStarter(player.id)}
                            disabled={starters.length >= maxStarters}
                            className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Titular
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSubstitute(player.id)}
                            className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Suplente
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedPlayers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay jugadores convocados
                    </p>
                  ) : (
                    selectedPlayers.map(playerId => {
                      const player = players.find(p => p.id === playerId)
                      if (!player) return null
                      const status = getPlayerStatus(playerId)
                      
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                            status === "starter" 
                              ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                              : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              status === "starter" ? "bg-green-100 dark:bg-green-900" : "bg-yellow-100 dark:bg-yellow-900"
                            }`}>
                              {status === "starter" ? (
                                <Star className="h-4 w-4 text-green-600" />
                              ) : (
                                <Users className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{player.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{player.playerProfile?.position || "Sin posición"}</span>
                                {player.playerProfile?.preferredNumber && (
                                  <>
                                    <span>•</span>
                                    <span>#{player.playerProfile.preferredNumber}</span>
                                  </>
                                )}
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {status === "starter" ? "Titular" : "Suplente"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => status === "starter" ? toggleStarter(player.id) : toggleSubstitute(player.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Resumen de Convocatoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Resumen de Convocatoria
              </CardTitle>
              <CardDescription>
                Estado actual de la selección
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{starters.length}</div>
                  <div className="text-sm text-muted-foreground">Titulares</div>
                  <div className="text-xs text-muted-foreground">de {maxStarters}</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{substitutes.length}</div>
                  <div className="text-sm text-muted-foreground">Suplentes</div>
                </div>
              </div>
              
              {starters.length < maxStarters && (
                <Alert>
                  <AlertDescription>
                    Faltan {maxStarters - starters.length} titulares por seleccionar
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Lista Rápida de Convocados */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Convocados</CardTitle>
              <CardDescription>Vista rápida de la selección</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {starters.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-green-600 mb-2">Titulares</h4>
                  <div className="space-y-1">
                    {starters.map(playerId => {
                      const player = players.find(p => p.id === playerId)
                      if (!player) return null
                      return (
                        <div key={player.id} className="flex items-center gap-2 text-sm">
                          <Star className="h-3 w-3 text-green-500" />
                          <span>{player.name}</span>
                          {player.playerProfile?.preferredNumber && (
                            <Badge variant="outline" className="text-xs">
                              #{player.playerProfile.preferredNumber}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {substitutes.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-yellow-600 mb-2">Suplentes</h4>
                  <div className="space-y-1">
                    {substitutes.map(playerId => {
                      const player = players.find(p => p.id === playerId)
                      if (!player) return null
                      return (
                        <div key={player.id} className="flex items-center gap-2 text-sm">
                          <Users className="h-3 w-3 text-yellow-500" />
                          <span>{player.name}</span>
                          {player.playerProfile?.preferredNumber && (
                            <Badge variant="outline" className="text-xs">
                              #{player.playerProfile.preferredNumber}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {starters.length === 0 && substitutes.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No hay jugadores convocados
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button
          onClick={handlePublish}
          disabled={saving || starters.length === 0}
          className="min-w-[160px]"
        >
          <Check className="h-4 w-4 mr-2" />
          {saving ? "Publicando..." : "Publicar Convocatoria"}
        </Button>
      </div>
    </div>
  )
}
