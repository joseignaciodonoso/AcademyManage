"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Users, Scale, Ruler, Shield, ArrowLeft, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Member {
  id: string
  name: string
  email: string
  role: string
  playerProfile?: {
    position?: string
    preferredNumber?: number
    heightCm?: number
    weightKg?: number
    dominantFoot?: string
  }
}

export default function PlayersComparePage() {
  const params = useParams()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/club/members")
        if (res.ok) {
          const data = await res.json()
          setMembers((data.members || []) as Member[])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const players = useMemo(() => members.filter(m => m.role === "STUDENT"), [members])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return players
    return players.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query) ||
      (p.playerProfile?.position || "").toLowerCase().includes(query)
    )
  }, [q, players])

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 4) return prev // límite 4
      return [...prev, id]
    })
  }

  const clearSelection = () => setSelected([])
  const selectFirstVisible = () => setSelected(filtered.slice(0, 4).map(p => p.id))

  const selectedPlayers = useMemo(() => filtered.filter(p => selected.includes(p.id)), [filtered, selected])

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando jugadores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Button variant="ghost" onClick={() => router.push(`/${params.orgSlug}/club/members`)} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Comparar Jugadores</h1>
            <p className="text-muted-foreground">Selecciona hasta 4 jugadores para comparar atributos.</p>
          </div>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o posición"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="pl-10 placeholder:text-foreground/60"
          />
        </div>
      </div>

      {/* Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle>Selecciona jugadores</CardTitle>
              <CardDescription>Hasta 4 jugadores. Filtra por nombre, email o posición.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearSelection} disabled={selected.length===0}>Limpiar selección</Button>
              <Button variant="secondary" size="sm" onClick={selectFirstVisible} disabled={filtered.length===0}>Seleccionar visibles</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay jugadores para mostrar.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <Card key={p.id} className={`transition border ${selected.includes(p.id) ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : ""}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} className="mt-1" />
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(p.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate">{p.name}</div>
                        {p.playerProfile?.preferredNumber && (
                          <Badge variant="outline" className="text-xs">#{p.playerProfile.preferredNumber}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {(p.playerProfile?.position) && <Badge variant="secondary" className="text-xs">{p.playerProfile.position}</Badge>}
                        <Badge variant="outline" className="text-xs">Jugador</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparación */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedPlayers.map((p) => (
            <Card key={p.id} className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--accent))]/10 to-transparent border-[hsl(var(--accent))]/30">
              <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[hsl(var(--accent))]/15" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <span className="truncate mr-2">{p.name}</span>
                  <div className="p-2 rounded-lg bg-[hsl(var(--accent))]/15">
                    <Users className="h-4 w-4 text-[hsl(var(--accent))]" />
                  </div>
                </CardTitle>
                <CardDescription className="truncate">{p.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Shield className="h-4 w-4" /> Posición</span>
                  <span className="font-medium">{p.playerProfile?.position || "—"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Badge variant="outline" className="text-[10px]">#</Badge> N° Camiseta</span>
                  <span className="font-medium">{p.playerProfile?.preferredNumber ?? "—"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Ruler className="h-4 w-4" /> Altura</span>
                  <span className="font-medium">{p.playerProfile?.heightCm ? `${p.playerProfile.heightCm} cm` : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Scale className="h-4 w-4" /> Peso</span>
                  <span className="font-medium">{p.playerProfile?.weightKg ? `${p.playerProfile.weightKg} kg` : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Perfil</span>
                  <span className="font-medium">{p.playerProfile?.dominantFoot || "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPlayers.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              Selecciona jugadores para ver la comparación aquí.
            </CardContent>
          </Card>
        )}

        {selectedPlayers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Comparativa detallada</CardTitle>
              <CardDescription>Vista tabular con desplazamiento horizontal en móvil.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Atributo</TableHead>
                      {selectedPlayers.map(p => (
                        <TableHead key={p.id} className="whitespace-nowrap">{p.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-muted-foreground">Email</TableCell>
                      {selectedPlayers.map(p => (<TableCell key={p.id} className="whitespace-nowrap">{p.email}</TableCell>))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">Posición</TableCell>
                      {selectedPlayers.map(p => (<TableCell key={p.id}>{p.playerProfile?.position || "—"}</TableCell>))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">N° Camiseta</TableCell>
                      {selectedPlayers.map(p => (<TableCell key={p.id}>{p.playerProfile?.preferredNumber ?? "—"}</TableCell>))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">Altura</TableCell>
                      {selectedPlayers.map(p => (<TableCell key={p.id}>{p.playerProfile?.heightCm ? `${p.playerProfile.heightCm} cm` : "—"}</TableCell>))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">Peso</TableCell>
                      {selectedPlayers.map(p => (<TableCell key={p.id}>{p.playerProfile?.weightKg ? `${p.playerProfile.weightKg} kg` : "—"}</TableCell>))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">Perfil</TableCell>
                      {selectedPlayers.map(p => (<TableCell key={p.id}>{p.playerProfile?.dominantFoot || "—"}</TableCell>))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
