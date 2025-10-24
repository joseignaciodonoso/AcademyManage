"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

type TrainingSchedule = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string
  type?: string
  category?: string
  isActive: boolean
}

const weekdayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
}

export default function ClubTrainingPage() {
  const [loading, setLoading] = useState(false)
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([])
  const [instances, setInstances] = useState<any[]>([])
  const [instancesLoading, setInstancesLoading] = useState(true)
  const [summaries, setSummaries] = useState<Record<string, { confirmed: number; pending: number; declined: number; attended: number }>>({})

  const [filter, setFilter] = useState<{ weekday: number | "ALL"; active: "ALL" | "true" | "false" }>({
    weekday: "ALL",
    active: "ALL",
  })

  // Attendance modal state
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendance, setAttendance] = useState<any[]>([])

  async function openAttendance(instanceId: string) {
    try {
      setAttendanceOpen(true)
      setAttendanceLoading(true)
      const res = await fetch(`/api/club/training-instances/${instanceId}/attendance`)
      const data = await res.json().catch(() => ({}))
      setAttendance(Array.isArray(data.attendance) ? data.attendance : [])
    } finally {
      setAttendanceLoading(false)
    }
  }

  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: "18:00",
    endTime: "20:00",
    location: "Gimnasio Principal",
    type: "TECHNICAL",
    category: "",
    isActive: true,
  })

  const [createOpen, setCreateOpen] = useState(false)
  const openCreate = () => setCreateOpen(true)

  async function loadSchedules() {
    try {
      setLoading(true)
      const res = await fetch("/api/club/training-schedules")
      if (!res.ok) throw new Error("Error")
      const data = await res.json()
      setSchedules(Array.isArray(data.schedules) ? data.schedules : [])
    } catch (error) {
      toast.error("Error al cargar horarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSchedules() }, [])

  // Helpers to get current week range (Mon-Sun)
  const getWeekRange = () => {
    const now = new Date()
    const day = now.getDay() // 0=Sun..6=Sat
    const diffToMonday = (day + 6) % 7 // 0 for Mon, 6 for Sun
    const monday = new Date(now)
    monday.setHours(0,0,0,0)
    monday.setDate(now.getDate() - diffToMonday)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23,59,59,999)
    return { from: monday, to: sunday }
  };

  // Load training instances for current week and summaries
  useEffect(() => {
    async function loadWeekInstances() {
      try {
        setInstancesLoading(true)
        const { from, to } = getWeekRange()
        const fromStr = from.toISOString().split('T')[0]
        const toStr = to.toISOString().split('T')[0]
        const res = await fetch(`/api/club/training-instances?from=${fromStr}&to=${toStr}`)
        const data = await res.json().catch(() => ({}))
        const list = Array.isArray(data.instances) ? data.instances : []
        list.sort((a:any,b:any)=> new Date(a.date).getTime() - new Date(b.date).getTime())
        setInstances(list)

        // Fetch attendance summaries per instance (quick counts)
        const entries = await Promise.all(list.map(async (inst:any) => {
          try {
            const r = await fetch(`/api/club/training-instances/${inst.id}/attendance`)
            const d = await r.json().catch(()=>({}))
            const arr = Array.isArray(d.attendance) ? d.attendance : []
            const s = {
              confirmed: arr.filter((x:any)=> x.status === 'CONFIRMED').length,
              pending: arr.filter((x:any)=> x.status === 'PENDING').length,
              declined: arr.filter((x:any)=> x.status === 'DECLINED').length,
              attended: arr.filter((x:any)=> x.status === 'ATTENDED').length,
            }
            return [inst.id, s] as const
          } catch {
            return [inst.id, { confirmed: 0, pending: 0, declined: 0, attended: 0 }] as const
          }
        }))
        setSummaries(Object.fromEntries(entries))
      } finally {
        setInstancesLoading(false)
      }
    }
    loadWeekInstances()
  }, [])

  async function createSchedule() {
    try {
      setLoading(true)
      const payload = {
        ...form,
        startDate: new Date().toISOString(),
      }
      const res = await fetch("/api/club/training-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        toast.error(e.error || "No se pudo crear el horario")
        return
      }
      toast.success("Horario creado exitosamente")
      setForm((f) => ({ ...f, location: "Gimnasio Principal" }))
      await loadSchedules()
      setCreateOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(s: TrainingSchedule) {
    const res = await fetch(`/api/club/training-schedules/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive })
    })
    if (res.ok) {
      setSchedules((arr) => arr.map((x) => (x.id === s.id ? { ...x, isActive: !s.isActive } : x)))
      toast.success("Horario actualizado")
    }
  }

  async function removeSchedule(s: TrainingSchedule) {
    if (!confirm("¿Eliminar horario?")) return
    const res = await fetch(`/api/club/training-schedules/${s.id}`, { method: "DELETE" })
    if (res.ok) {
      setSchedules((arr) => arr.filter((x) => x.id !== s.id))
      toast.success("Horario eliminado")
    }
  }

  const grouped = useMemo(() => {
    const m: Record<number, TrainingSchedule[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    for (const s of schedules) {
      if (filter.weekday !== "ALL" && s.dayOfWeek !== filter.weekday) continue
      if (filter.active !== "ALL" && String(s.isActive) !== filter.active) continue
      m[s.dayOfWeek].push(s)
    }
    for (const k of Object.keys(m)) {
      m[Number(k)].sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return m
  }, [schedules, filter])

  const weekOrder = [1, 2, 3, 4, 5, 6, 0] // Lunes a Domingo

  const [startHour, setStartHour] = useState(6)
  const [endHour, setEndHour] = useState(23)
  const BASE_HOUR_HEIGHT = 52
  const totalHours = Math.max(1, endHour - startHour)
  const baseTimelineHeight = totalHours * BASE_HOUR_HEIGHT
  const [viewportH, setViewportH] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800)
  
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  
  const reserved = 280
  const maxCardHeight = Math.max(360, Math.min(viewportH - reserved, 820))
  const containerHeight = Math.min(baseTimelineHeight, maxCardHeight)
  const hourHeight = containerHeight / totalHours

  useEffect(() => {
    try {
      const raw = localStorage.getItem("clubTrainingRange")
      if (!raw) return
      const parsed = JSON.parse(raw) as { startHour?: number; endHour?: number }
      if (typeof parsed.startHour === "number" && typeof parsed.endHour === "number") {
        const s = Math.min(Math.max(0, parsed.startHour), 23)
        const e = Math.min(Math.max(1, parsed.endHour), 24)
        if (s < e) {
          setStartHour(s)
          setEndHour(e)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("clubTrainingRange", JSON.stringify({ startHour, endHour }))
    } catch {}
  }, [startHour, endHour])

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + (m || 0)
  }

  const getBlockStyle = (startTime: string, endTime: string) => {
    const startMin = timeToMinutes(startTime)
    const endMin = timeToMinutes(endTime)
    const clampedStart = Math.max(startHour * 60, startMin)
    const clampedEnd = Math.max(clampedStart + 30, Math.min(endHour * 60, endMin))
    const top = ((clampedStart - startHour * 60) / 60) * hourHeight
    const height = ((clampedEnd - clampedStart) / 60) * hourHeight
    return { top, height }
  }

  const layoutDay = (list: TrainingSchedule[]) => {
    type Item = { s: TrainingSchedule; start: number; end: number; top: number; height: number; col: number }
    const items: Item[] = list
      .map((s) => {
        const start = timeToMinutes(s.startTime)
        const end = timeToMinutes(s.endTime)
        const { top, height } = getBlockStyle(s.startTime, s.endTime)
        return { s, start, end, top, height, col: 0 }
      })
      .sort((a, b) => a.start - b.start)

    const result: Array<{ item: Item; colCount: number }> = []
    let i = 0
    while (i < items.length) {
      const cluster: Item[] = []
      let clusterEnd = -1
      let j = i
      while (j < items.length && (cluster.length === 0 || items[j].start < clusterEnd)) {
        cluster.push(items[j])
        clusterEnd = Math.max(clusterEnd, items[j].end)
        j++
      }

      const colsEnd: number[] = []
      for (const ev of cluster) {
        let assigned = -1
        for (let c = 0; c < colsEnd.length; c++) {
          if (ev.start >= colsEnd[c]) { assigned = c; break }
        }
        if (assigned === -1) { assigned = colsEnd.length; colsEnd.push(ev.end) } else { colsEnd[assigned] = ev.end }
        ev.col = assigned
      }
      const colCount = colsEnd.length
      for (const ev of cluster) result.push({ item: ev, colCount })
      i = j
    }
    return result
  }

  const [nowTop, setNowTop] = useState<number | null>(null)
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const minutes = now.getHours() * 60 + now.getMinutes()
      const startMinutes = startHour * 60
      const endMinutes = endHour * 60
      if (minutes >= startMinutes && minutes <= endMinutes) {
        const t = ((minutes - startMinutes) / 60) * hourHeight
        setNowTop(t)
      } else {
        setNowTop(null)
      }
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [startHour, endHour, hourHeight])

  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState({
    id: "",
    dayOfWeek: 1,
    startTime: "18:00",
    endTime: "20:00",
    location: "",
    type: "",
    category: "",
    isActive: true,
  })

  const openEditor = (s: TrainingSchedule) => {
    setEdit({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      type: s.type || "",
      category: s.category || "",
      isActive: s.isActive,
    })
    setOpen(true)
  }

  async function saveEdit() {
    try {
      setLoading(true)
      const res = await fetch(`/api/club/training-schedules/${edit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: edit.dayOfWeek,
          startTime: edit.startTime,
          endTime: edit.endTime,
          location: edit.location,
          type: edit.type || undefined,
          category: edit.category || undefined,
          isActive: edit.isActive,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        toast.error(e.error || "No se pudo actualizar el horario")
        return
      }
      setOpen(false)
      toast.success("Horario actualizado")
      await loadSchedules()
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Horarios de Entrenamientos</h1>
            <p className="text-foreground/70">Define bloques horarios semanales para entrenamientos recurrentes</p>
          </div>
          <Button onClick={openCreate} disabled={loading}>Crear Horario</Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vista Semanal</CardTitle>
              <CardDescription className="text-sm">Horarios recurrentes por día de la semana</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <select
                value={filter.weekday}
                onChange={(e) => setFilter((f) => ({ ...f, weekday: e.target.value === "ALL" ? "ALL" : Number(e.target.value) }))}
                className="border rounded px-2 py-1 bg-background"
              >
                <option value="ALL">Todos los días</option>
                {Object.entries(weekdayLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={filter.active}
                onChange={(e) => setFilter((f) => ({ ...f, active: e.target.value as any }))}
                className="border rounded px-2 py-1 bg-background"
              >
                <option value="ALL">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>

              <div className="ml-auto flex items-center gap-2 text-xs">
                <span className="text-foreground/60">Rango</span>
                <select
                  value={startHour}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setStartHour(Math.min(v, endHour - 1))
                  }}
                  className="border rounded px-2 py-1 bg-background"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                  ))}
                </select>
                <span>-</span>
                <select
                  value={endHour}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setEndHour(Math.max(v, startHour + 1))
                  }}
                  className="border rounded px-2 py-1 bg-background"
                >
                  {Array.from({ length: 25 }).map((_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-sm text-foreground/60">Cargando…</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[1080px] grid grid-cols-[72px_repeat(7,minmax(200px,1fr))] gap-4" style={{ height: `${containerHeight}px` }}>
                  <div className="relative h-full pr-2">
                    {Array.from({ length: totalHours + 1 }).map((_, i) => {
                      const hour = startHour + i
                      const top = i * hourHeight
                      return (
                        <div key={hour} className="absolute left-0 right-0" style={{ top }}>
                          <div className="text-[10px] text-foreground/60 select-none tabular-nums">{hour.toString().padStart(2, "0")}:00</div>
                          <div className="h-px w-full bg-border" />
                        </div>
                      )
                    })}
                  </div>

                  {weekOrder.map((wd) => (
                    <div key={wd} className="relative h-full rounded-lg border border-border bg-muted/20">
                      <div className="absolute -top-7 left-0">
                        <Badge variant="outline" className="font-semibold">{weekdayLabels[wd]}</Badge>
                      </div>

                      {Array.from({ length: totalHours + 1 }).map((_, i) => (
                        <div key={i} className="absolute left-0 right-0 h-px bg-border" style={{ top: i * hourHeight }} />
                      ))}

                      {nowTop !== null && (
                        <div className="absolute left-0 right-0 h-[2px] bg-red-500/80" style={{ top: nowTop }} />
                      )}

                      {grouped[wd].length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-xs text-foreground/40">—</div>
                        </div>
                      ) : (
                        layoutDay(grouped[wd]).map(({ item, colCount }) => {
                          const gap = 6
                          const colWidth = 100 / colCount
                          const leftPct = colWidth * item.col
                          return (
                            <div
                              key={item.s.id}
                              className="absolute rounded-lg border border-primary/20 bg-primary/10 backdrop-blur-sm shadow-sm cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
                              style={{
                                top: item.top,
                                height: item.height,
                                left: `calc(${leftPct}% + ${gap/2}px)`,
                                width: `calc(${colWidth}% - ${gap}px)`,
                              }}
                              onClick={() => openEditor(item.s)}
                            >
                              <div className="px-2 py-2 h-full flex flex-col justify-start">
                                <div className="font-semibold leading-tight text-xs line-clamp-2">
                                  {item.s.type || "Entrenamiento"}
                                </div>
                                <div className="text-[10px] text-foreground/60 mt-1">
                                  {item.s.location}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos entrenamientos (semana actual) a la derecha */}
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Próximos entrenamientos</CardTitle>
            <CardDescription>Semana actual · Confirmados rápidos</CardDescription>
          </CardHeader>
          <CardContent>
            {instancesLoading ? (
              <div className="text-sm text-foreground/60">Cargando…</div>
            ) : instances.length === 0 ? (
              <div className="text-sm text-foreground/60">No hay entrenamientos esta semana</div>
            ) : (
              <div className="space-y-3">
                {instances.map((inst) => {
                  const s = summaries[inst.id] || { confirmed: 0, pending: 0, declined: 0, attended: 0 }
                  return (
                    <div key={inst.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(inst.date).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'short' })}
                          {` · ${inst.startTime}`}
                        </div>
                        <div className="text-foreground/60">{inst.location}</div>
                        <div className="text-foreground/60 mt-1 text-xs">
                          <span className="mr-2">✅ {s.confirmed + s.attended}</span>
                          <span className="mr-2">⏳ {s.pending}</span>
                          <span>❌ {s.declined}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openAttendance(inst.id)}>
                          Ver asistentes
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Editor Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Horario</DialogTitle>
            <DialogDescription>Modifica la información y guarda los cambios</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Tipo</label>
                <select value={edit.type} onChange={(e) => setEdit((x) => ({ ...x, type: e.target.value }))} className="border rounded px-2 py-1 w-full bg-background">
                  <option value="TECHNICAL">Técnico</option>
                  <option value="PHYSICAL">Físico</option>
                  <option value="TACTICAL">Táctico</option>
                  <option value="GAME">Juego</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs">Categoría</label>
                <Input value={edit.category} onChange={(e) => setEdit((x) => ({ ...x, category: e.target.value }))} placeholder="Sub-15, Senior, etc" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs">Ubicación</label>
              <Input value={edit.location} onChange={(e) => setEdit((x) => ({ ...x, location: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Día</label>
                <select value={edit.dayOfWeek} onChange={(e) => setEdit((x) => ({ ...x, dayOfWeek: Number(e.target.value) }))} className="border rounded px-2 py-1 w-full bg-background">
                  {Object.entries(weekdayLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs">Inicio</label>
                <Input type="time" value={edit.startTime} onChange={(e) => setEdit((x) => ({ ...x, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Término</label>
                <Input type="time" value={edit.endTime} onChange={(e) => setEdit((x) => ({ ...x, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">Activo</label>
              <Switch checked={edit.isActive} onCheckedChange={(v) => setEdit((x) => ({ ...x, isActive: v }))} />
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={async () => { const s = schedules.find((x) => x.id === edit.id); if (s) { await removeSchedule(s); setOpen(false) } }}>Eliminar</Button>
              <Button onClick={saveEdit} disabled={loading || !edit.location.trim() || !edit.startTime || !edit.endTime}>Guardar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Horario de Entrenamiento</DialogTitle>
            <DialogDescription>Define un nuevo bloque horario semanal recurrente</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Tipo</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="border rounded px-2 py-1 bg-background w-full">
                  <option value="TECHNICAL">Técnico</option>
                  <option value="PHYSICAL">Físico</option>
                  <option value="TACTICAL">Táctico</option>
                  <option value="GAME">Juego</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs">Día</label>
                <select value={form.dayOfWeek} onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))} className="border rounded px-2 py-1 bg-background w-full">
                  {Object.entries(weekdayLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs">Ubicación</label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Categoría (opcional)</label>
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Sub-15, Senior, etc" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Inicio</label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Término</label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">Activo</label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              onClick={createSchedule}
              disabled={loading || !form.location.trim() || !form.startTime || !form.endTime}
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Modal */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Asistentes confirmados</DialogTitle>
            <DialogDescription>Listado de confirmados, pendientes y declinados</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {attendanceLoading ? (
              <div className="text-sm text-foreground/60">Cargando…</div>
            ) : attendance.length === 0 ? (
              <div className="text-sm text-foreground/60">Aún no hay respuestas</div>
            ) : (
              <>
                <div className="text-sm font-medium">Confirmados</div>
                <ul className="space-y-1">
                  {attendance.filter((a:any) => a.status === 'CONFIRMED' || a.status === 'ATTENDED').map((a:any) => (
                    <li key={a.id} className="text-sm">{a.player?.name || a.player?.email} {a.status === 'ATTENDED' ? '(asistió)' : ''}</li>
                  ))}
                </ul>
                <div className="text-sm font-medium mt-3">Pendientes</div>
                <ul className="space-y-1">
                  {attendance.filter((a:any) => a.status === 'PENDING').map((a:any) => (
                    <li key={a.id} className="text-sm">{a.player?.name || a.player?.email}</li>
                  ))}
                </ul>
                <div className="text-sm font-medium mt-3">Declinados</div>
                <ul className="space-y-1">
                  {attendance.filter((a:any) => a.status === 'DECLINED').map((a:any) => (
                    <li key={a.id} className="text-sm">{a.player?.name || a.player?.email}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
