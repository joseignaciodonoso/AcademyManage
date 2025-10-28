"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar, Plus, Clock, MapPin, Users, Activity, Filter } from "lucide-react"
import { toast } from "sonner"

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

  // Filter schedules based on current filters
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      if (filter.weekday !== "ALL" && schedule.dayOfWeek !== filter.weekday) return false
      if (filter.active !== "ALL" && schedule.isActive.toString() !== filter.active) return false
      return true
    })
  }, [schedules, filter])

  async function createSchedule() {
    try {
      setLoading(true)
      const res = await fetch("/api/club/training-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: form.dayOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location,
          type: form.type || undefined,
          category: form.category || undefined,
          isActive: form.isActive,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        toast.error(e.error || "No se pudo crear el horario")
        return
      }
      setCreateOpen(false)
      toast.success("Horario creado")
      await loadSchedules()
      // Reset form
      setForm({
        dayOfWeek: 1,
        startTime: "18:00",
        endTime: "20:00",
        location: "Gimnasio Principal",
        type: "TECHNICAL",
        category: "",
        isActive: true,
      })
    } finally {
      setLoading(false)
    }
  }

  async function toggleSchedule(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/club/training-schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        toast.error(e.error || "No se pudo actualizar el horario")
        return
      }
      toast.success("Horario actualizado")
      await loadSchedules()
    } catch (error) {
      toast.error("Error al actualizar horario")
    }
  }

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Entrenamientos</h1>
            <p className="text-muted-foreground">Gestiona horarios y asistencia de entrenamientos</p>
          </div>
        </div>

        {/* Actions and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter.active === "ALL" ? "default" : "outline"}
              onClick={() => setFilter(f => ({ ...f, active: "ALL" }))}
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Todos
            </Button>
            <Button 
              variant={filter.active === "true" ? "default" : "outline"}
              onClick={() => setFilter(f => ({ ...f, active: "true" }))}
              size="sm"
            >
              Activos
            </Button>
            <Button 
              variant={filter.active === "false" ? "default" : "outline"}
              onClick={() => setFilter(f => ({ ...f, active: "false" }))}
              size="sm"
            >
              Inactivos
            </Button>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-primary to-accent">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Horario
          </Button>
        </div>

        {/* Schedules Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Cargando horarios...</span>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">No hay horarios</h3>
              <p className="text-muted-foreground mb-4">
                {filter.active !== "ALL" || filter.weekday !== "ALL" 
                  ? "No se encontraron horarios con los filtros aplicados"
                  : "Crea tu primer horario de entrenamiento"
                }
              </p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Horario
              </Button>
            </div>
          ) : (
            filteredSchedules.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {weekdayLabels[schedule.dayOfWeek]}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {schedule.startTime} - {schedule.endTime}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={schedule.isActive}
                      onCheckedChange={(checked) => toggleSchedule(schedule.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {schedule.location}
                  </div>
                  
                  {schedule.type && (
                    <Badge variant="secondary" className="text-xs">
                      {schedule.type}
                    </Badge>
                  )}
                  
                  {schedule.category && (
                    <div className="text-sm text-muted-foreground">
                      Categoría: {schedule.category}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <Badge 
                      variant={schedule.isActive ? "default" : "secondary"}
                      className={schedule.isActive ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : ""}
                    >
                      {schedule.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Schedule Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nuevo Horario de Entrenamiento
              </DialogTitle>
              <DialogDescription>
                Configura un nuevo horario semanal recurrente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Día de la semana</Label>
                <Select value={form.dayOfWeek.toString()} onValueChange={(v) => setForm(f => ({ ...f, dayOfWeek: Number(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(weekdayLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm(f => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm(f => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Ubicación</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Gimnasio Principal"
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="grid gap-2">
                <Label>Tipo de entrenamiento</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TECHNICAL">Técnico</SelectItem>
                    <SelectItem value="PHYSICAL">Físico</SelectItem>
                    <SelectItem value="TACTICAL">Táctico</SelectItem>
                    <SelectItem value="MIXED">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Categoría (opcional)</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="Sub-15, Primera División, etc."
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm(f => ({ ...f, isActive: checked }))}
                />
                <Label>Horario activo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createSchedule} disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Creando...
                  </div>
                ) : (
                  'Crear Horario'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Attendance Modal */}
        <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Asistencia al Entrenamiento
              </DialogTitle>
            </DialogHeader>
            
            {attendanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Cargando asistencia...</span>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
                <p className="text-muted-foreground">No hay registros de asistencia</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{record.player?.name}</div>
                      <div className="text-sm text-muted-foreground">{record.player?.playerProfile?.position}</div>
                    </div>
                    <Badge 
                      variant={record.status === 'PRESENT' ? 'default' : record.status === 'JUSTIFIED' ? 'secondary' : 'destructive'}
                    >
                      {record.status === 'PRESENT' ? 'Presente' : record.status === 'JUSTIFIED' ? 'Justificado' : 'Ausente'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
