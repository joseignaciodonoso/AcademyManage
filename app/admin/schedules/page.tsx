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

type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"

type Coach = { id: string; name?: string | null; email?: string | null }

type Schedule = {
  id: string
  title: string
  description?: string | null
  discipline: string
  level: string
  weekday: Weekday
  startTimeLocal: string
  endTimeLocal: string
  timezone: string
  active: boolean
  startDate?: string | null
  endDate?: string | null
  coach?: Coach | null
}

const weekdayLabels: Record<Weekday, string> = {
  MON: "Lunes",
  TUE: "Martes",
  WED: "Miércoles",
  THU: "Jueves",
  FRI: "Viernes",
  SAT: "Sábado",
  SUN: "Domingo",
}

export default function AdminSchedulesPage() {
  const [loading, setLoading] = useState(false)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])

  const [filter, setFilter] = useState<{ weekday: Weekday | "ALL"; coachId: string | "ALL"; active: "ALL" | "true" | "false" }>({
    weekday: "ALL",
    coachId: "ALL",
    active: "ALL",
  })

  const [form, setForm] = useState({
    coachId: "",
    title: "Clase regular",
    description: "",
    discipline: "General",
    level: "Intermedio",
    weekday: "MON" as Weekday,
    startTimeLocal: "18:00",
    endTimeLocal: "19:00",
    timezone: "America/Santiago",
    active: true,
  })

  // Modal de creación
  const [createOpen, setCreateOpen] = useState(false)
  const openCreate = () => {
    setCreateOpen(true)
  }

  async function loadCoaches() {
    try {
      const res = await fetch("/api/admin/coaches")
      if (!res.ok) return
      const data = await res.json().catch(() => ({}))
      const list = Array.isArray(data.coaches) ? data.coaches : []
      setCoaches(list)
      // Auto-selección del primer instructor para evitar botón deshabilitado
      if (!form.coachId && list.length > 0) {
        setForm((f) => ({ ...f, coachId: list[0].id }))
      }
    } catch {}
  }

  async function loadSchedules() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.weekday !== "ALL") params.set("weekday", filter.weekday)
      if (filter.coachId !== "ALL") params.set("coachId", filter.coachId)
      if (filter.active !== "ALL") params.set("active", filter.active)
      const res = await fetch(`/api/admin/schedules?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      setSchedules(Array.isArray(data.schedules) ? data.schedules : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCoaches() }, [])
  useEffect(() => { loadSchedules() }, [filter.weekday, filter.coachId, filter.active])

  async function createSchedule() {
    try {
      setLoading(true)
      const payload = {
        ...form,
        description: form.description || undefined,
      }
      const res = await fetch("/api/admin/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        alert(e.error || "No se pudo crear el horario")
        return
      }
      setForm((f) => ({ ...f, title: "Clase regular" }))
      await loadSchedules()
      setCreateOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(s: Schedule) {
    const res = await fetch(`/api/admin/schedules/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !s.active }) })
    if (res.ok) {
      setSchedules((arr) => arr.map((x) => (x.id === s.id ? { ...x, active: !s.active } : x)))
    }
  }

  async function removeSchedule(s: Schedule) {
    if (!confirm("¿Eliminar horario?")) return
    const res = await fetch(`/api/admin/schedules/${s.id}`, { method: "DELETE" })
    if (res.ok) setSchedules((arr) => arr.filter((x) => x.id !== s.id))
  }

  async function ensureCurrentMonth() {
    try {
      setLoading(true)
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      await fetch("/api/admin/schedules/ensure-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: start.toISOString(), endDate: end.toISOString() })
      })
      alert("Clases generadas para el mes actual")
    } finally {
      setLoading(false)
    }
  }

  const grouped = useMemo(() => {
    const m: Record<Weekday, Schedule[]> = { MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [], SUN: [] }
    for (const s of schedules) m[s.weekday as Weekday].push(s)
    for (const k of Object.keys(m) as Weekday[]) m[k].sort((a, b) => a.startTimeLocal.localeCompare(b.startTimeLocal))
    return m
  }, [schedules])

  // Orden fijo Lunes-Domingo para renderizar columnas
  const weekOrder: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

  // Timetable config (6:00 a 23:00)
  const [startHour, setStartHour] = useState(6)
  const [endHour, setEndHour] = useState(23)
  const BASE_HOUR_HEIGHT = 52 // referencia
  const totalHours = Math.max(1, endHour - startHour)
  const baseTimelineHeight = totalHours * BASE_HOUR_HEIGHT
  // Altura disponible según viewport para evitar exceso de margen inferior
  const [viewportH, setViewportH] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800)
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // margen estimado que ocupa encabezados, filtros y paddings
  const reserved = 280
  const maxCardHeight = Math.max(360, Math.min(viewportH - reserved, 820))
  const containerHeight = Math.min(baseTimelineHeight, maxCardHeight)
  const hourHeight = containerHeight / totalHours

  // Persistencia del rango horario en localStorage (después de inicializar startHour/endHour)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("adminSchedulesRange")
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
      localStorage.setItem("adminSchedulesRange", JSON.stringify({ startHour, endHour }))
    } catch {}
  }, [startHour, endHour])

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + (m || 0)
  }

  const getBlockStyle = (startTimeLocal: string, endTimeLocal: string) => {
    const startMin = timeToMinutes(startTimeLocal)
    const endMin = timeToMinutes(endTimeLocal)
    const clampedStart = Math.max(startHour * 60, startMin)
    const clampedEnd = Math.max(clampedStart + 30, Math.min(endHour * 60, endMin)) // mínimo 30min
    const top = ((clampedStart - startHour * 60) / 60) * hourHeight
    const height = ((clampedEnd - clampedStart) / 60) * hourHeight
    return { top, height }
  }

  // Layout por día para manejar solapes (asigna columnas para eventos que se cruzan)
  const layoutDay = (list: Schedule[]) => {
    type Item = { s: Schedule; start: number; end: number; top: number; height: number; col: number }
    const items: Item[] = list
      .map((s) => {
        const start = timeToMinutes(s.startTimeLocal)
        const end = timeToMinutes(s.endTimeLocal)
        const { top, height } = getBlockStyle(s.startTimeLocal, s.endTimeLocal)
        return { s, start, end, top, height, col: 0 }
      })
      .sort((a, b) => a.start - b.start)

    const result: Array<{ item: Item; colCount: number }> = []
    let i = 0
    while (i < items.length) {
      // Construir cluster de solapados
      const cluster: Item[] = []
      let clusterEnd = -1
      let j = i
      while (j < items.length && (cluster.length === 0 || items[j].start < clusterEnd)) {
        cluster.push(items[j])
        clusterEnd = Math.max(clusterEnd, items[j].end)
        j++
      }

      // Asignar columnas dentro del cluster
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

  // Indicador de hora actual
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

  // Editor modal
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState({
    id: "",
    title: "",
    discipline: "",
    level: "",
    weekday: "MON" as Weekday,
    startTimeLocal: "18:00",
    endTimeLocal: "19:00",
    coachId: "",
    active: true,
  })

  const openEditor = (s: Schedule) => {
    setEdit({
      id: s.id,
      title: s.title,
      discipline: s.discipline,
      level: s.level,
      weekday: s.weekday,
      startTimeLocal: s.startTimeLocal,
      endTimeLocal: s.endTimeLocal,
      coachId: s.coach?.id || "",
      active: s.active,
    })
    setOpen(true)
  }

  async function saveEdit() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/schedules/${edit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: edit.title,
          discipline: edit.discipline,
          level: edit.level,
          weekday: edit.weekday,
          startTimeLocal: edit.startTimeLocal,
          endTimeLocal: edit.endTimeLocal,
          coachId: edit.coachId || null,
          active: edit.active,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        alert(e.error || "No se pudo actualizar el horario")
        return
      }
      setOpen(false)
      await loadSchedules()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-[hsl(var(--primary))] rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-[hsl(var(--accent))] rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Horarios regulares</h1>
            <p className="text-gray-400">Define bloques horarios para generar clases y gestionar asistencia.</p>
          </div>
          <Button onClick={openCreate} variant="default" disabled={loading} className="font-semibold">Crear nuevo evento</Button>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {/* Listado */}
          <Card className="glass-effect rounded-2xl border-gray-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Listado</CardTitle>
              <CardDescription className="text-sm">Filtra por día, instructor y estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <select value={filter.weekday} onChange={(e) => setFilter((f) => ({ ...f, weekday: e.target.value as any }))} className="border rounded px-2 py-1 bg-transparent">
                  <option value="ALL">Todos los días</option>
                  {Object.entries(weekdayLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
                <select value={filter.coachId} onChange={(e) => setFilter((f) => ({ ...f, coachId: e.target.value }))} className="border rounded px-2 py-1 bg-transparent">
                  <option value="ALL">Todos los instructores</option>
                  {coaches.map((c) => (<option key={c.id} value={c.id}>{c.name || c.email}</option>))}
                </select>
                <select value={filter.active} onChange={(e) => setFilter((f) => ({ ...f, active: e.target.value as any }))} className="border rounded px-2 py-1 bg-transparent">
                  <option value="ALL">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>

                {/* Controles de rango horario */}
                <div className="ml-auto flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Rango</span>
                  <select
                    value={startHour}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setStartHour(Math.min(v, endHour - 1))
                    }}
                    className="border rounded px-2 py-1 bg-transparent"
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
                    className="border rounded px-2 py-1 bg-transparent"
                  >
                    {Array.from({ length: 25 }).map((_, h) => (
                      <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-sm text-muted-foreground">Cargando…</div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[1080px] grid grid-cols-[72px_repeat(7,minmax(200px,1fr))] gap-4" style={{ height: `${containerHeight}px` }}>
                    {/* Columna de horas */}
                    <div className="relative h-full pr-2">
                      {Array.from({ length: totalHours + 1 }).map((_, i) => {
                        const hour = startHour + i
                        const top = i * hourHeight
                        return (
                          <div key={hour} className="absolute left-0 right-0" style={{ top }}>
                            <div className="text-[10px] text-muted-foreground select-none tabular-nums">{hour.toString().padStart(2, "0")}:00</div>
                            <div className="h-px w-full bg-white/10" />
                          </div>
                        )
                      })}
                    </div>

                    {/* Columnas de días */}
                    {weekOrder.map((wd) => (
                      <div key={wd} className="relative h-full rounded-lg border border-gray-700/40 bg-white/5 backdrop-blur">
                        {/* Encabezado día */}
                        <div className="absolute -top-7 left-0">
                          <Badge variant="outline" className="font-semibold">{weekdayLabels[wd]}</Badge>
                        </div>

                        {/* Líneas de hora */
                        }
                        {Array.from({ length: totalHours + 1 }).map((_, i) => (
                          <div key={i} className="absolute left-0 right-0 h-px bg-white/10" style={{ top: i * hourHeight }} />
                        ))}

                        {/* Línea de hora actual */}
                        {nowTop !== null && (
                          <div className="absolute left-0 right-0 h-[2px] bg-red-500/80" style={{ top: nowTop }} />
                        )}

                        {/* Bloques */}
                        {grouped[wd].length === 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-xs text-muted-foreground">—</div>
                          </div>
                        ) : (
                          layoutDay(grouped[wd]).map(({ item, colCount }) => {
                            const gap = 6 // px gap entre columnas
                            const colWidth = 100 / colCount
                            const leftPct = colWidth * item.col
                            return (
                              <div
                                key={item.s.id}
                                className="absolute rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm shadow-sm cursor-pointer hover:shadow-md hover:border-white/20 transition-all"
                                style={{
                                  top: item.top,
                                  height: item.height,
                                  left: `calc(${leftPct}% + ${gap/2}px)`,
                                  width: `calc(${colWidth}% - ${gap}px)`,
                                }}
                                onClick={() => openEditor(item.s)}
                              >
                                <div className="px-2 py-2 h-full flex items-start">
                                  <div className="font-semibold leading-tight text-sm line-clamp-2">
                                    {item.s.title}
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
        </div>
      </div>

      {/* Editor Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar horario</DialogTitle>
            <DialogDescription>Modifica la información y guarda los cambios.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Título</label>
                <Input value={edit.title} onChange={(e) => setEdit((x) => ({ ...x, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Instructor</label>
                <select value={edit.coachId} onChange={(e) => setEdit((x) => ({ ...x, coachId: e.target.value }))} className="border rounded px-2 py-1 w-full bg-transparent">
                  <option value="">Sin asignar</option>
                  {coaches.map((c) => (<option key={c.id} value={c.id}>{c.name || c.email}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Disciplina</label>
                <Input value={edit.discipline} onChange={(e) => setEdit((x) => ({ ...x, discipline: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Nivel</label>
                <Input value={edit.level} onChange={(e) => setEdit((x) => ({ ...x, level: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Día</label>
                <select value={edit.weekday} onChange={(e) => setEdit((x) => ({ ...x, weekday: e.target.value as Weekday }))} className="border rounded px-2 py-1 w-full bg-transparent">
                  {Object.entries(weekdayLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs">Inicio</label>
                <Input type="time" value={edit.startTimeLocal} onChange={(e) => setEdit((x) => ({ ...x, startTimeLocal: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Término</label>
                <Input type="time" value={edit.endTimeLocal} onChange={(e) => setEdit((x) => ({ ...x, endTimeLocal: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">Activo</label>
              <Switch checked={edit.active} onCheckedChange={(v) => setEdit((x) => ({ ...x, active: v }))} />
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between">
            <Button variant="outline" onClick={() => { setOpen(false) }}>Cancelar</Button>
            <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={async () => { const s = schedules.find((x) => x.id === edit.id); if (s) { await removeSchedule(s); setOpen(false) } }}>Eliminar</Button>
              <Button onClick={saveEdit} disabled={loading || !edit.title.trim() || !edit.startTimeLocal || !edit.endTimeLocal}>Guardar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crear nuevo evento */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear nuevo evento</DialogTitle>
            <DialogDescription>Completa los campos para crear un nuevo bloque.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs">Instructor</label>
              <select value={form.coachId} onChange={(e) => setForm((f) => ({ ...f, coachId: e.target.value }))} className="border rounded px-2 py-1 bg-transparent w-full">
                <option value="">Selecciona instructor</option>
                {coaches.map((c) => (<option key={c.id} value={c.id}>{c.name || c.email}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Título</label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Día</label>
                <select value={form.weekday} onChange={(e) => setForm((f) => ({ ...f, weekday: e.target.value as Weekday }))} className="border rounded px-2 py-1 bg-transparent w-full">
                  {Object.entries(weekdayLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Disciplina</label>
                <Input value={form.discipline} onChange={(e) => setForm((f) => ({ ...f, discipline: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Nivel</label>
                <Input value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs">Inicio</label>
                <Input type="time" value={form.startTimeLocal} onChange={(e) => setForm((f) => ({ ...f, startTimeLocal: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Término</label>
                <Input type="time" value={form.endTimeLocal} onChange={(e) => setForm((f) => ({ ...f, endTimeLocal: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs">Activo</label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              onClick={createSchedule}
              disabled={
                loading ||
                !form.coachId ||
                !form.title.trim() ||
                !form.startTimeLocal ||
                !form.endTimeLocal
              }
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
