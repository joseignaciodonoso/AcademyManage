"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Users, Scale, Ruler, Shield, BarChart3, X, Table as TableIcon, LayoutGrid, ArrowLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface Member {
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

interface PlayerMetrics {
  id: string
  goals?: number
  assists?: number
  matches?: number
  rating?: number
  minutes?: number
}

export function ComparePlayersModal({ open, onOpenChange, players, selectedIds, onRemoveSelected }: { open: boolean; onOpenChange: (v: boolean) => void; players: Member[]; selectedIds: string[]; onRemoveSelected?: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<Record<string, PlayerMetrics>>({})
  const [view, setView] = useState<"resumen" | "tabla">("resumen")

  useEffect(() => {
    const loadMetrics = async () => {
      if (!open) return
      if (!selectedIds || selectedIds.length === 0) return
      try {
        setLoading(true)
        const res = await fetch(`/api/club/metrics?ids=${encodeURIComponent(selectedIds.join(","))}`)
        if (!res.ok) return
        const data: PlayerMetrics[] = await res.json()
        const map: Record<string, PlayerMetrics> = {}
        for (const m of data) map[m.id] = m
        setMetrics(map)
      } catch {}
      finally { setLoading(false) }
    }
    loadMetrics()
  }, [selectedIds, open])

  const selectedPlayers = useMemo(() => players.filter(p => selectedIds.includes(p.id)), [players, selectedIds])

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)

  const gridClass = useMemo(() => {
    const n = Math.min(selectedPlayers.length || 1, 4)
    switch (n) {
      case 1: return "grid grid-cols-1 max-w-lg mx-auto"
      case 2: return "grid grid-cols-1 lg:grid-cols-2 gap-6"
      case 3: return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      case 4: return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      default: return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
    }
  }, [selectedPlayers.length])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-[min(90vw,1400px)] w-screen p-0 overflow-hidden sm:rounded-xl rounded-none sm:h-auto h-[100dvh] sm:shadow-2xl sm:max-w-[1400px]">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
          <DialogHeader className="px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-left min-w-0">
                <DialogTitle className="text-xl font-bold">Comparar Jugadores</DialogTitle>
                <DialogDescription className="truncate hidden sm:block text-base">{selectedPlayers.length} seleccionado(s). Revisa atributos y métricas.</DialogDescription>
              </div>
              <Button variant="ghost" size="default" className="sm:size-default h-10 px-4" onClick={() => onOpenChange(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver a jugadores
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-4 overflow-y-auto sm:max-h-[80vh] max-h-[calc(100dvh-80px)]">
          {/* Chips selección y toggles */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] pb-1">
              {/* hide scrollbar in WebKit */}
              <style jsx>{`
                div::-webkit-scrollbar { display: none; }
              `}</style>
              {selectedPlayers.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm whitespace-nowrap bg-background/60 backdrop-blur-sm shadow-sm hover:bg-background transition-colors">
                  {p.name}
                  {onRemoveSelected && (
                    <button aria-label="Quitar" className="rounded-full hover:bg-muted p-1 transition-colors" onClick={() => onRemoveSelected?.(p.id)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
              <button onClick={() => setView("resumen")} className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${view === "resumen" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 text-muted-foreground"}`}>
                <LayoutGrid className="h-4 w-4" /> Resumen
              </button>
              <button onClick={() => setView("tabla")} className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${view === "tabla" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 text-muted-foreground"}`}>
                <TableIcon className="h-4 w-4" /> Tabla
              </button>
            </div>
          </div>

          {/* Resumen (cards compactas) */}
          {view === "resumen" && (
            <div className={`${gridClass} gap-6 items-stretch`}>
              {selectedPlayers.map((p) => (
                <Card key={p.id} className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--accent))]/10 to-transparent border-[hsl(var(--accent))]/30 h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-[hsl(var(--accent))]/15" />
                  <CardHeader className="pb-3 px-5 pt-4">
                    <CardTitle className="flex items-center justify-between text-base font-bold">
                      <span className="truncate mr-2">{p.name}</span>
                      <div className="p-2.5 rounded-xl bg-[hsl(var(--accent))]/20">
                        <Users className="h-5 w-5 text-[hsl(var(--accent))]" />
                      </div>
                    </CardTitle>
                    <CardDescription className="truncate text-sm">{p.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm px-5 pb-5">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground flex items-center gap-2 font-medium"><Shield className="h-4 w-4" /> Posición</span>
                      <span className="font-medium">{p.playerProfile?.position || "—"}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground flex items-center gap-2 font-medium"><Badge variant="outline" className="text-[10px]">#</Badge> N°</span>
                      <span className="font-medium">{p.playerProfile?.preferredNumber ?? "—"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-muted-foreground flex items-center justify-center gap-1 mb-1"><Ruler className="h-4 w-4" /></div>
                        <div className="text-xs text-muted-foreground">Altura</div>
                        <div className="font-semibold">{p.playerProfile?.heightCm ? `${p.playerProfile.heightCm} cm` : "—"}</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-muted-foreground flex items-center justify-center gap-1 mb-1"><Scale className="h-4 w-4" /></div>
                        <div className="text-xs text-muted-foreground">Peso</div>
                        <div className="font-semibold">{p.playerProfile?.weightKg ? `${p.playerProfile.weightKg} kg` : "—"}</div>
                      </div>
                    </div>
                    {metrics[p.id] && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2 font-medium"><BarChart3 className="h-4 w-4" /> Métricas</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg border bg-background/50 p-2.5 text-center"><div className="text-muted-foreground mb-1">Goles</div><div className="font-bold text-lg">{metrics[p.id].goals ?? "—"}</div></div>
                          <div className="rounded-lg border bg-background/50 p-2.5 text-center"><div className="text-muted-foreground mb-1">Asist.</div><div className="font-bold text-lg">{metrics[p.id].assists ?? "—"}</div></div>
                          <div className="rounded-lg border bg-background/50 p-2.5 text-center"><div className="text-muted-foreground mb-1">Part.</div><div className="font-bold text-lg">{metrics[p.id].matches ?? "—"}</div></div>
                          <div className="rounded-lg border bg-background/50 p-2.5 text-center"><div className="text-muted-foreground mb-1">Rating</div><div className="font-bold text-lg">{metrics[p.id].rating ?? "—"}</div></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tabla */}
          {view === "tabla" && selectedPlayers.length > 0 && (
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
                      {/* Métricas si están disponibles */}
                      <TableRow>
                        <TableCell className="text-muted-foreground">Goles</TableCell>
                        {selectedPlayers.map(p => (<TableCell key={p.id}>{metrics[p.id]?.goals ?? "—"}</TableCell>))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">Asistencias</TableCell>
                        {selectedPlayers.map(p => (<TableCell key={p.id}>{metrics[p.id]?.assists ?? "—"}</TableCell>))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">Partidos</TableCell>
                        {selectedPlayers.map(p => (<TableCell key={p.id}>{metrics[p.id]?.matches ?? "—"}</TableCell>))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">Rating</TableCell>
                        {selectedPlayers.map(p => (<TableCell key={p.id}>{metrics[p.id]?.rating ?? "—"}</TableCell>))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">Minutos</TableCell>
                        {selectedPlayers.map(p => (<TableCell key={p.id}>{metrics[p.id]?.minutes ?? "—"}</TableCell>))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="flex items-center justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
