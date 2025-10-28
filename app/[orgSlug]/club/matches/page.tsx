"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import type { Matcher } from "react-day-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Calendar,
  Plus,
  Trophy,
  Users,
  FileText,
  Star,
  Clock,
  MapPin
} from "lucide-react"

interface Match {
  id: string
  sport: "FOOTBALL" | "BASKETBALL"
  date: string
  opponent: string
  location: string
  homeAway?: "HOME" | "AWAY"
  notes?: string
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  scoreFor?: number
  scoreAgainst?: number
  result?: "WIN" | "DRAW" | "LOSS"
}

interface Event {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  type: string
  description?: string
  opponent?: string
  location?: string
  homeAway?: "HOME" | "AWAY"
}

export default function MatchesListPage() {
  const params = useParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  
  // Data state
  const [matches, setMatches] = useState<Match[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Event creation state
  const [openNewEvent, setOpenNewEvent] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const [eventError, setEventError] = useState<string | null>(null)
  const [eventForm, setEventForm] = useState<{
    title: string
    type: "championship" | "seminar" | "holiday" | "announcement" | "other"
    allDay: boolean
    date: string
    startTime: string
    endTime: string
    description: string
    published: boolean
    important: boolean
    // Match-specific fields for CHAMPIONSHIP events
    opponent?: string
    location?: string
    homeAway?: "HOME" | "AWAY"
    tournamentId?: string
  }>({ title: "", type: "championship", allDay: false, date: "", startTime: "15:00", endTime: "17:00", description: "", published: true, important: false })

  // Match detail modal state
  const [openMatchDetail, setOpenMatchDetail] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [matchDetail, setMatchDetail] = useState<Match | null>(null)
  const [matchForm, setMatchForm] = useState<{ 
    opponent?: string
    location?: string
    homeAway?: "HOME" | "AWAY"
    date?: string
    notes?: string
    status?: "SCHEDULED" | "COMPLETED" | "CANCELLED"
    scoreFor?: number | null
    scoreAgainst?: number | null
    result?: "WIN" | "LOSS" | "DRAW" | null
  }>({})

  // Team roster and detailed stats
  const [teamRoster, setTeamRoster] = useState<{ id: string; name: string; playerProfile?: any }[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [callupPlayers, setCallupPlayers] = useState<Set<string>>(new Set())
  const [starterPlayers, setStarterPlayers] = useState<Set<string>>(new Set())
  const [callupLoading, setCallupLoading] = useState(false)
  const [detailedStatsForm, setDetailedStatsForm] = useState<Record<string, {
    // Basketball stats
    points?: number
    rebounds?: number
    assists?: number
    steals?: number
    blocks?: number
    fouls?: number
    minutes?: number
    // Football stats  
    goals?: number
    yellow?: number
    red?: number
  }>>({})

  const [activeTab, setActiveTab] = useState<'details' | 'stats' | 'callup'>('details')
  const [mainViewTab, setMainViewTab] = useState<'calendar' | 'results'>('calendar')

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/club/matches")
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
    }
  }

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams({
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      const res = await fetch(`/api/admin/events?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(Array.isArray(data) ? data : data.events || [])
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/club/tournaments")
      if (response.ok) {
        const data = await response.json()
        setTournaments(data.tournaments || [])
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error)
    }
  }

  useEffect(() => {
    Promise.all([fetchMatches(), fetchEvents(), fetchTournaments()]).finally(() => setLoading(false))
  }, [])

  // Keep form date in sync with selectedDate
  useEffect(() => {
    const d = selectedDate
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    setEventForm(f => ({ ...f, date: iso }))
  }, [selectedDate])

  const upcomingMatches = useMemo(() => {
    const now = new Date()
    return matches.filter(m => new Date(m.date) >= now && m.status === "SCHEDULED").slice(0, 5)
  }, [matches])

  const pastResults = useMemo(() => {
    const now = new Date()
    return matches.filter(m => new Date(m.date) < now || m.status === "COMPLETED").slice(0, 10)
  }, [matches])

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

  const getResultBadgeForMatch = (match: Match) => {
    if (match.status !== "COMPLETED" || match.scoreFor === undefined || match.scoreAgainst === undefined) {
      return null
    }
    
    if (match.scoreFor > match.scoreAgainst) {
      return <Badge className="bg-green-600 text-white">Victoria</Badge>
    } else if (match.scoreFor < match.scoreAgainst) {
      return <Badge className="bg-red-600 text-white">Derrota</Badge>
    } else {
      return <Badge className="bg-yellow-600 text-white">Empate</Badge>
    }
  }

  if (!mounted) return null
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando partidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Partidos</h1>
            <p className="text-muted-foreground">Gestiona partidos y resultados del equipo</p>
          </div>
        </div>

        {/* Actions and View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendario
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>
          <Button onClick={() => setOpenNewEvent(true)} className="bg-gradient-to-r from-primary to-accent">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Partido
          </Button>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
            <div>
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Calendario
                  </CardTitle>
                  <CardDescription>Selecciona una fecha para ver los partidos</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6">
                    <UiCalendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      month={currentMonth}
                      onMonthChange={setCurrentMonth}
                      className="w-full"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4 w-full",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-lg font-semibold",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted rounded-md transition-colors",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full",
                        head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] h-8 flex items-center justify-center",
                        row: "flex w-full mt-2",
                        cell: "h-10 w-full text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-10 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                        day_range_end: "day-range-end",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold",
                        day_today: "bg-accent text-accent-foreground font-semibold",
                        day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                      modifiers={{
                        hasMatch: matches.map(m => new Date(m.date))
                      }}
                      modifiersClassNames={{
                        hasMatch: "bg-gradient-to-br from-primary to-accent text-white font-bold shadow-sm ring-2 ring-primary/20"
                      }}
                    />
                  </div>
                  
                  {/* Legend */}
                  <div className="border-t bg-muted/30 px-6 py-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-gradient-to-br from-primary to-accent"></div>
                          <span className="text-muted-foreground">Con partidos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-accent"></div>
                          <span className="text-muted-foreground">Hoy</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {matches.length} partidos en total
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-fit">
                <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Partidos del {selectedDate.toLocaleDateString('es-CL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                  <CardDescription>
                    {(() => {
                      const selectedDateStr = selectedDate.toISOString().split('T')[0]
                      const dayMatches = matches.filter(match => 
                        match.date.split('T')[0] === selectedDateStr
                      )
                      return dayMatches.length === 0 
                        ? "No hay partidos programados para este día"
                        : `${dayMatches.length} partido${dayMatches.length > 1 ? 's' : ''} programado${dayMatches.length > 1 ? 's' : ''}`
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {(() => {
                    const selectedDateStr = selectedDate.toISOString().split('T')[0]
                    const dayMatches = matches.filter(match => 
                      match.date.split('T')[0] === selectedDateStr
                    )
                    
                    if (dayMatches.length === 0) {
                      return (
                        <div className="text-center py-16">
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl"></div>
                            <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-full w-fit mx-auto">
                              <Calendar className="h-12 w-12 text-primary" />
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No hay partidos este día</h3>
                          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            Selecciona otra fecha en el calendario o programa un nuevo partido para este día
                          </p>
                          <Button 
                            onClick={() => {
                              setOpenNewEvent(true)
                              // Pre-fill the date in the form
                              const iso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
                              setEventForm(f => ({ ...f, date: iso }))
                            }} 
                            className="bg-gradient-to-r from-primary to-accent"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Programar Partido
                          </Button>
                        </div>
                      )
                    }
                    
                    return (
                      <div className="space-y-4">
                        {dayMatches.map((match) => (
                          <Card key={match.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/30 hover:border-l-primary">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                                      <Trophy className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                                        vs {match.opponent}
                                      </h3>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge 
                                          variant="outline" 
                                          className={
                                            match.status === "SCHEDULED" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300" :
                                            match.status === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300" :
                                            "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300"
                                          }
                                        >
                                          {match.status === "SCHEDULED" ? "Programado" : 
                                           match.status === "COMPLETED" ? "Completado" : "Cancelado"}
                                        </Badge>
                                        {match.homeAway && (
                                          <Badge variant="secondary" className="text-xs">
                                            {match.homeAway === "HOME" ? "Local" : "Visita"}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span>{new Date(match.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span>{match.location}</span>
                                    </div>
                                  </div>

                                  {match.status === "COMPLETED" && match.scoreFor !== undefined && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border">
                                      <div className="text-center">
                                        <div className="text-3xl font-bold text-primary mb-2">
                                          {match.scoreFor} - {match.scoreAgainst}
                                        </div>
                                        <div>
                                          {getResultBadgeForMatch(match)}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2 min-w-[120px]">
                                  {match.status === "SCHEDULED" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}/callup`)}
                                      className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                      <Users className="h-4 w-4 mr-2" />
                                      Convocar
                                    </Button>
                                  )}
                                  
                                  {match.status === "COMPLETED" && (
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}/stats`)}
                                        className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Estadísticas
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}/evaluation`)}
                                        className="w-full hover:bg-accent hover:text-accent-foreground transition-colors"
                                      >
                                        <Star className="h-4 w-4 mr-2" />
                                        Evaluar
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main View Tabs - Only show for list view */}
        {viewMode === "list" && (
          <div className="flex bg-muted/30 p-1 rounded-lg w-fit">
            <button 
              onClick={() => setMainViewTab('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mainViewTab === 'calendar' ? 'bg-background shadow-sm' : 'hover:bg-muted/50'}`}
            >
              📅 Próximos Partidos
            </button>
            <button 
              onClick={() => setMainViewTab('results')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mainViewTab === 'results' ? 'bg-background shadow-sm' : 'hover:bg-muted/50'}`}
            >
              🏆 Resultados
            </button>
          </div>
        )}

        {/* List View Content */}
        {viewMode === "list" && mainViewTab === 'calendar' ? (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximos Partidos
                </CardTitle>
                <CardDescription>Partidos programados para las próximas fechas</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <h3 className="font-medium mb-2">No hay partidos próximos</h3>
                    <p className="text-sm text-muted-foreground mb-4">Programa tu próximo partido</p>
                    <Button onClick={() => setOpenNewEvent(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Partido
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMatches.map((match) => (
                      <Card key={match.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                  <Trophy className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="font-semibold text-xl">vs {match.opponent}</h3>
                              </div>
                              
                              <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(match.date).toLocaleDateString('es-CL', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{match.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{new Date(match.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}/callup`)}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                Convocar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : viewMode === "list" && mainViewTab === 'results' ? (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Resultados Recientes
                </CardTitle>
                <CardDescription>Todos los partidos disputados</CardDescription>
              </CardHeader>
              <CardContent>
                {pastResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                    <h3 className="font-medium mb-2">Aún no hay resultados</h3>
                    <p className="text-sm text-muted-foreground">Los partidos completados aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastResults.map((match) => (
                      <Card key={match.id} className="hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                  <Trophy className="h-4 w-4 text-primary" />
                                </div>
                                <h3 className="font-semibold text-xl">vs {match.opponent}</h3>
                              </div>
                              
                              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(match.date).toLocaleDateString('es-CL', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{match.location}</span>
                                </div>
                              </div>

                              {match.status === "COMPLETED" && match.scoreFor !== undefined && (
                                <div className="p-4 bg-muted/30 rounded-lg">
                                  <div className="text-center">
                                    <span className="text-3xl font-bold text-primary">
                                      {match.scoreFor} - {match.scoreAgainst}
                                    </span>
                                    <div className="mt-2">
                                      {getResultBadgeForMatch(match)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {match.status === "COMPLETED" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}/stats`)}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    Stats
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}/evaluation`)}
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Evaluar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Dialog: Nuevo Partido/Evento */}
        <Dialog open={openNewEvent} onOpenChange={setOpenNewEvent}>
          <DialogContent className="bg-background border-border text-foreground max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Partido</DialogTitle>
              <DialogDescription className="text-foreground/70">Programa un nuevo partido para el club</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <Label>Título del Partido</Label>
                <Input value={eventForm.title} onChange={(e) => setEventForm(f => ({ ...f, title: e.target.value }))} className="bg-muted/50 border-border placeholder:text-muted-foreground/50" placeholder="vs Ryonan" />
              </div>

              <div className="grid gap-1">
                <Label>Torneo/Liga *</Label>
                <Select value={eventForm.tournamentId || ""} onValueChange={(v) => setEventForm(f => ({ ...f, tournamentId: v }))}>
                  <SelectTrigger className="bg-muted/50 border-border text-foreground">
                    <SelectValue placeholder="Selecciona un torneo" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {tournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.name} - {tournament.season}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label>Oponente</Label>
                  <Input 
                    value={eventForm.opponent || ""} 
                    onChange={(e) => setEventForm(f => ({ ...f, opponent: e.target.value }))} 
                    className="bg-muted/50 border-border placeholder:text-muted-foreground/50" 
                    placeholder="Ryonan"
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Condición</Label>
                  <Select value={eventForm.homeAway || ""} onValueChange={(v) => setEventForm(f => ({ ...f, homeAway: v as any }))}>
                    <SelectTrigger className="bg-muted/50 border-border text-foreground">
                      <SelectValue placeholder="Local/Visita" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="HOME">Local</SelectItem>
                      <SelectItem value="AWAY">Visita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1">
                <Label>Ubicación</Label>
                <Input 
                  value={eventForm.location || ""} 
                  onChange={(e) => setEventForm(f => ({ ...f, location: e.target.value }))} 
                  className="bg-muted/50 border-border placeholder:text-muted-foreground/50" 
                  placeholder="Gimnasio Municipal"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1">
                  <Label>Fecha</Label>
                  <Input type="date" value={eventForm.date} onChange={(e) => setEventForm(f => ({ ...f, date: e.target.value }))} className="bg-muted/50 border-border" />
                </div>
                <div className="grid gap-1">
                  <Label>Inicio</Label>
                  <Input type="time" value={eventForm.startTime} onChange={(e) => setEventForm(f => ({ ...f, startTime: e.target.value }))} className="bg-muted/50 border-border" />
                </div>
                <div className="grid gap-1">
                  <Label>Fin</Label>
                  <Input type="time" value={eventForm.endTime} onChange={(e) => setEventForm(f => ({ ...f, endTime: e.target.value }))} className="bg-muted/50 border-border" />
                </div>
              </div>

              <div className="grid gap-1">
                <Label>Descripción</Label>
                <Textarea rows={2} value={eventForm.description} onChange={(e) => setEventForm(f => ({ ...f, description: e.target.value }))} className="bg-muted/50 border-border placeholder:text-muted-foreground/50" placeholder="Detalles adicionales del partido..." />
              </div>
            </div>
            {eventError && (
              <div className="text-sm text-destructive px-1">{eventError}</div>
            )}
            <DialogFooter>
              <Button
                onClick={async () => {
                  setEventError(null)
                  if (!eventForm.title?.trim()) { setEventError("El título es obligatorio"); return }
                  if (!eventForm.tournamentId) { setEventError("Debe seleccionar un torneo"); return }
                  if (!eventForm.date) { setEventError("La fecha es obligatoria"); return }
                  if (!eventForm.opponent?.trim()) { setEventError("El oponente es obligatorio"); return }
                  if (!eventForm.location?.trim()) { setEventError("La ubicación es obligatoria"); return }
                  if (!eventForm.homeAway) { setEventError("Debe especificar si es local o visita"); return }
                  
                  // Create match payload
                  const matchPayload = {
                    sport: "FOOTBALL", // Default sport - could be made configurable
                    date: new Date(`${eventForm.date}T${eventForm.startTime || "15:00"}:00`).toISOString(),
                    opponent: eventForm.opponent,
                    location: eventForm.location,
                    homeAway: eventForm.homeAway,
                    notes: eventForm.description || undefined,
                    tournamentId: eventForm.tournamentId
                  }
                  
                  try {
                    setSavingEvent(true)
                    const res = await fetch("/api/club/matches", { 
                      method: "POST", 
                      headers: { "Content-Type": "application/json" }, 
                      body: JSON.stringify(matchPayload) 
                    })
                    if (!res.ok) {
                      let msg = "No se pudo guardar el partido"
                      try { const data = await res.json(); if (data?.error) msg = data.error } catch {}
                      setEventError(msg)
                      return
                    }
                    
                    // Refresh data
                    await Promise.all([fetchMatches(), fetchEvents()])
                    setOpenNewEvent(false)
                    setEventForm((f) => ({ ...f, title: "", description: "", opponent: "", location: "", homeAway: undefined, tournamentId: undefined }))
                  } catch (e) {
                    setEventError("Error de red al guardar. Intenta nuevamente.")
                  } finally {
                    setSavingEvent(false)
                  }
                }}
                className="bg-gradient-to-r from-primary to-accent text-white disabled:opacity-60"
                disabled={savingEvent}
              >
                {savingEvent ? "Guardando..." : "Crear Partido"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
