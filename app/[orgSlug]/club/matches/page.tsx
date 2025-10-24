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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Calendar,
  Plus,
  Search,
  Trophy,
  Users,
  FileText,
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  Info
} from "lucide-react"

interface Match {
  id: string
  opponent: string
  date: string
  location: string
  sport: "FOOTBALL" | "BASKETBALL"
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED"
  scoreFor?: number
  scoreAgainst?: number
  result?: "WIN" | "LOSS" | "DRAW"
  homeAway?: string
  notes?: string
}

interface Event {
  id: string
  title: string
  type: "championship" | "seminar" | "holiday" | "announcement" | "other"
  allDay: boolean
  date: string
  startTime?: string
  endTime?: string
  description?: string
  published: boolean
  important: boolean
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

  const openDetail = async (id: string) => {
    try {
      setSelectedMatchId(id)
      setOpenMatchDetail(true)
      setDetailLoading(true)
      const res = await fetch(`/api/club/matches/${id}`)
      if (!res.ok) throw new Error("No se pudo cargar el partido")
      const data = await res.json()
      const m: Match = data.match
      setMatchDetail(m)
      const isPast = new Date(m.date).getTime() < Date.now()
      const defaultStatus = isPast && m.status !== 'COMPLETED' ? 'COMPLETED' : m.status
      setMatchForm({
        opponent: m.opponent,
        location: m.location,
        homeAway: (m as any).homeAway,
        date: new Date(m.date).toISOString().slice(0,16),
        notes: m.notes,
        status: defaultStatus as any,
        scoreFor: m.scoreFor ?? null,
        scoreAgainst: m.scoreAgainst ?? null,
        result: (m.result as any) ?? null,
      })
      // Load team roster and existing stats
      await Promise.all([loadTeamRoster(), loadExistingStats(id)])
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }

  const saveDetail = async () => {
    if (!selectedMatchId) return
    try {
      setDetailLoading(true)
      // Build payload; convert datetime-local to Date if present
      const payload: any = { ...matchForm }
      if (payload.date) payload.date = new Date(payload.date).toISOString()
      const res = await fetch(`/api/club/matches/${selectedMatchId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        let msg = 'No se pudo guardar los cambios'
        try { const d = await res.json(); if (d?.error) msg = d.error } catch {}
        throw new Error(msg)
      }
      await fetchMatches()
      await fetchEvents()
      setOpenMatchDetail(false)
    } catch (e) {
      console.error(e)
    } finally {
      setDetailLoading(false)
    }
  }

  const loadTeamRoster = async () => {
    try {
      setRosterLoading(true)
      const res = await fetch('/api/club/members')
      if (res.ok) {
        const data = await res.json()
        setTeamRoster(data.members || [])
      }
    } catch (e) {
      console.warn('No se pudo cargar el roster del equipo', e)
    } finally {
      setRosterLoading(false)
    }
  }

  const loadExistingStats = async (matchId: string) => {
    try {
      const res = await fetch(`/api/club/matches/${matchId}/stats`)
      if (res.ok) {
        const data = await res.json()
        const preset: typeof detailedStatsForm = {}
        for (const stat of (data.stats || [])) {
          preset[stat.playerId] = {
            points: stat.points ?? undefined,
            rebounds: stat.rebounds ?? undefined,
            assists: stat.assists ?? undefined,
            steals: stat.steals ?? undefined,
            blocks: stat.blocks ?? undefined,
            fouls: stat.fouls ?? undefined,
            minutes: stat.minutes ?? undefined,
            goals: stat.goals ?? undefined,
            yellow: stat.yellow ?? undefined,
            red: stat.red ?? undefined,
          }
        }
        setDetailedStatsForm(preset)
      }
    } catch (e) {
      console.warn('No se pudieron cargar estadísticas existentes', e)
    }
  }

  // Auto-calculate team score from player stats
  const teamScoreFromStats = useMemo(() => {
    if (!matchDetail) return 0
    return Object.values(detailedStatsForm).reduce((total, stats) => {
      if (matchDetail.sport === 'BASKETBALL') {
        return total + (stats.points ?? 0)
      } else {
        return total + (stats.goals ?? 0)
      }
    }, 0)
  }, [detailedStatsForm, matchDetail])

  // Auto-update scoreFor and result when player stats change
  useEffect(() => {
    if (teamScoreFromStats > 0) {
      setMatchForm(prev => {
        const newForm = { ...prev, scoreFor: teamScoreFromStats }
        
        // Auto-calculate result if both scores are available
        if (newForm.scoreFor !== null && newForm.scoreAgainst !== null && newForm.status === 'COMPLETED') {
          if (newForm.scoreFor > newForm.scoreAgainst) {
            newForm.result = 'WIN'
          } else if (newForm.scoreFor < newForm.scoreAgainst) {
            newForm.result = 'LOSS'
          } else {
            newForm.result = 'DRAW'
          }
        }
        
        return newForm
      })
    }
  }, [teamScoreFromStats])

  // Auto-calculate result whenever user edits the scoreboard directly
  useEffect(() => {
    setMatchForm(prev => {
      const scoreFor = prev.scoreFor
      const scoreAgainst = prev.scoreAgainst
      const status = prev.status
      if (status === 'COMPLETED' && scoreFor != null && scoreAgainst != null) {
        const computed: any = scoreFor > scoreAgainst ? 'WIN' : scoreFor < scoreAgainst ? 'LOSS' : 'DRAW'
        if (prev.result !== computed) {
          return { ...prev, result: computed }
        }
      }
      return prev
    })
  }, [matchForm?.scoreFor, matchForm?.scoreAgainst, matchForm?.status])

  const saveDetailedStats = async () => {
    if (!selectedMatchId || !matchDetail) return
    try {
      setRosterLoading(true)
      // Filter out players with no stats entered
      const statsToSave = Object.entries(detailedStatsForm)
        .filter(([_, stats]) => Object.values(stats).some(val => val !== undefined && val > 0))
        .map(([playerId, stats]) => ({
          playerId,
          ...(matchDetail.sport === 'BASKETBALL' ? {
            points: stats.points ?? 0,
            rebounds: stats.rebounds ?? 0,
            assists: stats.assists ?? 0,
            steals: stats.steals ?? 0,
            blocks: stats.blocks ?? 0,
            fouls: stats.fouls ?? 0,
            minutes: stats.minutes ?? 0,
          } : {
            goals: stats.goals ?? 0,
            assists: stats.assists ?? 0,
            yellow: stats.yellow ?? 0,
            red: stats.red ?? 0,
            minutes: stats.minutes ?? 0,
          })
        }))

      const res = await fetch(`/api/club/matches/${selectedMatchId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: statsToSave }),
      })
      
      if (!res.ok) {
        let msg = 'No se pudieron guardar las estadísticas'
        try { const d = await res.json(); if (d?.error) msg = d.error } catch {}
        throw new Error(msg)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setRosterLoading(false)
    }
  }

  useEffect(() => { setMounted(true) }, [])
  
  // Calendar helpers
  const monthRange = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }, [currentMonth])

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
        startDate: monthRange.start.toISOString(),
        endDate: monthRange.end.toISOString(),
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

  useEffect(() => {
    Promise.all([fetchMatches(), fetchEvents()]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [monthRange.start.getTime(), monthRange.end.getTime()])

  // Keep form date in sync with selectedDate
  useEffect(() => {
    const d = selectedDate
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    setEventForm((f) => ({ ...f, date: iso }))
  }, [selectedDate])

  // Calendar utilities
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  
  function keyToDate(key: string) {
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y, (m as number) - 1, d)
  }

  const dayMatches = useMemo(() => {
    return matches
      .filter((m) => sameDay(new Date(m.date), selectedDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [matches, selectedDate])

  const dayEvents = useMemo(() => {
    const d = selectedDate
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    return events.filter((ev) => ev.date === key)
  }, [events, selectedDate])

  const pastResults = useMemo(() => {
    return matches
      .filter((m) => new Date(m.date).getTime() < Date.now())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)
  }, [matches])
  
  // Helper to get result color
  const getResultColor = (match: any) => {
    if (match.status !== 'COMPLETED' || !match.result) return 'border-border'
    switch (match.result) {
      case 'WIN': return 'border-green-500 bg-green-50 dark:bg-green-950'
      case 'LOSS': return 'border-red-500 bg-red-50 dark:bg-red-950' 
      case 'DRAW': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
      default: return 'border-border'
    }
  }
  
  // Helper to get result badge for a match card (uses match object)
  const getResultBadgeForMatch = (match: any) => {
    if (match.status !== 'COMPLETED' || !match.result) return null
    switch (match.result) {
      case 'WIN': return <div className="text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">Victoria</div>
      case 'LOSS': return <div className="text-xs font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 px-2 py-1 rounded">Derrota</div>
      case 'DRAW': return <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">Empate</div>
      default: return null
    }
  }

  // Calendar modifiers
  const matchDates = useMemo(() => {
    return matches.map((match) => new Date(match.date))
  }, [matches])

  const eventDates = useMemo(() => {
    return events.map((ev) => {
      const [y, m, d] = ev.date.split("-").map(Number)
      return new Date(y, (m as number) - 1, d)
    })
  }, [events])

  const calendarModifiers = useMemo<Record<string, Matcher | Matcher[]>>(() => ({
    has_matches: matchDates,
    has_events: eventDates,
    weekend: { dayOfWeek: [0, 6] },
  }), [matchDates, eventDates])

  const formatTime = (s: string) => new Date(s).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", timeZone: "America/Santiago" })
  const formatDateLong = (d: Date) => d.toLocaleDateString("es-CL", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Santiago" })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Programado</Badge>
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completado</Badge>
      case "CANCELLED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getResultBadge = (result?: string) => {
    if (!result) return null
    
    switch (result) {
      case "WIN":
        return <Badge className="bg-green-600">Victoria</Badge>
      case "LOSS":
        return <Badge className="bg-red-600">Derrota</Badge>
      case "DRAW":
        return <Badge className="bg-yellow-600">Empate</Badge>
      default:
        return null
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
    <div className="min-h-screen w-full bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Partidos</h1>
            <p className="text-foreground/70">Gestiona los partidos del club</p>
          </div>
          <Button onClick={() => setOpenNewEvent(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Partido
          </Button>
        </div>
        
        {/* Main View Tabs */}
        <div className="flex bg-muted/30 p-1 rounded-lg w-fit">
          <button 
            onClick={() => setMainViewTab('calendar')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mainViewTab === 'calendar' ? 'bg-background shadow-sm' : 'hover:bg-muted/50'}`}
          >
            📅 Calendario
          </button>
          <button 
            onClick={() => setMainViewTab('results')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mainViewTab === 'results' ? 'bg-background shadow-sm' : 'hover:bg-muted/50'}`}
          >
            🏆 Resultados
          </button>
        </div>

        {mainViewTab === 'calendar' ? (
          <>
            {/* Calendar View Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Calendario</h2>
                <p className="text-foreground/70 text-sm">Programa y gestiona los partidos</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-background/40">
                  <Button size="sm" variant={viewMode === "calendar" ? "default" : "outline"} onClick={() => setViewMode("calendar")}>Calendario</Button>
                  <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>Lista</Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Hoy</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>) : (
          <>
            {/* Results View Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Historial de Resultados</h2>
                <p className="text-foreground/70 text-sm">Revisa todos los partidos disputados</p>
              </div>
            </div>
          </>
        )}

        {mainViewTab === 'calendar' ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-2xl border-border overflow-hidden">
                <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary to-accent p-4">
                  <CardTitle className="text-sm font-medium text-white/90">Total Partidos</CardTitle>
                  <Trophy className="h-5 w-5 text-white/80" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold">{matches.length}</div>
                  <p className="text-xs text-foreground/70 mt-1">En total</p>
                </CardContent>
              </Card>

          <Card className="rounded-2xl border-border overflow-hidden">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary to-accent p-4">
              <CardTitle className="text-sm font-medium text-white/90">Programados</CardTitle>
              <CalendarDays className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-3xl font-bold">{matches.filter(m => m.status === "SCHEDULED").length}</div>
              <p className="text-xs text-foreground/70 mt-1">Próximos</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border overflow-hidden">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary to-accent p-4">
              <CardTitle className="text-sm font-medium text-white/90">Victorias</CardTitle>
              <Trophy className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-green-600">{matches.filter(m => m.result === "WIN").length}</div>
              <p className="text-xs text-foreground/70 mt-1">Ganados</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border overflow-hidden">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary to-accent p-4">
              <CardTitle className="text-sm font-medium text-white/90">Día seleccionado</CardTitle>
              <Clock className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-base text-foreground/70 capitalize">{formatDateLong(selectedDate)}</div>
              <div className="text-3xl font-bold">{dayEvents.length + dayMatches.length}</div>
              <p className="text-xs text-foreground/60 mt-1">Actividades del día</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className={`grid gap-8 ${viewMode === "calendar" ? "lg:grid-cols-5" : ""}`}>
          {/* Calendar View */}
          {viewMode === "calendar" && (
            <Card className="rounded-2xl border-border lg:col-span-3">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Calendario</CardTitle>
                  <CardDescription className="text-foreground/70">Selecciona una fecha para ver partidos y eventos</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="px-2 pb-4">
                  <UiCalendar
                    className="w-full"
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    month={currentMonth}
                    onMonthChange={(m: Date) => setCurrentMonth(m)}
                    onDayClick={(day: Date) => { setSelectedDate(day); setEventForm((f) => ({ ...f, date: dateKey(day) })) }}
                    modifiers={calendarModifiers as any}
                  />
                </div>
                {/* Leyenda */}
                <div className="px-6 pb-4 pt-0 text-xs text-foreground/60 flex items-center gap-4">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-accent inline-block" />
                    Con partidos/eventos
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Day panel or List view */}
          <Card className={`rounded-2xl border-border ${viewMode === "calendar" ? "lg:col-span-2" : ""}`}>
            <CardHeader>
              <CardTitle>{viewMode === "calendar" ? "Actividades del día" : "Lista de Partidos"}</CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === "calendar" ? (
                // Day view content
                loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                ) : (dayEvents.length === 0 && dayMatches.length === 0) ? (
                  <div className="text-center py-16">
                    <p className="text-foreground/60">No hay partidos ni eventos programados para este día.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Day Matches */}
                    {dayMatches.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-foreground/70 font-medium">Partidos del día</div>
                        <div className="space-y-3">
                          {dayMatches.map((match) => (
                            <div key={match.id} className="rounded-xl border border-border bg-muted/30 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold">vs {match.opponent}</h3>
                                    {getStatusBadge(match.status)}
                                    {getResultBadge(match.result)}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-foreground/70">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {match.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {new Date(match.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  {match.status === "COMPLETED" && match.scoreFor !== undefined && (
                                    <div className="mt-2">
                                      <span className="text-xl font-bold">
                                        {match.scoreFor} - {match.scoreAgainst}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDetail(match.id)}
                                  >
                                    Ver
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Day Events */}
                    {dayEvents.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-foreground/70 font-medium">Eventos del día</div>
                        <div className="space-y-3">
                          {dayEvents.map((event) => (
                            <div key={event.id} className="rounded-xl border border-accent/30 bg-accent/10 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="text-lg font-semibold">{event.title}</h3>
                                  <div className="mt-1 flex items-center gap-4 text-sm text-foreground/70">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {event.allDay ? "Todo el día" : `${event.startTime} - ${event.endTime}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                // List view content
                <div className="space-y-4">
                  {matches.length === 0 ? (
                    <div className="text-center py-16">
                      <Trophy className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                      <p className="text-foreground/60">No hay partidos registrados. Programa tu primer partido.</p>
                    </div>
                  ) : (
                    matches.map((match) => (
                      <div key={match.id} className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">vs {match.opponent}</h3>
                              {getStatusBadge(match.status)}
                              {getResultBadge(match.result)}
                              <Badge variant="outline">
                                {match.sport === "FOOTBALL" ? "⚽ Fútbol" : "🏀 Básquetbol"}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(match.date).toLocaleDateString('es-CL', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              <span>📍 {match.location}</span>
                            </div>

                            {match.status === "COMPLETED" && match.scoreFor !== undefined && (
                              <div className="mt-3">
                                <span className="text-2xl font-bold">
                                  {match.scoreFor} - {match.scoreAgainst}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {match.status === "SCHEDULED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}/callup`)}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                Convocar
                              </Button>
                            )}
                            
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

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetail(match.id)}
                            >
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

          </>
        ) : (
          /* Results Tab Content */
          <div className="space-y-6">
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏆 Historial de Resultados
                  <span className="text-sm font-normal text-foreground/60">({pastResults.length})</span>
                </CardTitle>
                <CardDescription className="text-foreground/70">Todos los partidos disputados</CardDescription>
              </CardHeader>
              <CardContent>
                {pastResults.length === 0 ? (
                  <div className="text-center py-12 text-foreground/60">
                    <div className="text-4xl mb-4">⚽</div>
                    <div className="text-lg font-medium mb-2">Aún no hay resultados</div>
                    <div className="text-sm">Los partidos completados aparecerán aquí</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastResults.map((m) => (
                      <div key={m.id} className={`w-full rounded-xl border p-4 transition-all hover:shadow-md ${getResultColor(m)}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-semibold text-lg">vs {m.opponent}</div>
                            <div className="text-xs text-foreground/70 mt-1">
                              {new Date(m.date).toLocaleDateString('es-CL', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric',
                                weekday: 'short'
                              })}
                            </div>
                            <div className="text-xs text-foreground/50">{m.location}</div>
                          </div>
                          {getResultBadgeForMatch(m)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {m.status === 'COMPLETED' && m.scoreFor !== undefined && m.scoreAgainst !== undefined ? (
                            <div className="text-2xl font-bold">
                              {m.scoreFor} - {m.scoreAgainst}
                            </div>
                          ) : (
                            <div className="text-sm text-foreground/60">Sin resultado</div>
                          )}
                          
                          <Button size="sm" variant="outline" onClick={() => openDetail(m.id)}>
                            {m.status === 'COMPLETED' && m.scoreFor !== undefined ? 'Ver detalle' : 'Cargar resultado'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialog: Detalle/Editar Partido */}
        <Dialog open={openMatchDetail} onOpenChange={setOpenMatchDetail}>
          <DialogContent className="bg-background border-border text-foreground max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Gestión del Partido</DialogTitle>
              <DialogDescription className="text-foreground/70">Administra datos básicos y estadísticas del equipo</DialogDescription>
              
              {/* Tabs */}
              <div className="flex bg-muted/30 p-1 rounded-lg mt-3">
                <button 
                  onClick={() => setActiveTab('details')} 
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'details' ? 'bg-background shadow-sm' : 'hover:bg-muted/50'}`}
                >
                  Datos del Partido
                </button>
                <button 
                  onClick={() => setActiveTab('callup')} 
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'callup' ? 'bg-background shadow-sm' : 'hover:bg-muted/50'}`}
                >
                  Nómina
                </button>
                <button 
                  onClick={() => setActiveTab('stats')} 
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'stats' ? 'bg-background shadow-sm' : 'hover:bg-muted/50'}`}
                >
                  Estadísticas del Equipo
                </button>
              </div>
            </DialogHeader>
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                {activeTab === 'details' ? (
                  <div className="h-full overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label>Oponente</Label>
                        <Input value={matchForm.opponent || ''} onChange={(e) => setMatchForm(f => ({ ...f, opponent: e.target.value }))} className="bg-muted/50 border-border" />
                      </div>
                      <div className="grid gap-1">
                        <Label>Condición</Label>
                        <Select value={matchForm.homeAway || ''} onValueChange={(v) => setMatchForm(f => ({ ...f, homeAway: v as any }))}>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label>Ubicación</Label>
                        <Input value={matchForm.location || ''} onChange={(e) => setMatchForm(f => ({ ...f, location: e.target.value }))} className="bg-muted/50 border-border" />
                      </div>
                      <div className="grid gap-1">
                        <Label>Fecha y hora</Label>
                        <Input type="datetime-local" value={matchForm.date || ''} onChange={(e) => setMatchForm(f => ({ ...f, date: e.target.value }))} className="bg-muted/50 border-border" />
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label>Estado</Label>
                      <Select value={matchForm.status || 'SCHEDULED'} onValueChange={(v) => setMatchForm(f => ({ ...f, status: v as any }))}>
                        <SelectTrigger className="bg-muted/50 border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="SCHEDULED">Programado</SelectItem>
                          <SelectItem value="COMPLETED">Completado</SelectItem>
                          <SelectItem value="CANCELLED">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Marcador */}
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-3">Marcador</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                          <Label className="flex items-center gap-2">
                            {matchDetail?.sport === 'BASKETBALL' ? 'Puntos' : 'Goles'} a favor
                            {teamScoreFromStats > 0 && (
                              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Auto: {teamScoreFromStats}</span>
                            )}
                          </Label>
                          <Input 
                            type="number" min={0} 
                            value={matchForm.scoreFor ?? ''} 
                            onChange={(e) => setMatchForm(f => ({ ...f, scoreFor: e.target.value === '' ? null : Number(e.target.value) }))} 
                            className="bg-background border-border text-2xl font-bold text-center" 
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label>{matchDetail?.sport === 'BASKETBALL' ? 'Puntos' : 'Goles'} en contra</Label>
                          <Input 
                            type="number" min={0} 
                            value={matchForm.scoreAgainst ?? ''} 
                            onChange={(e) => setMatchForm(f => ({ ...f, scoreAgainst: e.target.value === '' ? null : Number(e.target.value) }))} 
                            className="bg-background border-border text-2xl font-bold text-center" 
                          />
                        </div>
                      </div>
                    </div>

                    {matchForm.status === 'COMPLETED' && (
                      <div className="grid gap-1">
                        <Label>Resultado (automático)</Label>
                        <div className="flex items-center gap-2">
                          {getResultBadge(matchForm.result || undefined)}
                          <span className="text-xs text-foreground/60">Se calcula según el marcador</span>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-1">
                      <Label>Notas</Label>
                      <Textarea rows={3} value={matchForm.notes || ''} onChange={(e) => setMatchForm(f => ({ ...f, notes: e.target.value }))} className="bg-muted/50 border-border" />
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto pr-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold">Estadísticas del equipo</div>
                      <div className="text-xs text-foreground/60 bg-muted/30 px-2 py-1 rounded">
                        {matchDetail?.sport === 'BASKETBALL' ? 'Básquetbol' : 'Fútbol'}
                      </div>
                    </div>
                    
                    {rosterLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-foreground/60">Cargando roster...</span>
                      </div>
                    ) : teamRoster.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-sm text-foreground/60">No se encontraron jugadores en el equipo.</div>
                      </div>
                    ) : (
                      <div className="border border-border rounded-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-muted/30 px-3 py-2 text-xs font-medium text-foreground/80 grid gap-2" style={{
                          gridTemplateColumns: matchDetail?.sport === 'BASKETBALL' 
                            ? '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr'
                            : '2fr 1fr 1fr 1fr 1fr 1fr'
                        }}>
                          <div>Jugador</div>
                          {matchDetail?.sport === 'BASKETBALL' ? (
                            <>
                              <div>Pts</div>
                              <div>Reb</div>
                              <div>Asis</div>
                              <div>Robos</div>
                              <div>Bloq</div>
                              <div>Faltas</div>
                              <div>Min</div>
                            </>
                          ) : (
                            <>
                              <div>Goles</div>
                              <div>Asis</div>
                              <div>Amarillas</div>
                              <div>Rojas</div>
                              <div>Min</div>
                            </>
                          )}
                        </div>
                        
                        {/* Players */}
                        <div className="max-h-96 overflow-y-auto">
                          {teamRoster.map((player) => {
                            const stats = detailedStatsForm[player.id] || {}
                            const updateStat = (field: string, value: string) => {
                              setDetailedStatsForm(prev => ({
                                ...prev,
                                [player.id]: {
                                  ...prev[player.id],
                                  [field]: value === '' ? undefined : Number(value)
                                }
                              }))
                            }
                            
                            return (
                              <div key={player.id} className="px-3 py-2 border-b border-border last:border-b-0 grid gap-2 items-center hover:bg-muted/20" style={{
                                gridTemplateColumns: matchDetail?.sport === 'BASKETBALL' 
                                  ? '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr'
                                  : '2fr 1fr 1fr 1fr 1fr 1fr'
                              }}>
                                <div className="text-sm">
                                  <div className="font-medium">{player.name}</div>
                                  {player.playerProfile?.position && (
                                    <div className="text-xs text-foreground/60">{player.playerProfile.position}</div>
                                  )}
                                </div>
                                
                                {matchDetail?.sport === 'BASKETBALL' ? (
                                  <>
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.points ?? ''} onChange={(e) => updateStat('points', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.rebounds ?? ''} onChange={(e) => updateStat('rebounds', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.assists ?? ''} onChange={(e) => updateStat('assists', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.steals ?? ''} onChange={(e) => updateStat('steals', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.blocks ?? ''} onChange={(e) => updateStat('blocks', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.fouls ?? ''} onChange={(e) => updateStat('fouls', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.minutes ?? ''} onChange={(e) => updateStat('minutes', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                  </>
                                ) : (
                                  <>
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.goals ?? ''} onChange={(e) => updateStat('goals', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.assists ?? ''} onChange={(e) => updateStat('assists', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.yellow ?? ''} onChange={(e) => updateStat('yellow', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.red ?? ''} onChange={(e) => updateStat('red', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                    <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={stats.minutes ?? ''} onChange={(e) => updateStat('minutes', e.target.value.replace(/[^0-9]/g, ''))} className="h-8 text-xs bg-background" />
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-foreground/50 mt-4 p-3 bg-muted/20 rounded-lg">
                      💡 Solo se guardarán las estadísticas de jugadores con al menos un valor mayor a 0.<br/>
                      📊 Los puntos/goles se sumarán automáticamente al marcador del equipo.
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setOpenMatchDetail(false)}>Cerrar</Button>
              <Button variant="secondary" onClick={saveDetailedStats} disabled={rosterLoading || !selectedMatchId}>
                {rosterLoading ? 'Guardando...' : 'Guardar estadísticas'}
              </Button>
              <Button onClick={saveDetail} disabled={detailLoading}>{detailLoading ? 'Guardando...' : 'Guardar cambios'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                <Input value={eventForm.title} onChange={(e) => setEventForm(f => ({ ...f, title: e.target.value }))} className="bg-muted/50 border-border" placeholder="vs Ryonan" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label>Oponente</Label>
                  <Input 
                    value={eventForm.opponent || ""} 
                    onChange={(e) => setEventForm(f => ({ ...f, opponent: e.target.value }))} 
                    className="bg-muted/50 border-border" 
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
                  className="bg-muted/50 border-border" 
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
                <Textarea rows={2} value={eventForm.description} onChange={(e) => setEventForm(f => ({ ...f, description: e.target.value }))} className="bg-muted/50 border-border" placeholder="Detalles adicionales del partido..." />
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
                  if (!eventForm.date) { setEventError("La fecha es obligatoria"); return }
                  if (!eventForm.opponent?.trim()) { setEventError("El oponente es obligatorio"); return }
                  if (!eventForm.location?.trim()) { setEventError("La ubicación es obligatoria"); return }
                  if (!eventForm.homeAway) { setEventError("Debe especificar si es local o visita"); return }
                  
                  const payload = { 
                    ...eventForm, 
                    type: "championship",
                    allDay: false,
                    published: true,
                    important: false
                  }
                  try {
                    setSavingEvent(true)
                    const res = await fetch("/api/admin/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                    if (!res.ok) {
                      let msg = "No se pudo guardar el partido"
                      try { const data = await res.json(); if (data?.error) msg = data.error } catch {}
                      setEventError(msg)
                      return
                    }
                    const created = await res.json()
                    
                    // Refresh data
                    await Promise.all([fetchMatches(), fetchEvents()])
                    setSelectedDate(keyToDate(created.date))
                    setOpenNewEvent(false)
                    setEventForm((f) => ({ ...f, title: "", description: "", opponent: "", location: "", homeAway: undefined }))
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
