"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Target, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function NewTrainingPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    duration: 90,
    location: "",
    focus: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.date || !formData.location) {
      toast.error("Por favor completa los campos requeridos")
      return
    }

    setLoading(true)

    try {
      // Convert date to ISO string
      const dateISO = new Date(formData.date).toISOString()

      const response = await fetch("/api/club/training-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateISO,
          startTime: formData.startTime || undefined,
          endTime: formData.endTime || undefined,
          duration: formData.duration,
          location: formData.location,
          focus: formData.focus || undefined,
          notes: formData.notes || undefined,
        }),
      })

      if (response.ok) {
        toast.success("Entrenamiento creado exitosamente")
        router.push(`/${params.orgSlug}/club/trainings`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear entrenamiento")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al crear entrenamiento")
    } finally {
      setLoading(false)
    }
  }

  const focusOptions = [
    "Técnica Individual",
    "Táctica Colectiva",
    "Preparación Física",
    "Estrategia de Juego",
    "Jugadas a Balón Parado",
    "Definición",
    "Posesión",
    "Transiciones",
    "Defensa",
    "Otro",
  ]

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Nuevo Entrenamiento</h1>
        <p className="text-muted-foreground">
          Programa una nueva sesión de entrenamiento
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Entrenamiento</CardTitle>
            <CardDescription>
              Completa la información de la sesión
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hora Inicio
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hora Fin
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="300"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Entre 15 y 300 minutos
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación *
              </Label>
              <Input
                id="location"
                placeholder="Ej: Cancha Principal, Gimnasio"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            {/* Focus */}
            <div className="space-y-2">
              <Label htmlFor="focus" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Enfoque del Entrenamiento
              </Label>
              <Select
                value={formData.focus}
                onValueChange={(value) => setFormData({ ...formData, focus: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el enfoque" />
                </SelectTrigger>
                <SelectContent>
                  {focusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas / Objetivos</Label>
              <Textarea
                id="notes"
                placeholder="Describe los objetivos o ejercicios planificados..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creando..." : "Crear Entrenamiento"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
