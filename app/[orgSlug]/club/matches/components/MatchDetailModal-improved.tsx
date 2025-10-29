import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Star, Save, X, Edit, Trophy } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useEffect, useState } from "react"

interface Match {
  id: string
  sport: "FOOTBALL" | "BASKETBALL"
  date: string
  opponent: string
  location: string
  homeAway?: "HOME" | "AWAY"
  notes?: string
  status: "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED"
  goalsFor?: number
  goalsAgainst?: number
  pointsFor?: number
  pointsAgainst?: number
  result?: "WIN" | "DRAW" | "LOSS"
  tournamentId?: string | null
  tournament?: {
    id: string
    name: string
  }
}

interface Tournament {
  id: string
  name: string
  season: string
  type: string
}

interface MatchDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: Match | null
  editMode: boolean
  setEditMode: (mode: boolean) => void
  matchForm: {
    opponent: string
    location: string
    homeAway: "HOME" | "AWAY"
    date: string
    time: string
    notes: string
    goalsFor: string
    goalsAgainst: string
    pointsFor: string
    pointsAgainst: string
    sport: "FOOTBALL" | "BASKETBALL"
    tournamentId: string
  }
  setMatchForm: (form: any) => void
  onUpdate: () => void
  onNavigateToCallup: () => void
  onNavigateToEvaluation: () => void
}

export function MatchDetailModal({
  open,
  onOpenChange,
  match,
  editMode,
  setEditMode,
  matchForm,
  setMatchForm,
  onUpdate,
  onNavigateToCallup,
  onNavigateToEvaluation,
}: MatchDetailModalProps) {
  const isCreating = !match
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loadingTournaments, setLoadingTournaments] = useState(false)

  // Load tournaments when modal opens in create/edit mode
  useEffect(() => {
    if (open && (isCreating || editMode)) {
      loadTournaments()
    }
  }, [open, isCreating, editMode])

  const loadTournaments = async () => {
    try {
      setLoadingTournaments(true)
      const res = await fetch("/api/club/tournaments")
      if (res.ok) {
        const data = await res.json()
        setTournaments(data.tournaments || [])
      }
    } catch (error) {
      console.error("Error loading tournaments:", error)
    } finally {
      setLoadingTournaments(false)
    }
  }

  const getStatusBadge = () => {
    if (!match) return null
    switch (match.status) {
      case "SCHEDULED":
        return <Badge className="bg-blue-100 text-blue-700">Programado</Badge>
      case "IN_PROGRESS":
        return <Badge className="bg-green-100 text-green-700">En Curso</Badge>
      case "FINISHED":
        return <Badge className="bg-gray-100 text-gray-700">Finalizado</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700">Cancelado</Badge>
    }
  }

  const getResultBadge = () => {
    if (!match || !match.result) return null
    
    switch (match.result) {
      case "WIN":
        return <Badge className="bg-green-100 text-green-700">Victoria</Badge>
      case "DRAW":
        return <Badge className="bg-yellow-100 text-yellow-700">Empate</Badge>
      case "LOSS":
        return <Badge className="bg-red-100 text-red-700">Derrota</Badge>
    }
  }

  const getScore = () => {
    if (!match) return "- - -"
    if (match.sport === "FOOTBALL") {
      return match.goalsFor !== undefined && match.goalsAgainst !== undefined
        ? `${match.goalsFor} - ${match.goalsAgainst}`
        : "- - -"
    } else {
      return match.pointsFor !== undefined && match.pointsAgainst !== undefined
        ? `${match.pointsFor} - ${match.pointsAgainst}`
        : "- - -"
    }
  }

  const getSportLabel = (sport: "FOOTBALL" | "BASKETBALL") => {
    return sport === "FOOTBALL" ? "Fútbol" : "Básquetbol"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Crear Nuevo Partido" : editMode ? "Editar Partido" : "Detalles del Partido"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!editMode && !isCreating ? (
            // View Mode
            <>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Información</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Oponente</p>
                      <p className="font-medium text-lg">vs {match?.opponent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deporte</p>
                      <p className="font-medium">{match && getSportLabel(match.sport)}</p>
                    </div>
                    {match?.tournament && (
                      <div>
                        <p className="text-sm text-muted-foreground">Campeonato</p>
                        <Badge variant="outline" className="mt-1">
                          <Trophy className="h-3 w-3 mr-1" />
                          {match.tournament.name}
                        </Badge>
                      </div>
                    )}
                    {!match?.tournament && (
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo</p>
                        <Badge variant="secondary">Amistoso</Badge>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                      <p className="font-medium">
                        {match && format(new Date(match.date), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ubicación</p>
                      <p className="font-medium">{match?.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Local/Visita</p>
                      <Badge variant={match?.homeAway === "HOME" ? "default" : "secondary"}>
                        {match?.homeAway === "HOME" ? "Local" : "Visita"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      {match && getStatusBadge()}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-lg">Resultado</h3>
                  {match?.status === "FINISHED" ? (
                    <div className="space-y-3">
                      <div className="text-center p-6 bg-muted/30 rounded-lg">
                        <p className="font-mono text-4xl font-bold mb-2">
                          {getScore()}
                        </p>
                        {getResultBadge()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">Partido no finalizado</p>
                    </div>
                  )}
                </div>
              </div>

              {match?.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notas</h3>
                  <p className="text-muted-foreground">{match.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  className="flex-1"
                  onClick={onNavigateToCallup}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Convocar
                </Button>
                {match?.status === "FINISHED" && (
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={onNavigateToEvaluation}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Evaluar
                  </Button>
                )}
              </div>
            </>
          ) : (
            // Edit/Create Mode
            <>
              <div className="space-y-4">
                {/* Sport and Tournament Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Deporte *</Label>
                    <Select 
                      value={matchForm.sport} 
                      onValueChange={(value: "FOOTBALL" | "BASKETBALL") => setMatchForm({ ...matchForm, sport: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FOOTBALL">Fútbol</SelectItem>
                        <SelectItem value="BASKETBALL">Básquetbol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Campeonato</Label>
                    <Select 
                      value={matchForm.tournamentId || "FRIENDLY"} 
                      onValueChange={(value) => setMatchForm({ ...matchForm, tournamentId: value === "FRIENDLY" ? "" : value })}
                      disabled={loadingTournaments}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Amistoso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FRIENDLY">
                          <div className="flex items-center">
                            <span>Amistoso</span>
                          </div>
                        </SelectItem>
                        {tournaments.map((tournament) => (
                          <SelectItem key={tournament.id} value={tournament.id}>
                            <div className="flex items-center gap-2">
                              <Trophy className="h-3 w-3" />
                              <span>{tournament.name}</span>
                              <span className="text-xs text-muted-foreground">({tournament.season})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Si no seleccionas un campeonato, será un partido amistoso
                    </p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Oponente *</Label>
                    <Input
                      value={matchForm.opponent}
                      onChange={(e) => setMatchForm({ ...matchForm, opponent: e.target.value })}
                      placeholder="Nombre del equipo rival"
                    />
                  </div>
                  <div>
                    <Label>Ubicación *</Label>
                    <Input
                      value={matchForm.location}
                      onChange={(e) => setMatchForm({ ...matchForm, location: e.target.value })}
                      placeholder="Estadio o cancha"
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Fecha *</Label>
                    <Input
                      type="date"
                      value={matchForm.date}
                      onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Hora *</Label>
                    <Input
                      type="time"
                      value={matchForm.time}
                      onChange={(e) => setMatchForm({ ...matchForm, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Local/Visita *</Label>
                    <Select 
                      value={matchForm.homeAway} 
                      onValueChange={(value: "HOME" | "AWAY") => setMatchForm({ ...matchForm, homeAway: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOME">Local</SelectItem>
                        <SelectItem value="AWAY">Visita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={matchForm.notes}
                    onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })}
                    rows={3}
                    placeholder="Notas adicionales sobre el partido..."
                  />
                </div>

                {/* Result Fields - Only show if editing existing match */}
                {!isCreating && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Resultado del Partido</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Completa estos campos después de que el partido haya finalizado
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {matchForm.sport === "FOOTBALL" ? (
                        <>
                          <div>
                            <Label>Goles a Favor</Label>
                            <Input
                              type="number"
                              min="0"
                              value={matchForm.goalsFor}
                              onChange={(e) => setMatchForm({ ...matchForm, goalsFor: e.target.value })}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Goles en Contra</Label>
                            <Input
                              type="number"
                              min="0"
                              value={matchForm.goalsAgainst}
                              onChange={(e) => setMatchForm({ ...matchForm, goalsAgainst: e.target.value })}
                              placeholder="0"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label>Puntos a Favor</Label>
                            <Input
                              type="number"
                              min="0"
                              value={matchForm.pointsFor}
                              onChange={(e) => setMatchForm({ ...matchForm, pointsFor: e.target.value })}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Puntos en Contra</Label>
                            <Input
                              type="number"
                              min="0"
                              value={matchForm.pointsAgainst}
                              onChange={(e) => setMatchForm({ ...matchForm, pointsAgainst: e.target.value })}
                              placeholder="0"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isCreating) {
                      onOpenChange(false)
                    } else {
                      setEditMode(false)
                    }
                  }}
                  disabled={loadingTournaments}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={onUpdate}
                  disabled={loadingTournaments || !matchForm.opponent || !matchForm.location || !matchForm.date || !matchForm.time}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? "Crear Partido" : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
