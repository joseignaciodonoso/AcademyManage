"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { QrCode, Users, Calendar, Clock, Download, Copy, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import QRCode from "qrcode"

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
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [qrUrl, setQrUrl] = useState<string>("")
  const [qrLoading, setQrLoading] = useState(false)

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
        toast.error(err.error || "No se pudo registrar asistencia")
        return
      }
      toast.success("Asistencia registrada")
      await loadClasses()
      setEmailMap((m) => ({ ...m, [classId]: "" }))
    } finally {
      setCheckingMap((m) => ({ ...m, [classId]: false }))
    }
  }

  async function openQrDialog(cl: ClassItem) {
    setSelectedClass(cl)
    setQrDialogOpen(true)
    setQrLoading(true)
    setQrDataUrl("")
    setQrUrl("")
    
    try {
      const res = await fetch(`/api/attendance/qr?classId=${cl.id}`)
      if (!res.ok) {
        toast.error("No se pudo generar el QR")
        return
      }
      const data = await res.json()
      setQrUrl(data.checkinUrl)
      
      // Generate QR code image
      const qrDataUrl = await QRCode.toDataURL(data.checkinUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" }
      })
      setQrDataUrl(qrDataUrl)
    } catch (e) {
      toast.error("Error al generar QR")
    } finally {
      setQrLoading(false)
    }
  }

  function copyQrUrl() {
    if (qrUrl) {
      navigator.clipboard.writeText(qrUrl)
      toast.success("URL copiada al portapapeles")
    }
  }

  function downloadQr() {
    if (qrDataUrl && selectedClass) {
      const link = document.createElement("a")
      link.download = `qr-asistencia-${selectedClass.id}.png`
      link.href = qrDataUrl
      link.click()
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
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Presentes: {cl._count?.attendances ?? 0}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button onClick={() => openQrDialog(cl)} variant="outline" size="sm">
                                <QrCode className="h-4 w-4 mr-1" />
                                QR
                              </Button>
                              <Input
                                type="email"
                                placeholder="email del alumno"
                                value={emailMap[cl.id] || ""}
                                onChange={(e) => setEmailMap((m) => ({ ...m, [cl.id]: e.target.value }))}
                                className="w-64"
                              />
                              <Button onClick={() => checkIn(cl.id)} disabled={!!checkingMap[cl.id]} variant="outline">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {checkingMap[cl.id] ? "Registrando…" : "Check-in Manual"}
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

      {/* QR Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR de Asistencia
            </DialogTitle>
            <DialogDescription>
              {selectedClass?.title || "Clase"} - Los alumnos pueden escanear este código para registrar su asistencia.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrLoading ? (
              <div className="w-[300px] h-[300px] flex items-center justify-center bg-muted rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : qrDataUrl ? (
              <div className="p-4 bg-white rounded-lg">
                <img src={qrDataUrl} alt="QR Code" className="w-[250px] h-[250px]" />
              </div>
            ) : (
              <div className="w-[300px] h-[300px] flex items-center justify-center bg-muted rounded-lg text-muted-foreground">
                Error al generar QR
              </div>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              Este QR es válido solo para hoy y expira a medianoche.
            </p>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyQrUrl} disabled={!qrUrl}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar URL
              </Button>
              <Button variant="outline" onClick={downloadQr} disabled={!qrDataUrl}>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}