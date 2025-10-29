"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import { Calendar, Plus, Trophy, FileText, AlertCircle, ClockIcon } from "lucide-react"
import { toast } from "sonner"
import { format, isSameDay, isPast, isFuture, isToday, startOfDay } from "date-fns"
import { es } from "date-fns/locale"

// Import components
import { MatchCard } from "./components/MatchCard"
import { MatchDetailModal } from "./components/MatchDetailModal"
import { ResultConfirmationModal } from "./components/ResultConfirmationModal"
import { DayMatchesModal } from "./components/DayMatchesModal"

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
  _count?: { evaluations: number }
}

export default function MatchesPage() {
  const params = useParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"calendar" | "list">("calendar")
  const [listView, setListView] = useState<"upcoming" | "results">("upcoming")
  
  // Data state
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  
  // Calendar state
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  
  // Match detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  
  // Match form for editing
  const [matchForm, setMatchForm] = useState({
    opponent: "",
    location: "",
    homeAway: "HOME" as "HOME" | "AWAY",
    date: "",
    time: "",
    notes: "",
    goalsFor: "",
    goalsAgainst: "",
    pointsFor: "",
    pointsAgainst: "",
    sport: "FOOTBALL" as "FOOTBALL" | "BASKETBALL",
    tournamentId: "",
  })
  
  // Day matches modal
  const [dayMatchesModalOpen, setDayMatchesModalOpen] = useState(false)
  
  // Result confirmation modal
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [confirmingMatchId, setConfirmingMatchId] = useState<string | null>(null)
  const [clubSport, setClubSport] = useState<"FOOTBALL" | "BASKETBALL">("FOOTBALL")

  useEffect(() => {
    setMounted(true)
    fetchMatches()
    fetchClubInfo()
  }, [])

  const fetchClubInfo = async () => {
    try {
      const res = await fetch("/api/club/info")
      if (res.ok) {
        const data = await res.json()
        setClubSport(data.primarySport || "FOOTBALL")
      }
    } catch (error) {
      console.error("Error fetching club info:", error)
    }
  }

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/club/matches")
      if (!res.ok) throw new Error("Error al cargar partidos")
      const data = await res.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al cargar los partidos")
    } finally {
      setLoading(false)
    }
  }

  // Categorize matches
  const { upcomingMatches, pastMatches, pendingResults } = useMemo(() => {
    const now = new Date()
    
    const upcoming = matches
      .filter(m => {
        const matchDate = new Date(m.date)
        return isFuture(matchDate) || (isToday(matchDate) && m.status === "SCHEDULED")
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const past = matches
      .filter(m => {
        const matchDate = new Date(m.date)
        return (isPast(matchDate) && !isToday(matchDate)) || m.status === "FINISHED"
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    const pending = matches
      .filter(m => {
        const matchDate = new Date(m.date)
        return isPast(matchDate) && 
               m.status === "SCHEDULED" && 
               (m.goalsFor === null || m.goalsFor === undefined) &&
               (m.pointsFor === null || m.pointsFor === undefined)
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return {
      upcomingMatches: upcoming,
      pastMatches: past,
      pendingResults: pending
    }
  }, [matches])

  // Get matches for a specific date
  const getMatchesForDate = (date: Date) => {
    return matches.filter(match => 
      isSameDay(new Date(match.date), date)
    )
  }

  // Get days with matches for calendar
  const daysWithMatches = useMemo(() => {
    return matches.map(match => startOfDay(new Date(match.date)))
  }, [matches])

  // Handle date click in calendar
  const handleDateClick = (date: Date | undefined) => {
    if (!date) return
    
    const dayMatches = getMatchesForDate(date)
    
    if (dayMatches.length > 0) {
      // If there are matches on this day, show them
      setSelectedDate(date)
      setDayMatchesModalOpen(true)
    } else {
      // If no matches, open create modal with this date preselected
      setSelectedDate(date)
      setMatchForm({
        opponent: "",
        location: "",
        homeAway: "HOME",
        date: format(date, "yyyy-MM-dd"),
        time: "15:00",
        notes: "",
        goalsFor: "",
        goalsAgainst: "",
        pointsFor: "",
        pointsAgainst: "",
        sport: clubSport, // Use club's sport automatically
        tournamentId: "",
      })
      setSelectedMatchId(null)
      setEditMode(true)
      setDetailModalOpen(true)
    }
  }

  // Handle match selection from day modal
  const handleMatchSelectFromDay = (matchId: string) => {
    setDayMatchesModalOpen(false)
    handleMatchSelect(matchId)
    setDetailModalOpen(true)
  }

  // Handle match selection
  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId)
    const match = matches.find(m => m.id === matchId)
    if (match) {
      const matchDate = new Date(match.date)
      setMatchForm({
        opponent: match.opponent,
        location: match.location,
        homeAway: match.homeAway || "HOME",
        date: format(matchDate, "yyyy-MM-dd"),
        time: format(matchDate, "HH:mm"),
        notes: match.notes || "",
        goalsFor: match.goalsFor?.toString() || "",
        goalsAgainst: match.goalsAgainst?.toString() || "",
        pointsFor: match.pointsFor?.toString() || "",
        pointsAgainst: match.pointsAgainst?.toString() || "",
        sport: (match as any).sport || "FOOTBALL",
        tournamentId: (match as any).tournamentId || "",
      })
    }
  }

  // Update or create match
  const handleUpdateMatch = async () => {
    try {
      const dateTime = new Date(`${matchForm.date}T${matchForm.time}`)
      
      const matchData: any = {
        opponent: matchForm.opponent,
        location: matchForm.location,
        homeAway: matchForm.homeAway,
        date: dateTime.toISOString(),
        notes: matchForm.notes,
        sport: matchForm.sport,
        tournamentId: matchForm.tournamentId || null,
      }

      if (selectedMatchId) {
        // Update existing match
        const match = matches.find(m => m.id === selectedMatchId)
        if (!match) return

        // Add scores if provided
        if (match.sport === "FOOTBALL") {
          if (matchForm.goalsFor) matchData.scoreFor = parseInt(matchForm.goalsFor)
          if (matchForm.goalsAgainst) matchData.scoreAgainst = parseInt(matchForm.goalsAgainst)
        } else {
          if (matchForm.pointsFor) matchData.scoreFor = parseInt(matchForm.pointsFor)
          if (matchForm.pointsAgainst) matchData.scoreAgainst = parseInt(matchForm.pointsAgainst)
        }

        // If scores are complete, mark as FINISHED
        if (matchData.scoreFor !== undefined && matchData.scoreAgainst !== undefined) {
          matchData.status = "FINISHED"
        }

        const res = await fetch(`/api/club/matches/${selectedMatchId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(matchData),
        })

        if (!res.ok) throw new Error("Error al actualizar")
        toast.success("Partido actualizado correctamente")
      } else {
        // Create new match
        const res = await fetch("/api/club/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(matchData),
        })

        if (!res.ok) throw new Error("Error al crear")
        toast.success("Partido creado correctamente")
      }

      setEditMode(false)
      setDetailModalOpen(false)
      fetchMatches()
    } catch (error) {
      console.error("Error:", error)
      toast.error(selectedMatchId ? "Error al actualizar el partido" : "Error al crear el partido")
    }
  }

  // Confirm match result
  const handleConfirmResult = async (confirmed: boolean, options?: { reschedule?: boolean; dateISO?: string }) => {
    if (!confirmingMatchId) return

    try {
      if (confirmed) {
        // User confirms match was played - open edit to add results
        setResultModalOpen(false)
        setSelectedMatchId(confirmingMatchId)
        const match = matches.find(m => m.id === confirmingMatchId)
        if (match) {
          const matchDate = new Date(match.date)
          setMatchForm({
            opponent: match.opponent,
            location: match.location,
            homeAway: match.homeAway || "HOME",
            date: format(matchDate, "yyyy-MM-dd"),
            time: format(matchDate, "HH:mm"),
            notes: match.notes || "",
            goalsFor: "",
            goalsAgainst: "",
            pointsFor: "",
            pointsAgainst: "",
            sport: (match as any).sport || "FOOTBALL",
            tournamentId: (match as any).tournamentId || "",
          })
          setEditMode(true)
          setDetailModalOpen(true)
        }
      } else {
        // User says match wasn't played
        if (options?.reschedule && options.dateISO) {
          // Reschedule to a new date/time and set status to SCHEDULED
          const res = await fetch(`/api/club/matches/${confirmingMatchId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: options.dateISO, status: "SCHEDULED" }),
          })
          if (!res.ok) throw new Error("Error")
          toast.success("Partido reagendado")
        } else {
          // Cancel the match
          const res = await fetch(`/api/club/matches/${confirmingMatchId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CANCELLED" }),
          })
  
          if (!res.ok) throw new Error("Error")
          toast.success("Partido cancelado")
        }
        fetchMatches()
        setResultModalOpen(false)
      }

      setConfirmingMatchId(null)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al procesar la acción")
    }
  }

  if (!mounted) return null

  const selectedMatch = selectedMatchId ? (matches.find(m => m.id === selectedMatchId) || null) : null
  const selectedDayMatches = selectedDate ? getMatchesForDate(selectedDate) : []
  const confirmingMatch = confirmingMatchId ? (matches.find(m => m.id === confirmingMatchId) || null) : null

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Partidos</h1>
          <p className="text-muted-foreground">Gestiona los partidos del club</p>
        </div>
        <Button onClick={() => router.push(`/${params.orgSlug}/club/matches/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Partido
        </Button>
      </div>

      {/* Pending Results Alert */}
      {pendingResults.length > 0 && (
        <Alert className="border-red-400 bg-transparent">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-foreground">
            <div className="flex justify-between items-center">
              <span>
                <strong>{pendingResults.length}</strong> partido(s) finalizado(s) sin resultados cargados.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300"
                onClick={() => {
                  setListView("upcoming")
                  setActiveTab("list")
                }}
              >
                Cargar Resultados
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 rounded-t-md ${
            activeTab === "calendar"
              ? "border-primary text-primary bg-primary/10 shadow-inner"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          Calendario
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 rounded-t-md ${
            activeTab === "list"
              ? "border-primary text-primary bg-primary/10 shadow-inner"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Lista
        </button>
      </div>

      {/* Calendar View */}
      {activeTab === "calendar" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Calendario de Partidos</CardTitle>
            <CardDescription>
              Haz click en un día con partido (punto azul) para ver los detalles, o en un día vacío para crear un nuevo partido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full flex justify-center">
              <UiCalendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateClick}
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                className="rounded-md border w-full"
                modifiers={{
                  hasMatch: daysWithMatches
                }}
                modifiersStyles={{
                  hasMatch: {
                    position: 'relative',
                    fontWeight: 'bold',
                  }
                }}
                modifiersClassNames={{
                  hasMatch: 'has-match-indicator'
                }}
                locale={es}
              />
            </div>

            <style jsx global>{`
              .has-match-indicator::after {
                content: '';
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                background-color: hsl(var(--primary));
                border-radius: 50%;
              }
              
              .rdp {
                --rdp-cell-size: 60px;
              }
              
              .rdp-months {
                width: 100%;
              }
              
              .rdp-month {
                width: 100%;
              }
              
              .rdp-table {
                width: 100%;
                max-width: 100%;
              }
              
              .rdp-caption {
                padding: 1rem 0;
              }
            `}</style>

            {/* Pending results section below calendar */}
            {pendingResults.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-orange-600" />
                  Partidos Pendientes de Resultado
                </h3>
                <div className="space-y-3">
                  {pendingResults.slice(0, 3).map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">vs {match.opponent}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(match.date), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setConfirmingMatchId(match.id)
                          setResultModalOpen(true)
                        }}
                      >
                        Confirmar Resultado
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {activeTab === "list" && (
        <div className="space-y-6">
          {/* List View Tabs */}
          <div className="flex gap-2">
            <Button
              variant={listView === "upcoming" ? "default" : "outline"}
              onClick={() => setListView("upcoming")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Próximos Partidos ({upcomingMatches.length})
            </Button>
            <Button
              variant={listView === "results" ? "default" : "outline"}
              onClick={() => setListView("results")}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Resultados ({pastMatches.length})
            </Button>
          </div>

          {/* Upcoming Matches */}
          {listView === "upcoming" && (
            <div className="space-y-4">
              {/* Show pending results first */}
              {pendingResults.length > 0 && (
                <Card className="border-orange-200">
                  <CardHeader className="bg-orange-50">
                    <CardTitle className="text-orange-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Requieren Atención
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {pendingResults.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onSelect={() => {
                            setConfirmingMatchId(match.id)
                            setResultModalOpen(true)
                          }}
                          isPending
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {upcomingMatches.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No hay partidos programados</p>
                    <Button onClick={() => router.push(`/${params.orgSlug}/club/matches/new`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Programar Partido
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                upcomingMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onSelect={() => {
                      handleMatchSelect(match.id)
                      setDetailModalOpen(true)
                    }}
                  />
                ))
              )}
            </div>
          )}

          {/* Past Matches / Results */}
          {listView === "results" && (
            <div className="space-y-4">
              {pastMatches.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay resultados todavía</p>
                  </CardContent>
                </Card>
              ) : (
                pastMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onSelect={() => {
                      handleMatchSelect(match.id)
                      setDetailModalOpen(true)
                    }}
                    showResult
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Day Matches Modal */}
      <DayMatchesModal
        open={dayMatchesModalOpen}
        onOpenChange={setDayMatchesModalOpen}
        date={selectedDate}
        matches={selectedDayMatches}
        onMatchSelect={handleMatchSelectFromDay}
      />

      {/* Match Detail Modal */}
      <MatchDetailModal
        open={detailModalOpen}
        onOpenChange={(open) => {
          setDetailModalOpen(open)
          if (!open) {
            setSelectedMatchId(null)
            setEditMode(false)
          }
        }}
        match={selectedMatch}
        editMode={editMode}
        setEditMode={setEditMode}
        matchForm={matchForm}
        setMatchForm={setMatchForm}
        onUpdate={handleUpdateMatch}
        onNavigateToCallup={() => router.push(`/${params.orgSlug}/club/matches/${selectedMatchId}/callup`)}
        onNavigateToEvaluation={() => router.push(`/${params.orgSlug}/club/matches/${selectedMatchId}/evaluation`)}
      />

      {/* Result Confirmation Modal */}
      <ResultConfirmationModal
        open={resultModalOpen}
        onOpenChange={setResultModalOpen}
        match={confirmingMatch}
        onConfirm={handleConfirmResult}
      />
    </div>
  )
}
