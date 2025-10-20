"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type EventItem = {
  id: string
  title: string
  description?: string | null
  type?: string | null
  startsAt: string
  endsAt?: string | null
}

type ClassItem = {
  id: string
  title: string
  description?: string | null
  startTime: string
  endTime: string
  coach?: { id: string; name?: string | null; email?: string | null } | null
  _count?: { attendances: number }
}

export default function AdminAttendancePage() {
  const [tab, setTab] = useState<"classes" | "events">("events")
  const [start, setStart] = useState<string>(new Date().toISOString().slice(0, 10))
  const [end, setEnd] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<EventItem[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [checkingMap, setCheckingMap] = useState<Record<string, boolean>>({})
  const [emailMap, setEmailMap] = useState<Record<string, string>>({})

  const range = useMemo(() => {
    const s = new Date(`${start}T00:00:00`)
    const e = new Date(`${end}T23:59:59`)
    return { s, e }
  }, [start, end])

  async function loadEvents() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ start: range.s.toISOString(), end: range.e.toISOString() })
      const res = await fetch(`/api/events?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      const items: EventItem[] = Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : []
      setEvents(items)
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  async function loadClasses() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ start: range.s.toISOString(), end: range.e.toISOString() })
      const res = await fetch(`/api/admin/classes?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      const items: ClassItem[] = Array.isArray(data?.classes) ? data.classes : []
      setClasses(items)
    } catch {
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  async function checkIn(classId: string) {
    const email = (emailMap[classId] || "").trim()
    if (!email) return
    setCheckingMap((m) => ({ ...m, [classId]: true }))
    try {
      const res = await fetch(`/api/admin/classes/${classId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "No se pudo registrar asistencia")
        return
      }
      // refrescar conteos
      await loadClasses()
      setEmailMap((m) => ({ ...m, [classId]: "" }))
    } finally {
      setCheckingMap((m) => ({ ...m, [classId]: false }))
    }
  }

  useEffect(() => {
    if (tab === "events") loadEvents()
    if (tab === "classes") loadClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, start, end])

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-[hsl(var(--primary))] rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-[hsl(var(--accent))] rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <header className="mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Asistencia</h1>
          <p className="text-gray-400">Gestiona asistencia de Clases y Eventos</p>
        </header>

        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardContent className="p-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <div className="flex flex-wrap items-center gap-2">
                <TabsList>
                  <TabsTrigger value="classes">Clases</TabsTrigger>
                  <TabsTrigger value="events">Eventos</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Desde</label>
                  <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-[160px]" />
                  <label className="text-sm text-muted-foreground">Hasta</label>
                  <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-[160px]" />
                </div>
              </div>

              <TabsContent value="classes" className="mt-4">
                <Card className="glass-effect rounded-2xl border-gray-700/50">
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="p-6 text-sm text-muted-foreground">Cargando clases…</div>
                    ) : classes.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground">No hay clases en el rango seleccionado.</div>
                    ) : (
                      <ul className="divide-y divide-gray-800">
                        {classes.map((cl) => (
                          <li key={cl.id} className="p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <div className="flex-1">
                                <div className="font-medium">{cl.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(cl.startTime).toLocaleString()} — {new Date(cl.endTime).toLocaleString()}
                                </div>
                                {cl.coach?.name && (
                                  <div className="text-xs text-muted-foreground">Instructor: {cl.coach.name}</div>
                                )}
                              </div>
                              <Badge variant="outline">Presentes: {cl._count?.attendances ?? 0}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                type="email"
                                placeholder="email del alumno"
                                value={emailMap[cl.id] || ""}
                                onChange={(e) => setEmailMap((m) => ({ ...m, [cl.id]: e.target.value }))}
                                className="w-64"
                              />
                              <Button onClick={() => checkIn(cl.id)} disabled={!!checkingMap[cl.id]} variant="outline">
                                {checkingMap[cl.id] ? "Registrando…" : "Check-in"}
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="mt-4">
                <Card className="glass-effect rounded-2xl border-gray-700/50">
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="p-6 text-sm text-muted-foreground">Cargando eventos…</div>
                    ) : events.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground">No hay eventos en el rango seleccionado.</div>
                    ) : (
                      <ul className="divide-y divide-gray-800">
                        {events.map((ev) => (
                          <li key={ev.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="flex-1">
                              <div className="font-medium">{ev.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(ev.startsAt).toLocaleString()} {ev.endsAt ? `— ${new Date(ev.endsAt).toLocaleString()}` : ""}
                              </div>
                              {ev.type && <div className="text-xs text-muted-foreground">Tipo: {ev.type}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button asChild variant="outline" size="sm">
                                <a href={`/admin/calendar`} title="Ver en calendario">Ver en calendario</a>
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}