"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import type { Matcher } from "react-day-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Info
} from "lucide-react"

interface ClassEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  instructor: string
  capacity: number | null
  enrolled: number
  location: string
  level: string
  status: string
  description?: string
}

export default function AdminCalendarPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [classes, setClasses] = useState<ClassEvent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filters, setFilters] = useState({ instructor: "all", level: "all", status: "all", location: "all" })
  const [openNewClass, setOpenNewClass] = useState(false)
  const [savingClass, setSavingClass] = useState(false)
  const [branches, setBranches] = useState<{id: string; name: string}[]>([])
  const [coaches, setCoaches] = useState<{id: string; name: string}[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "18:00",
    endTime: "19:00",
    locationId: "",
    instructorId: "",
    capacity: "20",
    level: "Intermedio",
    discipline: "General",
  })

  // Events (local MVP)
  const [events, setEvents] = useState<Array<{
    id: string
    title: string
    type: "championship" | "seminar" | "holiday" | "announcement" | "other"
    allDay: boolean
    date: string
    startTime?: string
    endTime?: string
    description?: string
    published: boolean
    important: boolean
  }>>([])
  const [openNewEvent, setOpenNewEvent] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const [eventError, setEventError] = useState<string | null>(null)
  const [eventForm, setEventForm] = useState<{
    title: string
    type: "championship" | "seminar" | "holiday" | "announcement" | "other"
    allDay: boolean
    date: string
    startTime: string
    endTime: string
    description: string
    published: boolean
    important: boolean
  }>({ title: "", type: "other", allDay: true, date: "", startTime: "09:00", endTime: "10:00", description: "", published: true, important: false })

  // Simple curriculum planner (restore)
  const [openPlanner, setOpenPlanner] = useState(false)
  const [modules, setModules] = useState<{ id: string; title: string; lessons: { id: string; title: string; notes?: string }[] }[]>([])
  const addModule = (title: string) => setModules((m) => [...m, { id: crypto.randomUUID(), title, lessons: [] }])

  const addLesson = (moduleId: string, title: string, notes?: string) =>
    setModules((m) => m.map(mod => mod.id === moduleId ? { ...mod, lessons: [...mod.lessons, { id: crypto.randomUUID(), title, notes }] } : mod))
  const scheduleLesson = (lessonTitle: string, notes?: string) => {
    setOpenPlanner(false)
    // pre-fill class form
    setForm((f) => ({ ...f, title: lessonTitle, description: notes || f.description }))
    setOpenNewClass(true)
  }

  const fetchMonthEvents = async () => {
    try {
      const params = new URLSearchParams({
        startDate: monthRange.start.toISOString(),
        endDate: monthRange.end.toISOString(),
      })
      const res = await fetch(`/api/admin/events?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) {
        setEvents(data)
      } else if (Array.isArray(data.events)) {
        setEvents(data.events)
      }
    } catch (e) {
      console.error("Error fetching events", e)
    }
  }

  // View mode (month | week) and Weekly programming
  const [viewMode, setViewMode] = useState<"month" | "week">("month")
  const [openWeekProgram, setOpenWeekProgram] = useState(false)
  type WeekAttachment = { type: "youtube" | "link"; url: string; title: string }
  const [weeklyPrograms, setWeeklyPrograms] = useState<Record<string, { title: string; objectives: string; attachments: WeekAttachment[] }>>({})
  const [weekForm, setWeekForm] = useState<{ title: string; objectives: string; attachments: WeekAttachment[] }>({ title: "", objectives: "", attachments: [] })

  // Helpers
  const monthRange = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }, [currentMonth])

  const fetchMonthClasses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: monthRange.start.toISOString(),
        endDate: monthRange.end.toISOString(),
      })
      const res = await fetch(`/api/classes?${params.toString()}`)
      if (!res.ok) return
      const data: ClassEvent[] = await res.json()
      setClasses(data)
    } catch (e) {
      console.error("Error fetching classes", e)
    } finally {
      setLoading(false)
    }
  }

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
      if (!form.locationId) { setCoaches([]); return }
      try {
        const res = await fetch(`/api/admin/branches/${form.locationId}/coaches`)
        if (res.ok) {
          const data = await res.json()
          if (alive && Array.isArray(data.coaches)) {
            setCoaches(data.coaches.map((c: any) => ({ id: c.id, name: c.name })))
          }
        }
      } catch {}
    })()
    return () => { alive = false }
  }, [form.locationId])

  // Keep form date in sync with selectedDate
  useEffect(() => {
    const d = selectedDate
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    setForm((f) => ({ ...f, date: iso }))
    setEventForm((f) => ({ ...f, date: iso }))
  }, [selectedDate])

  useEffect(() => {
    fetchMonthClasses()
    fetchMonthEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthRange.start.getTime(), monthRange.end.getTime()])

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const filteredClasses = useMemo(() => {
    return classes.filter((c) =>
      (filters.instructor === "all" || c.instructor === filters.instructor) &&
      (filters.level === "all" || c.level === filters.level) &&
      (filters.status === "all" || c.status === filters.status) &&
      (filters.location === "all" || c.location === filters.location)
    )
  }, [classes, filters])

  const dayClasses = useMemo(() => {
    return filteredClasses
      .filter((c) => sameDay(new Date(c.startTime), selectedDate))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [filteredClasses, selectedDate])

  const dayEvents = useMemo(() => {
    const d = selectedDate
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    return events.filter((ev) => ev.date === key)
  }, [events, selectedDate])

  // Important events in current month
  const monthImportantEvents = useMemo(() => {
    return events.filter((ev) => {
      const d = keyToDate(ev.date)
      return ev.important && d >= monthRange.start && d <= monthRange.end
    }).sort((a, b) => keyToDate(a.date).getTime() - keyToDate(b.date).getTime())
  }, [events, monthRange])

  // KPIs for the month
  const totalMonthClasses = classes.length
  const cancelledCount = classes.filter((c) => c.status === "cancelled").length
  const occupancyAvg = useMemo(() => {
    const withCapacity = classes.filter((c) => (c.capacity ?? 0) > 0)
    if (withCapacity.length === 0) return 0
    const ratio = withCapacity.reduce((acc, c) => acc + Math.min(1, c.enrolled / (c.capacity as number)), 0) / withCapacity.length
    return Math.round(ratio * 100)
  }, [classes])

  // Filter options
  const uniqueSorted = (arr: (string | null | undefined)[]) => Array.from(new Set(arr.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b))
  const instructorOptions = useMemo(() => uniqueSorted(classes.map((c) => c.instructor)), [classes])
  const levelOptions = useMemo(() => uniqueSorted(classes.map((c) => c.level)), [classes])
  const locationOptions = useMemo(() => uniqueSorted(classes.map((c) => c.location)), [classes])
  const statusOptions = useMemo(() => uniqueSorted(classes.map((c) => c.status)), [classes])

  // Calendar modifiers for event markers
  const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  function keyToDate(key: string) {
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y, (m as number) - 1, d)
  }
  const dayAgg = useMemo(() => {
    const map = new Map<string, { cancelled: boolean; occSum: number; occCount: number }>()
    for (const c of filteredClasses) {
      const d = new Date(c.startTime)
      const key = dateKey(d)
      const prev = map.get(key) ?? { cancelled: false, occSum: 0, occCount: 0 }
      const capacity = c.capacity ?? 0
      const occ = capacity > 0 ? Math.min(1, c.enrolled / capacity) : null
      map.set(key, {
        cancelled: prev.cancelled || c.status === "cancelled",
        occSum: prev.occSum + (occ ?? 0),
        occCount: prev.occCount + (occ === null ? 0 : 1),
      })
    }
    return map
  }, [filteredClasses])

  const hasEventsDates = useMemo(() => Array.from(dayAgg.keys()).map(keyToDate), [dayAgg])
  const busyDates = useMemo(() => {
    const out: Date[] = []
    dayAgg.forEach((v, k) => {
      if (v.occCount > 0) {
        const avg = v.occSum / v.occCount
        if (avg >= 0.7) out.push(keyToDate(k))
      }
    })
    return out
  }, [dayAgg])
  const cancelledDates = useMemo(() => {
    const out: Date[] = []
    dayAgg.forEach((v, k) => {
      if (v.cancelled) out.push(keyToDate(k))
    })
    return out
  }, [dayAgg])
  const eventDates = useMemo(() => {
    return events.map((ev) => {
      const [y, m, d] = ev.date.split("-").map(Number)
      return new Date(y, (m as number) - 1, d)
    })
  }, [events])
  const calendarModifiers = useMemo<Record<string, Matcher | Matcher[]>>(() => ({
    has_events: [...hasEventsDates, ...eventDates],
    busy_day: busyDates,
    cancelled_day: cancelledDates,
    weekend: { dayOfWeek: [0, 6] },
  }), [hasEventsDates, eventDates, busyDates, cancelledDates])

  const formatTime = (s: string) => new Date(s).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", timeZone: "America/Santiago" })
  const formatDateLong = (d: Date) => d.toLocaleDateString("es-CL", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Santiago" })
  const fmt = (d: Date) => d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })

  // Week helpers
  const startOfWeek = (d: Date) => {
    const x = new Date(d)
    const dow = (x.getDay() + 6) % 7 // Monday=0
    x.setDate(x.getDate() - dow)
    x.setHours(0, 0, 0, 0)
    return x
  }
  const addDays = (d: Date, n: number) => {
    const x = new Date(d)
    x.setDate(x.getDate() + n)
    return x
  }
  const weekKey = (d: Date) => {
    const s = startOfWeek(d)
    return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`
  }
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i)), [selectedDate])
  const weekRangeLabel = useMemo(() => {
    const s = weekDays[0]
    const e = weekDays[6]
    const fmt = (d: Date) => d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })
    return `${fmt(s)} — ${fmt(e)}`
  }, [weekDays])

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      scheduled: { label: "Programada", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      ongoing: { label: "En curso", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
      completed: { label: "Completada", cls: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
      cancelled: { label: "Cancelada", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
    }
    const item = map[status] || { label: status, cls: "bg-gray-500/20 text-gray-300 border-gray-500/30" }
    return <Badge className={`${item.cls} font-medium`}>{item.label}</Badge>
  }

  const eventTypeBadge = (type: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      championship: { label: "Campeonato", cls: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
      seminar: { label: "Seminario", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      holiday: { label: "Feriado", cls: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
      announcement: { label: "Anuncio", cls: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
      other: { label: "Evento", cls: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
    }
    const item = map[type] || { label: type, cls: "bg-gray-500/20 text-gray-300 border-gray-500/30" }
    return <Badge className={`${item.cls} font-medium`}>{item.label}</Badge>
  }

  if (!mounted) {
    return <div className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8" />
  }
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-blue-500 rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendario de Clases</h1>
            <p className="text-gray-400">Planifica y revisa la programación de tu academia</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-0.5 rounded-lg border border-gray-700/50 p-0.5 bg-gray-900/40">
              <Button size="sm" variant={viewMode === "month" ? "default" : "outline"} className={viewMode === "month" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-800/50 border-gray-700 text-gray-300"} onClick={() => setViewMode("month")}>Mes</Button>
              <Button size="sm" variant={viewMode === "week" ? "default" : "outline"} className={viewMode === "week" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-800/50 border-gray-700 text-gray-300"} onClick={() => setViewMode("week")}>Semana</Button>
            </div>
            <Button
              variant="outline"
              className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => { setEventForm((f) => ({ ...f, title: "", description: "" })); setOpenNewEvent(true) }}>Nuevo evento</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setOpenNewClass(true)}>Nueva clase</Button>
            <Button variant="outline" className="bg-purple-600/20 border-purple-500/30 text-purple-200 hover:bg-purple-600/30" onClick={() => setOpenPlanner(true)}>Plan curricular</Button>
          </div>
        </header>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filters.instructor} onValueChange={(v) => setFilters((f) => ({ ...f, instructor: v }))}>
            <SelectTrigger size="sm" className="bg-gray-800/50 border-gray-700 text-gray-200 w-44">
              <SelectValue placeholder="Instructor" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all">Todos los instructores</SelectItem>
              {instructorOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.level} onValueChange={(v) => setFilters((f) => ({ ...f, level: v }))}>
            <SelectTrigger size="sm" className="bg-gray-800/50 border-gray-700 text-gray-200 w-36">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all">Todos los niveles</SelectItem>
              {levelOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
            <SelectTrigger size="sm" className="bg-gray-800/50 border-gray-700 text-gray-200 w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all">Todos los estados</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.location} onValueChange={(v) => setFilters((f) => ({ ...f, location: v }))}>
            <SelectTrigger size="sm" className="bg-gray-800/50 border-gray-700 text-gray-200 w-40">
              <SelectValue placeholder="Sede" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all">Todas las sedes</SelectItem>
              {locationOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-gray-800/50"
            onClick={() => setFilters({ instructor: "all", level: "all", status: "all", location: "all" })}
          >
            Limpiar filtros
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
              <CardTitle className="text-sm font-medium text-white/90">Clases del mes</CardTitle>
              <CalendarDays className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-white">{totalMonthClasses}</div>
              <p className="text-xs text-gray-400 mt-1">Total programadas</p>
            </CardContent>
          </Card>

          <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-emerald-500 to-green-600 p-4">
              <CardTitle className="text-sm font-medium text-white/90">Ocupación promedio</CardTitle>
              <Users className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-white">{occupancyAvg}%</div>
              <Progress value={occupancyAvg} className="mt-4 h-2 bg-gray-700/50" indicatorClassName="bg-gradient-to-r from-emerald-500 to-green-600" />
            </CardContent>
          </Card>

          <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-red-500 to-rose-600 p-4">
              <CardTitle className="text-sm font-medium text-white/90">Canceladas</CardTitle>
              <Info className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-white">{cancelledCount}</div>
              <p className="text-xs text-gray-400 mt-1">Este mes</p>
            </CardContent>
          </Card>

          <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-purple-500 to-violet-600 p-4">
              <CardTitle className="text-sm font-medium text-white/90">Día seleccionado</CardTitle>
              <Clock className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-base text-gray-300 capitalize">{formatDateLong(selectedDate)}</div>
              <div className="text-3xl font-bold text-white mt-1">{dayEvents.length + dayClasses.length}</div>
              <p className="text-xs text-gray-400 mt-1">Actividades del día · Eventos: {dayEvents.length} · Clases: {dayClasses.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Calendar: Month */}
          <Card className={`glass-effect rounded-2xl border-gray-700/50 lg:col-span-3 ${viewMode === "month" ? "" : "hidden"}`}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Calendario</CardTitle>
                <CardDescription className="text-gray-400">Selecciona una fecha para ver eventos y clases</CardDescription>
              </div>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => { setEventForm((f) => ({ ...f, date: dateKey(selectedDate) })); setOpenNewEvent(true) }}>
                Crear evento el {fmt(selectedDate)}
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="px-2 pb-4">
                <UiCalendar
                  className="w-full"
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  month={currentMonth}
                  onMonthChange={(m: Date) => setCurrentMonth(m)}
                  onDayClick={(day: Date) => { setSelectedDate(day); setEventForm((f) => ({ ...f, date: dateKey(day) })) }}
                  modifiers={calendarModifiers as any}
                />
              </div>
              {/* Leyenda */}
              <div className="px-6 pb-4 pt-0 text-xs text-gray-400 flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 inline-block" />
                  Con eventos/clases
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 inline-block" />
                  Alta ocupación
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                  Con cancelaciones
                </span>
              </div>
              {/* Importantes del mes */}
              {monthImportantEvents.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="text-sm text-gray-300 font-medium mb-2">Importantes del mes</div>
                  <div className="space-y-2">
                    {monthImportantEvents.slice(0, 6).map((ev) => (
                      <button key={ev.id} className="w-full text-left text-sm p-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition"
                        onClick={() => { const d = keyToDate(ev.date); setSelectedDate(d) }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-300">★</span>
                            <span className="text-white font-medium">{ev.title}</span>
                          </div>
                          <span className="text-xs text-gray-300">{fmt(keyToDate(ev.date))}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

          {/* Calendar: Week overview */}
          <Card className={`glass-effect rounded-2xl border-gray-700/50 lg:col-span-5 ${viewMode === "week" ? "" : "hidden"}`}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Semana</CardTitle>
                <CardDescription className="text-gray-400">{weekRangeLabel}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-300" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>Semana anterior</Button>
                <Button variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-300" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>Siguiente semana</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setWeekForm({ title: "", objectives: "", attachments: [] }); setOpenWeekProgram(true) }}>Programar semana</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weekDays.map((d) => {
                  const dClasses = filteredClasses
                    .filter((c) => sameDay(new Date(c.startTime), d))
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  return (
                    <div key={d.toISOString()} className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-3">
                      <div className="text-sm font-medium text-white capitalize mb-2">{d.toLocaleDateString("es-CL", { weekday: "short", day: "2-digit" })}</div>
                      <div className="space-y-2">
                        {dClasses.length === 0 ? (
                          <div className="text-xs text-gray-400">Sin clases</div>
                        ) : (
                          dClasses.map((cls) => {
                            const start = formatTime(cls.startTime)
                            const end = formatTime(cls.endTime)
                            const capacity = cls.capacity ?? 0
                            const occupancy = capacity > 0 ? Math.round((cls.enrolled / capacity) * 100) : 0
                            return (
                              <div key={cls.id} className="rounded-lg border border-gray-700/50 bg-gray-900/40 p-2">
                                <div className="text-xs text-white font-medium truncate">{cls.title}</div>
                                <div className="text-[11px] text-gray-400 flex items-center justify-between">
                                  <span>{start} - {end}</span>
                                  {capacity > 0 && <span>{cls.enrolled}/{capacity}</span>}
                                </div>
                                {capacity > 0 && <Progress value={Math.min(100, occupancy)} className="h-1.5 bg-gray-700/50 mt-1" />}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Day panel */}
          <Card className={`glass-effect rounded-2xl border-gray-700/50 lg:col-span-2 ${viewMode === "week" ? "hidden" : ""}`}>
            <CardHeader>
              <CardTitle>Actividades del día</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                </div>
              ) : (dayEvents.length === 0 && dayClasses.length === 0) ? (
                <div className="text-center py-16">
                  <p className="text-gray-400">No hay eventos ni clases programados para este día.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Importantes */}
                  {dayEvents.filter((ev) => ev.important).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400 font-medium flex items-center gap-1">Importantes <span className="text-yellow-300">★</span></div>
                      <div className="space-y-3">
                        {dayEvents.filter((ev) => ev.important).map((ev) => (
                          <div key={ev.id} className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-white">{ev.title}</h3>
                                  {eventTypeBadge(ev.type)}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                  <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-gray-400" /> {ev.allDay ? "Todo el día" : `${ev.startTime} - ${ev.endTime}`}</span>
                                </div>
                              </div>
                            </div>
                            {ev.description && (
                              <>
                                <Separator className="my-3 bg-gray-700/50" />
                                <p className="text-sm text-gray-300">{ev.description}</p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anuncios */}
                  {dayEvents.filter((ev) => ev.type === "announcement" && !ev.important).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400 font-medium">Anuncios</div>
                      <div className="space-y-3">
                        {dayEvents.filter((ev) => ev.type === "announcement" && !ev.important).map((ev) => (
                          <div key={ev.id} className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-white">{ev.title}</h3>
                                  {eventTypeBadge(ev.type)}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                  <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-gray-400" /> {ev.allDay ? "Todo el día" : `${ev.startTime} - ${ev.endTime}`}</span>
                                </div>
                              </div>
                            </div>
                            {ev.description && (
                              <>
                                <Separator className="my-3 bg-gray-700/50" />
                                <p className="text-sm text-gray-300">{ev.description}</p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eventos */}
                  {dayEvents.filter((ev) => ev.type !== "announcement" && !ev.important).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400 font-medium">Eventos</div>
                      <div className="space-y-3">
                        {dayEvents.filter((ev) => ev.type !== "announcement" && !ev.important).map((ev) => (
                          <div key={ev.id} className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4 relative overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-purple-500 before:to-indigo-600">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-white">{ev.title}</h3>
                                  {eventTypeBadge(ev.type)}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                  <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-gray-400" /> {ev.allDay ? "Todo el día" : `${ev.startTime} - ${ev.endTime}`}</span>
                                </div>
                              </div>
                            </div>
                            {ev.description && (
                              <>
                                <Separator className="my-3 bg-gray-700/50" />
                                <p className="text-sm text-gray-300">{ev.description}</p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clases */}
                  {dayClasses.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400 font-medium">Clases</div>
                      <div className="space-y-4">
                        {dayClasses.map((cls) => {
                          const start = formatTime(cls.startTime)
                          const end = formatTime(cls.endTime)
                          const capacity = cls.capacity ?? 0
                          const occupancy = capacity > 0 ? Math.round((cls.enrolled / capacity) * 100) : 0
                          return (
                            <div key={cls.id} className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4 relative overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-indigo-500 before:to-purple-600">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-white">{cls.title}</h3>
                                    {statusBadge(cls.status)}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                    <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-gray-400" /> {start} - {end}</span>
                                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" /> {cls.location}</span>
                                    <span className="flex items-center gap-1"><Users className="h-4 w-4 text-gray-400" /> {cls.enrolled}{capacity ? ` / ${capacity}` : ""}</span>
                                  </div>
                                </div>
                              </div>
                              {capacity > 0 && (
                                <div className="mt-3">
                                  <Progress value={Math.min(100, occupancy)} className="h-2 bg-gray-700/50" indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-600" />
                                  <div className="mt-1 text-xs text-gray-400">Ocupación: {occupancy}%</div>
                                </div>
                              )}
                              {cls.description && (
                                <>
                                  <Separator className="my-3 bg-gray-700/50" />
                                  <p className="text-sm text-gray-300">{cls.description}</p>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Dialog: Nueva clase */}
          <Dialog open={openNewClass} onOpenChange={setOpenNewClass}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear clase</DialogTitle>
                <DialogDescription className="text-gray-400">Define los detalles y programa la clase</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="bg-gray-800 border-gray-700" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label>Fecha</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="grid gap-1">
                    <Label>Inicio</Label>
                    <Input type="time" value={form.startTime} onChange={(e) => setForm(f => ({ ...f, startTime: e.target.value }))} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="grid gap-1">
                    <Label>Fin</Label>
                    <Input type="time" value={form.endTime} onChange={(e) => setForm(f => ({ ...f, endTime: e.target.value }))} className="bg-gray-800 border-gray-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label>Sede</Label>
                    <Select value={form.locationId} onValueChange={(v) => setForm(f => ({ ...f, locationId: v, instructorId: "" }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Selecciona sede" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label>Instructor</Label>
                    <Select value={form.instructorId} onValueChange={(v) => setForm(f => ({ ...f, instructorId: v }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Selecciona instructor" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {coaches.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label>Nivel</Label>
                    <Input value={form.level} onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="grid gap-1">
                    <Label>Disciplina</Label>
                    <Input value={form.discipline} onChange={(e) => setForm(f => ({ ...f, discipline: e.target.value }))} className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="grid gap-1">
                    <Label>Cupo</Label>
                    <Input type="number" min={0} value={form.capacity} onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))} className="bg-gray-800 border-gray-700" />
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label>Descripción</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="bg-gray-800 border-gray-700" />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={async () => {
                    try {
                      setSavingClass(true)
                      const res = await fetch("/api/classes", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: form.title,
                          description: form.description,
                          date: form.date,
                          startTime: form.startTime,
                          endTime: form.endTime,
                          instructorId: form.instructorId,
                          locationId: form.locationId,
                          capacity: form.capacity,
                          level: form.level,
                          discipline: form.discipline,
                        }),
                      })
                      if (res.ok) {
                        // refresh month data
                        await fetchMonthClasses()
                        setOpenNewClass(false)
                        setForm((f) => ({ ...f, title: "", description: "" }))
                      }
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setSavingClass(false)
                    }
                  }}
                  disabled={savingClass || !form.title || !form.date || !form.startTime || !form.endTime || !form.locationId || !form.instructorId}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {savingClass ? "Guardando..." : "Crear clase"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Nuevo evento */}
          <Dialog open={openNewEvent} onOpenChange={setOpenNewEvent}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo evento</DialogTitle>
                <DialogDescription className="text-gray-400">Crea un evento visible para alumnos y entrenadores</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <Label>Título</Label>
                  <Input value={eventForm.title} onChange={(e) => setEventForm(f => ({ ...f, title: e.target.value }))} className="bg-gray-800 border-gray-700" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label>Tipo</Label>
                    <Select value={eventForm.type} onValueChange={(v) => setEventForm(f => ({ ...f, type: v as any }))}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="championship">Campeonato</SelectItem>
                        <SelectItem value="seminar">Seminario</SelectItem>
                        <SelectItem value="holiday">Feriado</SelectItem>
                        <SelectItem value="announcement">Anuncio</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="flex items-center gap-2">
                      <input type="checkbox" checked={eventForm.allDay} onChange={(e) => setEventForm(f => ({ ...f, allDay: e.target.checked }))} /> Todo el día
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label>Fecha</Label>
                    <Input type="date" value={eventForm.date} onChange={(e) => setEventForm(f => ({ ...f, date: e.target.value }))} className="bg-gray-800 border-gray-700" />
                  </div>
                  {!eventForm.allDay && (
                    <>
                      <div className="grid gap-1">
                        <Label>Inicio</Label>
                        <Input type="time" value={eventForm.startTime} onChange={(e) => setEventForm(f => ({ ...f, startTime: e.target.value }))} className="bg-gray-800 border-gray-700" />
                      </div>
                      <div className="grid gap-1">
                        <Label>Fin</Label>
                        <Input type="time" value={eventForm.endTime} onChange={(e) => setEventForm(f => ({ ...f, endTime: e.target.value }))} className="bg-gray-800 border-gray-700" />
                      </div>
                    </>
                  )}
                </div>
                <div className="grid gap-1">
                  <Label>Descripción</Label>
                  <Textarea rows={3} value={eventForm.description} onChange={(e) => setEventForm(f => ({ ...f, description: e.target.value }))} className="bg-gray-800 border-gray-700" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="flex items-center gap-2">
                      <input type="checkbox" checked={eventForm.published} onChange={(e) => setEventForm(f => ({ ...f, published: e.target.checked }))} /> Publicado
                    </Label>
                  </div>
                  <div className="grid gap-1">
                    <Label className="flex items-center gap-2">
                      <input type="checkbox" checked={eventForm.important} onChange={(e) => setEventForm(f => ({ ...f, important: e.target.checked }))} /> Importante
                    </Label>
                  </div>
                </div>
              </div>
              {eventError && (
                <div className="text-sm text-red-400 px-1">{eventError}</div>
              )}
              <DialogFooter>
                <Button
                  onClick={async () => {
                    setEventError(null)
                    if (!eventForm.title?.trim()) { setEventError("El título es obligatorio"); return }
                    if (!eventForm.date) { setEventError("La fecha es obligatoria"); return }
                    const payload = { ...eventForm }
                    try {
                      setSavingEvent(true)
                      const res = await fetch("/api/admin/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
                      if (!res.ok) {
                        let msg = "No se pudo guardar el evento"
                        try { const data = await res.json(); if (data?.error) msg = data.error } catch {}
                        setEventError(msg)
                        return
                      }
                      const created = await res.json()
                      // Update local list immediately so the day panel reflects the new card
                      setEvents((prev) => {
                        const exists = prev.some((e) => e.id === created.id)
                        return exists ? prev.map((e) => (e.id === created.id ? created : e)) : [...prev, created]
                      })
                      // Ensure the selected day matches the created event's date (in case user changed date in the form)
                      setSelectedDate(keyToDate(created.date))
                      // Background sync to avoid any mismatch
                      try { await fetchMonthEvents() } catch {}
                      setOpenNewEvent(false)
                      setEventForm((f) => ({ ...f, title: "", description: "" }))
                    } catch (e) {
                      setEventError("Error de red al guardar. Intenta nuevamente.")
                    } finally {
                      setSavingEvent(false)
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
                  disabled={savingEvent}
                >
                  {savingEvent ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Programar semana */}
          <Dialog open={openWeekProgram} onOpenChange={setOpenWeekProgram}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Programación semanal</DialogTitle>
                <DialogDescription className="text-gray-400">Define tema, objetivos y materiales de la semana ({weekRangeLabel}).</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-1">
                  <Label>Tema</Label>
                  <Input value={weekForm.title} onChange={(e) => setWeekForm((f) => ({ ...f, title: e.target.value }))} className="bg-gray-800 border-gray-700" />
                </div>
                <div className="grid gap-1">
                  <Label>Objetivos</Label>
                  <Textarea rows={4} value={weekForm.objectives} onChange={(e) => setWeekForm((f) => ({ ...f, objectives: e.target.value }))} className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="mb-0">Materiales</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-200" onClick={() => setWeekForm((f) => ({ ...f, attachments: [...f.attachments, { type: "youtube", url: "", title: "" }] }))}>Añadir YouTube</Button>
                      <Button size="sm" variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-200" onClick={() => setWeekForm((f) => ({ ...f, attachments: [...f.attachments, { type: "link", url: "", title: "" }] }))}>Añadir enlace</Button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {weekForm.attachments.length === 0 ? (
                      <div className="text-sm text-gray-400">Aún no hay materiales.</div>
                    ) : weekForm.attachments.map((att, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                        <Select value={att.type} onValueChange={(v: any) => setWeekForm((f) => { const list = [...f.attachments]; list[idx] = { ...list[idx], type: v }; return { ...f, attachments: list } })}>
                          <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="link">Enlace</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder={att.type === "youtube" ? "URL de YouTube" : "URL"} value={att.url} onChange={(e) => setWeekForm((f) => { const list = [...f.attachments]; list[idx] = { ...list[idx], url: e.target.value }; return { ...f, attachments: list } })} className="col-span-2 bg-gray-800 border-gray-700" />
                        <Input placeholder="Título" value={att.title} onChange={(e) => setWeekForm((f) => { const list = [...f.attachments]; list[idx] = { ...list[idx], title: e.target.value }; return { ...f, attachments: list } })} className="col-span-2 bg-gray-800 border-gray-700" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={async () => {
                  const key = weekKey(selectedDate)
                  setWeeklyPrograms((prev) => ({ ...prev, [key]: { title: weekForm.title, objectives: weekForm.objectives, attachments: weekForm.attachments } }))
                  // Attempt backend save (optional)
                  try {
                    await fetch("/api/admin/weekly-programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekKey: key, ...weekForm }) })
                  } catch {}
                  setOpenWeekProgram(false)
                }} className="bg-indigo-600 hover:bg-indigo-700">Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Plan curricular (MVP) */}
          <Dialog open={openPlanner} onOpenChange={setOpenPlanner}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Plan curricular</DialogTitle>
                <DialogDescription className="text-gray-400">Crea módulos y lecciones. Puedes agendar una lección como clase.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Crear módulo */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="mb-1 block">Nuevo módulo</Label>
                    <Input id="new-module-title" placeholder="Ej: Guardias y pases" className="bg-gray-800 border-gray-700" />
                  </div>
                  <Button onClick={() => {
                    const el = document.getElementById("new-module-title") as HTMLInputElement | null
                    const val = el?.value?.trim()
                    if (val) { addModule(val); if (el) el.value = "" }
                  }} className="bg-purple-600 hover:bg-purple-700">Agregar</Button>
                </div>
                {/* Lista módulos */}
                <div className="space-y-3 max-h-80 overflow-auto pr-1">
                  {modules.length === 0 ? (
                    <div className="text-gray-400 text-sm">Aún no hay módulos. Crea el primero.</div>
                  ) : modules.map((mod) => (
                    <div key={mod.id} className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-3">
                      <div className="font-semibold text-white mb-2">{mod.title}</div>
                      {/* Agregar lección */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <Input id={`lesson-${mod.id}`} placeholder="Título de la lección" className="col-span-1 bg-gray-800 border-gray-700" />
                        <Input id={`notes-${mod.id}`} placeholder="Notas (opcional)" className="col-span-2 bg-gray-800 border-gray-700" />
                        <div className="col-span-3 flex gap-2">
                          <Button size="sm" onClick={() => {
                            const l = document.getElementById(`lesson-${mod.id}`) as HTMLInputElement | null
                            const n = document.getElementById(`notes-${mod.id}`) as HTMLInputElement | null
                            const title = l?.value?.trim()
                            if (title) { addLesson(mod.id, title, n?.value); if (l) l.value = ""; if (n) n.value = "" }
                          }}>Agregar lección</Button>
                        </div>
                      </div>
                      {mod.lessons.length === 0 ? (
                        <div className="text-gray-400 text-xs">Sin lecciones aún.</div>
                      ) : (
                        <div className="space-y-2">
                          {mod.lessons.map((lsn) => (
                            <div key={lsn.id} className="flex items-center justify-between rounded-md border border-gray-700/50 bg-gray-900/40 px-3 py-2">
                              <div>
                                <div className="text-sm text-white font-medium">{lsn.title}</div>
                                {lsn.notes && <div className="text-xs text-gray-400">{lsn.notes}</div>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-200" onClick={() => scheduleLesson(lsn.title, lsn.notes)}>Agendar</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
