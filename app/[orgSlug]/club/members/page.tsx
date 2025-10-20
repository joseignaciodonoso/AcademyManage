"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, UserPlus, Trophy, Target, Activity } from "lucide-react"

interface Member {
  id: string
  name: string
  email: string
  role: string
  playerProfile?: {
    position?: string
    jerseyNumber?: number
    joinDate?: string
  }
}

export default function ClubMembersPage() {
  const params = useParams()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    filterMembers()
  }, [members, searchTerm])

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/club/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterMembers = () => {
    if (!searchTerm) {
      setFilteredMembers(members)
      return
    }

    const filtered = members.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.playerProfile?.position?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredMembers(filtered)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "COACH":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Entrenador</Badge>
      case "STUDENT":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Jugador</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando jugadores...</p>
        </div>
      </div>
    )
  }

  const players = members.filter(m => m.role === "STUDENT")
  const coaches = members.filter(m => m.role === "COACH")

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jugadores del Club</h1>
          <p className="text-muted-foreground">
            Gestiona los integrantes del club deportivo
          </p>
        </div>
        <Button onClick={() => router.push(`/${params.orgSlug}/club/members/new`)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar Jugador
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jugadores</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrenadores</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coaches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrantes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o posición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {searchTerm
                  ? "No se encontraron jugadores con ese criterio"
                  : "No hay jugadores registrados. Agrega tu primer jugador."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/${params.orgSlug}/club/players/${member.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{member.name}</h3>
                        {member.playerProfile?.jerseyNumber && (
                          <Badge variant="outline" className="text-xs">
                            #{member.playerProfile.jerseyNumber}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {member.email}
                      </p>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRoleBadge(member.role)}
                        {member.playerProfile?.position && (
                          <Badge variant="secondary" className="text-xs">
                            {member.playerProfile.position}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
