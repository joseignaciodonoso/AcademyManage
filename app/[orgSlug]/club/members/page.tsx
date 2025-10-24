"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, UserPlus, Trophy, Target, Activity, Users, List, Grid3X3 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Member {
  id: string
  name: string
  email: string
  role: string
  playerProfile?: {
    position?: string
    preferredNumber?: number
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
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "",
    jerseyNumber: "",
    shirtSize: "M",
  })
  const canCreate = form.name.trim() && form.email.trim()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STUDENT" | "COACH">("ALL")
  const [positionFilter, setPositionFilter] = useState<string>("")
  const [sizeFilter, setSizeFilter] = useState<string>("ALL")

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
    let data = [...members]
    if (roleFilter !== "ALL") {
      data = data.filter((m) => m.role === roleFilter)
    }
    if (positionFilter) {
      data = data.filter((m) => (m.playerProfile?.position || "").toLowerCase().includes(positionFilter.toLowerCase()))
    }
    if (sizeFilter !== "ALL") {
      data = data.filter((m: any) => (m.playerProfile?.shirtSize || "").toLowerCase() === sizeFilter.toLowerCase())
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      data = data.filter((member) =>
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        (member.playerProfile?.position || "").toLowerCase().includes(q)
      )
    }
    setFilteredMembers(data)
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
        <div className="flex gap-2">
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/${params.orgSlug}/club/players/compare`)}
          >
            <Users className="h-4 w-4 mr-2" />
            Comparar Jugadores
          </Button>
          <Button onClick={() => setOpenCreate(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Jugador
          </Button>
        </div>
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
          <CardTitle>Buscar y Filtrar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o posición..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="STUDENT">Jugadores</SelectItem>
                  <SelectItem value="COACH">Entrenadores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
              <Input placeholder="Posición" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} />
              <Select value={sizeFilter} onValueChange={(v) => setSizeFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Talla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/${params.orgSlug}/club/members/${member.id}`)}>
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
                        {member.playerProfile?.preferredNumber && (
                          <Badge variant="outline" className="text-xs">#{member.playerProfile.preferredNumber}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">{member.email}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRoleBadge(member.role)}
                        {member.playerProfile?.position && (
                          <Badge variant="secondary" className="text-xs">{member.playerProfile.position}</Badge>
                        )}
                        {(member as any).playerProfile?.shirtSize && (
                          <Badge variant="outline" className="text-xs">Talla {(member as any).playerProfile?.shirtSize}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/${params.orgSlug}/club/members/${member.id}`)}>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{member.name}</span>
                        {member.playerProfile?.preferredNumber && (
                          <Badge variant="outline" className="text-xs">#{member.playerProfile.preferredNumber}</Badge>
                        )}
                        {member.playerProfile?.position && (
                          <Badge variant="secondary" className="text-xs">{member.playerProfile.position}</Badge>
                        )}
                        {(member as any).playerProfile?.shirtSize && (
                          <Badge variant="outline" className="text-xs">{(member as any).playerProfile?.shirtSize}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {getRoleBadge(member.role)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Player Modal */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscripción de Jugador</DialogTitle>
            <DialogDescription>Registra un nuevo jugador del club.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="juan@club.cl"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="position">Posición</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  placeholder="Base / Alero / Pívot"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jerseyNumber">Nº Camiseta</Label>
                <Input
                  id="jerseyNumber"
                  inputMode="numeric"
                  value={form.jerseyNumber}
                  onChange={(e) => setForm((f) => ({ ...f, jerseyNumber: e.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder="10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Talla de Polera</Label>
              <Select value={form.shirtSize} onValueChange={(v) => setForm((f) => ({ ...f, shirtSize: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona talla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button
              disabled={!canCreate || creating}
              onClick={async () => {
                try {
                  setCreating(true)
                  const res = await fetch("/api/club/members", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: form.name.trim(),
                      email: form.email.trim(),
                      position: form.position.trim() || undefined,
                      preferredNumber: form.jerseyNumber ? Number(form.jerseyNumber) : undefined,
                      shirtSize: form.shirtSize,
                    }),
                  })
                  if (!res.ok) throw new Error("No se pudo crear el jugador")
                  setOpenCreate(false)
                  setForm({ name: "", email: "", position: "", jerseyNumber: "", shirtSize: "M" })
                  await fetchMembers()
                } catch (e) {
                  console.error(e)
                } finally {
                  setCreating(false)
                }
              }}
            >
              {creating ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
