"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Download,
  FileText,
  MapPin,
  Clock,
  Star,
  Edit,
  Save,
  X
} from "lucide-react"

interface Tournament {
  id: string
  name: string
  description?: string
  season: string
  type: string
  startDate: string
  endDate?: string
  rules?: string
  rulesFileUrl?: string
  logoUrl?: string
  status: string
  matches: Match[]
  standings: TournamentStanding[]
}

interface Match {
  id: string
  opponent: string
  date: string
  location: string
  sport: string
  status: string
  scoreFor?: number
  scoreAgainst?: number
  result?: string
  homeAway?: string
}

interface TournamentStanding {
  id: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  position?: number
}

interface PlayerStats {
  player: { id: string; name: string }
  matchesPlayed: number
  totals: {
    points?: number
    rebounds?: number
    assists?: number
    goals?: number
    minutes?: number
  }
  averages: {
    points?: number
    rebounds?: number
    assists?: number
    goals?: number
  }
}

export default function TournamentDetailPage() {
  const params = useParams() as { id: string; orgSlug: string }
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    season: "",
    type: "",
    startDate: "",
    endDate: "",
    rules: ""
  })
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState<number | null>(null)

  const getOriginalFileName = (url: string) => {
    try {
      const base = url.split('/').pop() || ''
      const idx = base.indexOf('_')
      const name = idx >= 0 ? base.slice(idx + 1) : base
      return decodeURIComponent(name)
    } catch {
      return url
    }
  }

  useEffect(() => {
    fetchTournamentDetail()
  }, [params.id])

  const fetchTournamentDetail = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/club/tournaments/${params.id}`)
      if (!res.ok) throw new Error("Error al cargar torneo")
      const data = await res.json()
      setTournament(data.tournament)
      setPlayerStats(data.playerStats || [])
      
      // Initialize edit form with tournament data
      if (data.tournament) {
        setEditForm({
          name: data.tournament.name || "",
          description: data.tournament.description || "",
          season: data.tournament.season || "",
          type: data.tournament.type || "",
          startDate: data.tournament.startDate ? new Date(data.tournament.startDate).toISOString().split('T')[0] : "",
          endDate: data.tournament.endDate ? new Date(data.tournament.endDate).toISOString().split('T')[0] : "",
          rules: data.tournament.rules || ""
        })
      }
    } catch (error) {
      console.error("Error fetching tournament:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: any = {
      APERTURA: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      CLAUSURA: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
      LIGA_LARGA: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
      CUP: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      FRIENDLY: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      PLAYOFF: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    }
    const labels: any = {
      APERTURA: "Liga Apertura",
      CLAUSURA: "Liga Clausura",
      LIGA_LARGA: "Liga Larga",
      CUP: "Copa",
      FRIENDLY: "Amistoso",
      PLAYOFF: "Playoff",
    }
    return <Badge className={colors[type] || ""}>{labels[type] || type}</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Activo</Badge>
      case "FINISHED":
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Finalizado</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/club/tournaments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
          endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined
        })
      })
      
      if (!res.ok) throw new Error("Error al actualizar torneo")
      
      await fetchTournamentDetail()
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving tournament:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form to original tournament data
    if (tournament) {
      setEditForm({
        name: tournament.name || "",
        description: tournament.description || "",
        season: tournament.season || "",
        type: tournament.type || "",
        startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : "",
        endDate: tournament.endDate ? new Date(tournament.endDate).toISOString().split('T')[0] : "",
        rules: tournament.rules || ""
      })
    }
  }

  const getResultBadge = (result?: string) => {
    if (!result) return null
    switch (result) {
      case "WIN":
        return <Badge className="bg-green-600 text-white">Victoria</Badge>
      case "LOSS":
        return <Badge className="bg-red-600 text-white">Derrota</Badge>
      case "DRAW":
        return <Badge className="bg-yellow-600 text-white">Empate</Badge>
      default:
        return null
    }
  }

  // Calculate team stats
  const teamStats = tournament?.matches.reduce((acc, match) => {
    if (match.status === 'COMPLETED') {
      acc.played++
      if (match.result === 'WIN') acc.won++
      else if (match.result === 'LOSS') acc.lost++
      else if (match.result === 'DRAW') acc.drawn++
      
      acc.goalsFor += match.scoreFor || 0
      acc.goalsAgainst += match.scoreAgainst || 0
    }
    return acc
  }, { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 })

  const winRate = teamStats && teamStats.played > 0 ? ((teamStats.won / teamStats.played) * 100).toFixed(1) : "0"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando torneo...</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
          <p className="text-muted-foreground">Torneo no encontrado</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push(`/${params.orgSlug}/club/tournaments`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Torneos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/${params.orgSlug}/club/tournaments`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Torneos
          </Button>
        </div>

        {/* Tournament Info */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    {!isEditing ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Trophy className="h-8 w-8 text-primary" />
                          <div>
                            <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                            <CardDescription>Temporada {tournament.season}</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {getTypeBadge(tournament.type)}
                          {getStatusBadge(tournament.status)}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Nombre del Torneo</Label>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="placeholder:text-muted-foreground/50"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Temporada</Label>
                            <Input
                              value={editForm.season}
                              onChange={(e) => setEditForm({ ...editForm, season: e.target.value })}
                              className="placeholder:text-muted-foreground/50"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Tipo</Label>
                            <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="APERTURA">Liga Apertura</SelectItem>
                                <SelectItem value="CLAUSURA">Liga Clausura</SelectItem>
                                <SelectItem value="LIGA_LARGA">Liga Larga</SelectItem>
                                <SelectItem value="CUP">Copa</SelectItem>
                                <SelectItem value="FRIENDLY">Amistoso</SelectItem>
                                <SelectItem value="PLAYOFF">Playoff</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        {tournament.rulesFileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={tournament.rulesFileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Bases PDF
                            </a>
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                          {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Guardar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <>
                    {tournament.description && (
                      <p className="text-muted-foreground mb-4">{tournament.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Inicio: {new Date(tournament.startDate).toLocaleDateString('es-CL')}</span>
                      </div>
                      {tournament.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Fin: {new Date(tournament.endDate).toLocaleDateString('es-CL')}</span>
                        </div>
                      )}
                    </div>
                    {(tournament.rules || (tournament as any).rulesFileUrls?.length || (tournament as any).rulesFileUrl) && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Reglas y Bases
                        </h4>
                        {tournament.rules && (
                          <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap">
                            {tournament.rules}
                          </div>
                        )}
                        {/* Files list (multiple PDFs) */}
                        {(tournament as any).rulesFileUrls?.length ? (
                          <div className="mt-3 space-y-2">
                            <h5 className="text-sm font-medium">Archivos PDF</h5>
                            <div className="space-y-3">
                              {(tournament as any).rulesFileUrls.map((url: string, idx: number) => (
                                <div key={idx} className="space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm">{getOriginalFileName(url)}</span>
                                    <div className="flex items-center gap-2">
                                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Abrir</a>
                                      <Button variant="outline" size="sm" onClick={() => setPreviewOpen(previewOpen === idx ? null : idx)}>
                                        {previewOpen === idx ? 'Ocultar' : 'Previsualizar'}
                                      </Button>
                                    </div>
                                  </div>
                                  {previewOpen === idx && (
                                    <div className="border rounded-md overflow-hidden">
                                      <iframe src={url} className="w-full h-96" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (tournament as any).rulesFileUrl ? (
                          <div className="mt-3">
                            <div className="flex items-center justify-between gap-3">
                              <a href={(tournament as any).rulesFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                {getOriginalFileName((tournament as any).rulesFileUrl)}
                              </a>
                              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(previewOpen === 0 ? null : 0)}>
                                {previewOpen === 0 ? 'Ocultar' : 'Previsualizar'}
                              </Button>
                            </div>
                            {previewOpen === 0 && (
                              <div className="mt-2 border rounded-md overflow-hidden">
                                <iframe src={(tournament as any).rulesFileUrl} className="w-full h-96" />
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Fecha Inicio</Label>
                        <Input
                          type="date"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Fecha Fin</Label>
                        <Input
                          type="date"
                          value={editForm.endDate}
                          onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Reglas y Bases</Label>
                      <Textarea
                        value={editForm.rules}
                        onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })}
                        rows={4}
                        className="placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Performance Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Rendimiento del Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{teamStats?.played || 0}</div>
                    <div className="text-xs text-muted-foreground">Partidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{winRate}%</div>
                    <div className="text-xs text-muted-foreground">Efectividad</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Victorias</span>
                    <span className="font-medium">{teamStats?.won || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Empates</span>
                    <span className="font-medium">{teamStats?.drawn || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Derrotas</span>
                    <span className="font-medium">{teamStats?.lost || 0}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Goles a favor</span>
                    <span className="font-medium">{teamStats?.goalsFor || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Goles en contra</span>
                    <span className="font-medium">{teamStats?.goalsAgainst || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Diferencia</span>
                    <span className={`${(teamStats?.goalsFor || 0) - (teamStats?.goalsAgainst || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(teamStats?.goalsFor || 0) - (teamStats?.goalsAgainst || 0) > 0 ? '+' : ''}{(teamStats?.goalsFor || 0) - (teamStats?.goalsAgainst || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="matches">Partidos</TabsTrigger>
            <TabsTrigger value="standings">Tabla de Posiciones</TabsTrigger>
            <TabsTrigger value="players">Estadísticas Jugadores</TabsTrigger>
            <TabsTrigger value="team-metrics">Métricas del Equipo</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
          </TabsList>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Partidos del Torneo
                </CardTitle>
                <CardDescription>
                  {tournament.matches.length} partidos programados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tournament.matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <p className="text-muted-foreground">No hay partidos programados para este torneo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tournament.matches
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((match) => (
                      <div key={match.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">vs {match.opponent}</h3>
                              {getResultBadge(match.result)}
                              <Badge variant="outline" className={match.homeAway === 'HOME' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}>
                                {match.homeAway === 'HOME' ? 'Local' : 'Visitante'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(match.date).toLocaleDateString('es-CL', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(match.date).toLocaleTimeString('es-CL', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {match.location}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {match.status === 'COMPLETED' && match.scoreFor !== undefined ? (
                              <div className="text-xl font-bold">
                                {match.scoreFor} - {match.scoreAgainst}
                              </div>
                            ) : (
                              <Badge variant="outline">
                                {match.status === 'SCHEDULED' ? 'Programado' : match.status}
                              </Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}`)}
                            >
                              Ver detalle
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Tabla de Posiciones
                </CardTitle>
                <CardDescription>
                  Clasificación actual del torneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tournament.standings.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <p className="text-muted-foreground">La tabla de posiciones se actualizará automáticamente con los resultados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Pos</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead className="text-center">PJ</TableHead>
                        <TableHead className="text-center">G</TableHead>
                        <TableHead className="text-center">E</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="text-center">GF</TableHead>
                        <TableHead className="text-center">GC</TableHead>
                        <TableHead className="text-center">DG</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tournament.standings
                        .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)
                        .map((standing, index) => (
                        <TableRow key={standing.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {index + 1}
                              {index < 3 && <Star className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{standing.teamName}</TableCell>
                          <TableCell className="text-center">{standing.played}</TableCell>
                          <TableCell className="text-center text-green-600">{standing.won}</TableCell>
                          <TableCell className="text-center text-yellow-600">{standing.drawn}</TableCell>
                          <TableCell className="text-center text-red-600">{standing.lost}</TableCell>
                          <TableCell className="text-center">{standing.goalsFor}</TableCell>
                          <TableCell className="text-center">{standing.goalsAgainst}</TableCell>
                          <TableCell className={`text-center ${standing.goalDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {standing.goalDiff > 0 ? '+' : ''}{standing.goalDiff}
                          </TableCell>
                          <TableCell className="text-center font-bold">{standing.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Player Stats Tab */}
          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estadísticas de Jugadores
                </CardTitle>
                <CardDescription>
                  Rendimiento individual en el torneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {playerStats.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <p className="text-muted-foreground">Las estadísticas aparecerán cuando se registren resultados de partidos</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jugador</TableHead>
                        <TableHead className="text-center">Partidos</TableHead>
                        <TableHead className="text-center">Goles</TableHead>
                        <TableHead className="text-center">Asistencias</TableHead>
                        <TableHead className="text-center">Minutos</TableHead>
                        <TableHead className="text-center">Prom. Goles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playerStats
                        .sort((a, b) => (b.totals.goals || 0) - (a.totals.goals || 0))
                        .map((stat) => (
                        <TableRow key={stat.player.id}>
                          <TableCell className="font-medium">{stat.player.name}</TableCell>
                          <TableCell className="text-center">{stat.matchesPlayed}</TableCell>
                          <TableCell className="text-center">{stat.totals.goals || 0}</TableCell>
                          <TableCell className="text-center">{stat.totals.assists || 0}</TableCell>
                          <TableCell className="text-center">{stat.totals.minutes || 0}</TableCell>
                          <TableCell className="text-center">{(stat.averages.goals || 0).toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Metrics Tab */}
          <TabsContent value="team-metrics">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Rendimiento General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{teamStats?.played || 0}</div>
                      <div className="text-sm text-muted-foreground">Partidos Jugados</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{winRate}%</div>
                      <div className="text-sm text-muted-foreground">Efectividad</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Victorias</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${teamStats?.played ? (teamStats.won / teamStats.played) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{teamStats?.won || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Empates</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${teamStats?.played ? (teamStats.drawn / teamStats.played) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{teamStats?.drawn || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Derrotas</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${teamStats?.played ? (teamStats.lost / teamStats.played) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{teamStats?.lost || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goals Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Análisis de Goles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{teamStats?.goalsFor || 0}</div>
                      <div className="text-sm text-muted-foreground">Goles a Favor</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{teamStats?.goalsAgainst || 0}</div>
                      <div className="text-sm text-muted-foreground">Goles en Contra</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className={`text-2xl font-bold ${(teamStats?.goalsFor || 0) - (teamStats?.goalsAgainst || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(teamStats?.goalsFor || 0) - (teamStats?.goalsAgainst || 0) > 0 ? '+' : ''}{(teamStats?.goalsFor || 0) - (teamStats?.goalsAgainst || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Diferencia de Goles</div>
                  </div>

                  {teamStats?.played && teamStats.played > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Promedio goles por partido</span>
                        <span className="font-medium">{(teamStats.goalsFor / teamStats.played).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Promedio goles recibidos</span>
                        <span className="font-medium">{(teamStats.goalsAgainst / teamStats.played).toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Players */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Jugadores Destacados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {playerStats.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
                      <p className="text-sm text-muted-foreground">Sin estadísticas disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Top Scorer */}
                      {playerStats.length > 0 && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">Goleador</div>
                              <div className="text-xs text-muted-foreground">
                                {playerStats.sort((a, b) => (b.totals.goals || 0) - (a.totals.goals || 0))[0]?.player.name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {playerStats.sort((a, b) => (b.totals.goals || 0) - (a.totals.goals || 0))[0]?.totals.goals || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">goles</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Most Assists */}
                      {playerStats.length > 0 && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">Más Asistencias</div>
                              <div className="text-xs text-muted-foreground">
                                {playerStats.sort((a, b) => (b.totals.assists || 0) - (a.totals.assists || 0))[0]?.player.name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {playerStats.sort((a, b) => (b.totals.assists || 0) - (a.totals.assists || 0))[0]?.totals.assists || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">asistencias</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Most Minutes */}
                      {playerStats.length > 0 && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">Más Minutos</div>
                              <div className="text-xs text-muted-foreground">
                                {playerStats.sort((a, b) => (b.totals.minutes || 0) - (a.totals.minutes || 0))[0]?.player.name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {playerStats.sort((a, b) => (b.totals.minutes || 0) - (a.totals.minutes || 0))[0]?.totals.minutes || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">minutos</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendario del Torneo
                </CardTitle>
                <CardDescription>
                  Próximos partidos y fechas importantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournament.matches
                    .filter(match => new Date(match.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 5)
                    .map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">vs {match.opponent}</h4>
                        <p className="text-sm text-muted-foreground">{match.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Date(match.date).toLocaleDateString('es-CL', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(match.date).toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {tournament.matches.filter(match => new Date(match.date) >= new Date()).length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                      <p className="text-muted-foreground">No hay próximos partidos programados</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
