"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Search, Trophy, Users, FileText, Star, Filter } from "lucide-react"

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
}

export default function MatchesListPage() {
  const params = useParams()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sportFilter, setSportFilter] = useState<string>("all")

  useEffect(() => {
    fetchMatches()
  }, [])

  useEffect(() => {
    filterMatches()
  }, [matches, searchTerm, statusFilter, sportFilter])

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/club/matches")
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterMatches = () => {
    let filtered = [...matches]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(match =>
        match.opponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(match => match.status === statusFilter)
    }

    // Sport filter
    if (sportFilter !== "all") {
      filtered = filtered.filter(match => match.sport === sportFilter)
    }

    setFilteredMatches(filtered)
  }

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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partidos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los partidos del club
          </p>
        </div>
        <Button onClick={() => router.push(`/${params.orgSlug}/club/matches/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Partido
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar rival o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="SCHEDULED">Programado</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Sport Filter */}
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Deporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los deportes</SelectItem>
                <SelectItem value="FOOTBALL">⚽ Fútbol</SelectItem>
                <SelectItem value="BASKETBALL">🏀 Básquetbol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partidos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches.filter(m => m.status === "SCHEDULED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Victorias</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {matches.filter(m => m.result === "WIN").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Derrotas</CardTitle>
            <Trophy className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {matches.filter(m => m.result === "LOSS").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== "all" || sportFilter !== "all"
                  ? "No se encontraron partidos con los filtros aplicados"
                  : "No hay partidos registrados. Crea tu primer partido."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMatches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
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

                  {/* Actions */}
                  <div className="flex gap-2">
                    {match.status === "SCHEDULED" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}/callup`)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Convocar
                        </Button>
                      </>
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
                      onClick={() => router.push(`/${params.orgSlug}/club/matches/${match.id}`)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
