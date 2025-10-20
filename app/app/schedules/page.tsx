"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"

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
  coach?: { id: string; name?: string | null } | null
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

export default function StudentSchedulesPage() {
  const [loading, setLoading] = useState(false)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [weekday, setWeekday] = useState<Weekday | "ALL">("ALL")

  async function load() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (weekday !== "ALL") params.set("weekday", weekday)
      const res = await fetch(`/api/schedules?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      setSchedules(Array.isArray(data.schedules) ? data.schedules : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [weekday])

  const grouped = useMemo(() => {
    const m: Record<Weekday, Schedule[]> = { MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [], SUN: [] }
    for (const s of schedules) m[s.weekday].push(s)
    for (const k of Object.keys(m) as Weekday[]) m[k].sort((a, b) => a.startTimeLocal.localeCompare(b.startTimeLocal))
    return m
  }, [schedules])

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Horarios</h1>
          <p className="text-gray-400">Consulta los horarios regulares de entrenamientos.</p>
        </header>

        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Listado semanal</CardTitle>
            <CardDescription className="text-sm">Filtra por día y revisa los bloques disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Día</label>
              <select value={weekday} onChange={(e) => setWeekday(e.target.value as any)} className="border rounded px-2 py-1 bg-transparent">
                <option value="ALL">Todos</option>
                {Object.entries(weekdayLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">Cargando…</div>
            ) : schedules.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin horarios activos</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(grouped) as Weekday[]).map((wd) => (
                  <div key={wd} className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline">{weekdayLabels[wd]}</Badge>
                    </div>
                    {grouped[wd].length === 0 ? (
                      <div className="text-xs text-muted-foreground">—</div>
                    ) : (
                      grouped[wd].map((s) => (
                        <div key={s.id} className="rounded-xl border border-gray-700/50 p-3 bg-white/5 backdrop-blur">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-medium">{s.title}</div>
                              <div className="text-xs text-muted-foreground">{s.discipline} · {s.level}</div>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">{s.startTimeLocal} – {s.endTimeLocal}</div>
                          </div>
                          {s.coach?.name && (
                            <div className="mt-1 text-xs text-muted-foreground">Instructor: {s.coach.name}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
