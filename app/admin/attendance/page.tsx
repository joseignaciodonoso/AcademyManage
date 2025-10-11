"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Search, Layers, Clock, CheckCircle2, CircleSlash } from "lucide-react"

type Schedule = {
  id: string
  branchId: string
  coachId: string
  title: string
  description?: string | null
  discipline: string
  level: string
  weekday: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"
  startTimeLocal: string
  endTimeLocal: string
  timezone: string
  active: boolean
  startDate?: string | null
  endDate?: string | null
}

const weekdayLabels: Record<Schedule["weekday"], string> = {
  MON: "Lunes",
  TUE: "Martes",
  WED: "Miércoles",
  THU: "Jueves",
  FRI: "Viernes",
  SAT: "Sábado",
  SUN: "Domingo",
}

export default function AdminAttendancePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    branchId: "",
    coachId: "",
    title: "Clase regular",
    description: "",
    discipline: "General",
    level: "Intermedio",
    weekday: "MON" as Schedule["weekday"],
    startTimeLocal: "18:00",
    endTimeLocal: "19:00",
    timezone: "America/Santiago",
    active: true,
    startDate: "",
    endDate: "",
  })

  // UI filters
  const [query, setQuery] = useState("")
  const [filterWeekday, setFilterWeekday] = useState<"ALL" | Schedule["weekday"]>("ALL")
  const [filterActive, setFilterActive] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")

  const monthRange = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }, [])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/class-schedules")
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.schedules)) setSchedules(data.schedules)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSchedules() }, [])

  // Load branches once
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch("/api/admin/branches")
        if (res.ok) {
          const data = await res.json()
          if (alive && Array.isArray(data.branches)) {
            setBranches(data.branches.map((b: any) => ({ id: b.id, name: b.name })))
          }
        }
      } catch {}
    })()
    return () => { alive = false }
  }, [])

  // Load coaches when branch changes
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!form.branchId) { setCoaches([]); return }
      try {
        const res = await fetch(`/api/admin/branches/${form.branchId}/coaches`)
        if (res.ok) {
          const data = await res.json()
          if (alive && Array.isArray(data.coaches)) {
            setCoaches(data.coaches.map((c: any) => ({ id: c.id, name: c.name })))
          }
        }
      } catch {}
    })()
    return () => { alive = false }
  }, [form.branchId])

  const createSchedule = async () => {
    setLoading(true)
    try {
      const payload = {
        ...form,
        description: form.description || undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      }
      const res = await fetch("/api/admin/class-schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (res.ok) {
        await loadSchedules()
      }
    } finally {
      setLoading(false)
    }
  }

  const ensureThisMonth = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate: monthRange.start.toISOString(), endDate: monthRange.end.toISOString() })
      await fetch(`/api/admin/class-schedules/ensure-classes?${params.toString()}`, { method: "POST" })
    } finally {
      setLoading(false)
    }
  }

  // Derived filtered schedules
  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      const matchesQuery = query.trim()
        ? [s.title, s.discipline, s.level].join(" ").toLowerCase().includes(query.toLowerCase())
        : true
      const matchesWeekday = filterWeekday === "ALL" ? true : s.weekday === filterWeekday
      const matchesActive =
        filterActive === "ALL" ? true : filterActive === "ACTIVE" ? s.active : !s.active
      return matchesQuery && matchesWeekday && matchesActive
    })
  }, [schedules, query, filterWeekday, filterActive])

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="max-w-7xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-7 w-7 text-[hsl(var(--accent))]" />
          Asistencia · Horarios regulares
        </h1>
        <p className="text-[hsl(var(--foreground))]/70">Define los días y horas en que hay clases regulares y genera las clases del mes.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" /> Horarios definidos
            </CardTitle>
            <CardDescription className="text-[hsl(var(--foreground))]/70">Listado de horarios regulares activos en tu academia.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, disciplina o nivel"
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={filterWeekday} onValueChange={(v) => setFilterWeekday(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Día" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los días</SelectItem>
                  {Object.entries(weekdayLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterActive} onValueChange={(v) => setFilterActive(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="INACTIVE">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center rounded-xl border border-white/10 bg-white/5 p-3 animate-pulse">
                    <div className="col-span-2 space-y-2">
                      <div className="h-4 w-40 bg-[hsl(var(--muted))] rounded" />
                      <div className="h-3 w-24 bg-[hsl(var(--muted))] rounded" />
                    </div>
                    <div className="h-4 w-44 bg-[hsl(var(--muted))] rounded" />
                    <div className="h-3 w-16 bg-[hsl(var(--muted))] rounded" />
                    <div />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-white/10 bg-white/5 backdrop-blur-md rounded-xl">
                <div className="mb-3 flex items-center gap-2 text-sm text-[hsl(var(--foreground))]/70">
                  <Calendar className="h-4 w-4" />
                  Sin horarios que coincidan con los filtros
                </div>
                <p className="text-xs text-[hsl(var(--foreground))]/60">Ajusta los filtros o crea un nuevo horario a la derecha.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => (
                  <div key={s.id} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center rounded-xl border border-white/10 p-3 bg-white/5 backdrop-blur-md">
                    <div className="col-span-2">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {s.title}
                        <Badge variant={s.active ? "default" : "secondary"} className={s.active ? "" : "opacity-70"}>
                          {s.active ? (
                            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Activo</span>
                          ) : (
                            <span className="flex items-center gap-1"><CircleSlash className="h-3 w-3" /> Inactivo</span>
                          )}
                        </Badge>
                      </div>
                      <div className="text-xs text-[hsl(var(--foreground))]/70">{s.discipline} · {s.level}</div>
                    </div>
                    <div className="text-sm flex items-center gap-2 text-[hsl(var(--foreground))]">
                      <Badge variant="outline">{weekdayLabels[s.weekday]}</Badge>
                      <div className="flex items-center gap-1 text-[hsl(var(--foreground))]/70">
                        <Clock className="h-3.5 w-3.5" /> {s.startTimeLocal} – {s.endTimeLocal}
                      </div>
                    </div>
                    <div className="text-xs text-[hsl(var(--foreground))]/60">TZ: {s.timezone}</div>
                    <div className="text-right">
                      {/* Future: edit/delete */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle>Nuevo horario</CardTitle>
            <CardDescription className="text-[hsl(var(--foreground))]/70">Configura un día y hora fija para una clase recurrente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Sede</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v, coachId: "" }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona sede" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Instructor</Label>
              <Select value={form.coachId} onValueChange={(v) => setForm((f) => ({ ...f, coachId: v }))} disabled={!form.branchId}>
                <SelectTrigger><SelectValue placeholder="Selecciona instructor" /></SelectTrigger>
                <SelectContent>
                  {coaches.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Disciplina</Label>
              <Input value={form.discipline} onChange={(e) => setForm((f) => ({ ...f, discipline: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Nivel</Label>
              <Input value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Día</Label>
              <Select value={form.weekday} onValueChange={(v) => setForm((f) => ({ ...f, weekday: v as Schedule["weekday"] }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona día" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(weekdayLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Inicio</Label>
                <Input type="time" value={form.startTimeLocal} onChange={(e) => setForm((f) => ({ ...f, startTimeLocal: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Término</Label>
                <Input type="time" value={form.endTimeLocal} onChange={(e) => setForm((f) => ({ ...f, endTimeLocal: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Desde</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Hasta</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createSchedule} disabled={loading || !form.branchId || !form.coachId}>Crear horario</Button>
              <Button variant="outline" onClick={ensureThisMonth} disabled={loading}>Generar clases del mes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}
