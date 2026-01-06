"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import { ComparePlayersModal } from "@/components/club/players/compare-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [openCompare, setOpenCompare] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openCreate, setOpenCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const playerSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().min(1, "El email es requerido").email("Ingresa un email válido"),
    position: z.string().optional().transform(v => (v || "").trim()),
    jerseyNumber: z
      .string()
      .optional()
      .transform(v => (v || "").replace(/[^0-9]/g, "")),
    shirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).default("M"),
  })
  type PlayerForm = z.infer<typeof playerSchema>

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
    mode: "onChange",
    defaultValues: { name: "", email: "", position: "", jerseyNumber: "", shirtSize: "M" },
  })
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

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jugadores del Club</h1>
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
            onClick={() => setOpenCompare(true)}
            disabled={selectedIds.length < 1}
          >
            <Users className="h-4 w-4 mr-2" />
            Comparar / Métricas {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </Button>
          <Button onClick={() => setOpenCreate(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Jugador
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--primary))]/10 to-transparent border-[hsl(var(--primary))]/30">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[hsl(var(--primary))]/15" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">Total Jugadores</CardTitle>
            <div className="p-2 rounded-lg bg-[hsl(var(--primary))]/15">
              <Trophy className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players.length}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--accent))]/10 to-transparent border-[hsl(var(--accent))]/30">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[hsl(var(--accent))]/15" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">Entrenadores</CardTitle>
            <div className="p-2 rounded-lg bg-[hsl(var(--accent))]/15">
              <Target className="h-4 w-4 text-[hsl(var(--accent))]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coaches.length}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-green-500/15" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-[hsl(var(--foreground))]">Total Integrantes</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/15">
              <Activity className="h-4 w-4 text-green-400" />
            </div>
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
              <Card key={member.id} className={`hover:shadow-lg transition-shadow cursor-pointer ${selectedIds.includes(member.id) ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : ""}`}
                onClick={() => router.push(`/${params.orgSlug}/club/members/${member.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox checked={selectedIds.includes(member.id)} onCheckedChange={(v) => { v; toggleSelection(member.id) }} onClick={(e) => e.stopPropagation()} className="mt-1" />
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
                  <div key={member.id} className={`flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer ${selectedIds.includes(member.id) ? "bg-[hsl(var(--primary))]/5" : ""}`} onClick={() => router.push(`/${params.orgSlug}/club/members/${member.id}`)}>
                    <Checkbox checked={selectedIds.includes(member.id)} onCheckedChange={(v) => { v; toggleSelection(member.id) }} onClick={(e) => e.stopPropagation()} />
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
          <form
            onSubmit={handleSubmit(async (data) => {
              try {
                setCreating(true)
                const res = await fetch("/api/club/members", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: data.name.trim(),
                    email: data.email.trim(),
                    position: data.position || undefined,
                    preferredNumber: data.jerseyNumber ? Number(data.jerseyNumber) : undefined,
                    shirtSize: data.shirtSize,
                  }),
                })
                if (!res.ok) throw new Error("No se pudo crear el jugador")
                setOpenCreate(false)
                reset()
                await fetchMembers()
              } catch (e) {
                console.error(e)
              } finally {
                setCreating(false)
              }
            })}
            className="grid gap-4 py-2"
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label>
              <Input id="name" placeholder="Juan Pérez" className={`placeholder:text-foreground/60 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`} {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" placeholder="juan@club.cl" className={`placeholder:text-foreground/60 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`} {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="position">Posición</Label>
                <Input id="position" placeholder="Base / Alero / Pívot" className="placeholder:text-foreground/60" {...register("position")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jerseyNumber">Nº Camiseta</Label>
                <Input id="jerseyNumber" inputMode="numeric" placeholder="10" className="placeholder:text-foreground/60" {...register("jerseyNumber")} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Talla de Polera</Label>
              <Select value={watch("shirtSize")} onValueChange={(v) => reset({ ...watch(), shirtSize: v as PlayerForm["shirtSize"] })}>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isValid || creating}>
                {creating ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ComparePlayersModal
        open={openCompare}
        onOpenChange={(v) => { if (!v) setOpenCompare(false) }}
        players={members}
        selectedIds={selectedIds}
        onRemoveSelected={(id) => setSelectedIds((prev) => prev.filter(x => x !== id))}
      />
      </div>
    </div>
  )
}
