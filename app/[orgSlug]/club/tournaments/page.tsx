"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trophy, Plus, Calendar, Users } from "lucide-react"
import { toast } from "sonner"

export default function TournamentsPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    season: new Date().getFullYear().toString(),
    type: "LEAGUE",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    rules: "",
  })

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/club/tournaments")
      if (!res.ok) throw new Error("Error")
      const data = await res.json()
      setTournaments(data.tournaments)
    } catch (error) {
      toast.error("Error al cargar torneos")
    } finally {
      setLoading(false)
    }
  }

  const createTournament = async () => {
    try {
      const res = await fetch("/api/club/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Error")
      toast.success("Torneo creado exitosamente")
      setOpenDialog(false)
      fetchTournaments()
      setForm({
        name: "",
        description: "",
        season: new Date().getFullYear().toString(),
        type: "LEAGUE",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        rules: "",
      })
    } catch (error) {
      toast.error("Error al crear torneo")
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: any = {
      LEAGUE: "bg-blue-100 text-blue-700",
      CUP: "bg-purple-100 text-purple-700",
      FRIENDLY: "bg-green-100 text-green-700",
      PLAYOFF: "bg-red-100 text-red-700",
    }
    const labels: any = {
      LEAGUE: "Liga",
      CUP: "Copa",
      FRIENDLY: "Amistoso",
      PLAYOFF: "Playoff",
    }
    return <Badge className={colors[type] || ""}>{labels[type] || type}</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700">Activo</Badge>
      case "FINISHED":
        return <Badge className="bg-gray-100 text-gray-700">Finalizado</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Torneos y Ligas</h1>
            <p className="text-foreground/70">Gestiona competiciones y estadísticas</p>
          </div>
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Torneo
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : tournaments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-foreground/40" />
              <h3 className="text-lg font-semibold mb-2">No hay torneos</h3>
              <p className="text-foreground/60 mb-4">Crea tu primer torneo para empezar</p>
              <Button onClick={() => setOpenDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Torneo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => router.push(`/club/tournaments/${tournament.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Trophy className="h-8 w-8 text-primary" />
                    <div className="flex gap-2">
                      {getTypeBadge(tournament.type)}
                      {getStatusBadge(tournament.status)}
                    </div>
                  </div>
                  <CardTitle>{tournament.name}</CardTitle>
                  <CardDescription>Temporada {tournament.season}</CardDescription>
                </CardHeader>
                <CardContent>
                  {tournament.description && (
                    <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                      {tournament.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground/60">
                      <Calendar className="h-4 w-4" />
                      {new Date(tournament.startDate).toLocaleDateString('es-CL')}
                      {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString('es-CL')}`}
                    </div>
                    <div className="flex items-center gap-2 text-foreground/60">
                      <Users className="h-4 w-4" />
                      {tournament._count?.matches || 0} partidos
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Torneo</DialogTitle>
              <DialogDescription>
                Configura un nuevo torneo o liga para tu equipo
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nombre del Torneo *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Liga Nacional 2025"
                />
              </div>

              <div className="grid gap-2">
                <Label>Descripción</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción del torneo..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Temporada *</Label>
                  <Input
                    value={form.season}
                    onChange={(e) => setForm({ ...form, season: e.target.value })}
                    placeholder="2025"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Tipo *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEAGUE">Liga</SelectItem>
                      <SelectItem value="CUP">Copa</SelectItem>
                      <SelectItem value="FRIENDLY">Amistoso</SelectItem>
                      <SelectItem value="PLAYOFF">Playoff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Reglas y Bases</Label>
                <Textarea
                  value={form.rules}
                  onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  placeholder="Reglas específicas del torneo..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={createTournament} disabled={!form.name || !form.season}>
                Crear Torneo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
