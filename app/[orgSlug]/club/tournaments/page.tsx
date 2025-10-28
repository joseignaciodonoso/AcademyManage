"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trophy, Plus, Calendar, Users, Upload, FileText, X } from "lucide-react"
import { toast } from "sonner"

export default function TournamentsPage() {
  const router = useRouter()
  const params = useParams() as { orgSlug: string }
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    season: new Date().getFullYear().toString(),
    type: "APERTURA",
    customType: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    rules: "",
  })
  const [rulesFiles, setRulesFiles] = useState<File[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/club/tournaments")
      if (!res.ok) throw new Error("Error")
      const data = await res.json()
      setTournaments(data.tournaments)
    } catch (error) {
      toast.error("Error al cargar torneos")
    } finally {
      setLoading(false)
    }
  }

  const createTournament = async () => {
    try {
      // Validación: si el tipo es OTHER, customType es requerido
      if (form.type === "OTHER" && !form.customType.trim()) {
        toast.error("Debes especificar el nombre del torneo personalizado")
        return
      }

      setUploadingFile(true)
      
      const rulesFileUrls: string[] = []
      
      // Upload múltiples PDF files if selected
      if (rulesFiles.length > 0) {
        for (const file of rulesFiles) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("type", "tournament-rules")
          
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })
          
          if (!uploadRes.ok) {
            throw new Error(`Error al subir el archivo ${file.name}`)
          }
          
          const uploadData = await uploadRes.json()
          rulesFileUrls.push(uploadData.url)
        }
        toast.success(`${rulesFileUrls.length} archivo(s) subido(s) exitosamente`)
      }
      
      // Create tournament with PDF URLs
      const tournamentData = {
        ...form,
        rulesFileUrls: rulesFileUrls.length > 0 ? rulesFileUrls : undefined,
        customType: form.type === "OTHER" ? form.customType : undefined
      }
      
      const res = await fetch("/api/club/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tournamentData),
      })
      
      if (!res.ok) throw new Error("Error al crear torneo")
      
      toast.success("Torneo creado exitosamente")
      setOpenDialog(false)
      fetchTournaments()
      
      // Reset form
      setForm({
        name: "",
        description: "",
        season: new Date().getFullYear().toString(),
        type: "APERTURA",
        customType: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        rules: "",
      })
      setRulesFiles([])
      
    } catch (error) {
      console.error("Error creating tournament:", error)
      toast.error(error instanceof Error ? error.message : "Error al crear torneo")
    } finally {
      setUploadingFile(false)
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: any = {
      APERTURA: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      CLAUSURA: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
      LIGA_LARGA: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
      CUP: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      FRIENDLY: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      PLAYOFF: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
    }
    const labels: any = {
      APERTURA: "Liga Apertura",
      CLAUSURA: "Liga Clausura",
      LIGA_LARGA: "Liga Larga",
      CUP: "Copa",
      FRIENDLY: "Amistoso",
      PLAYOFF: "Playoff",
      OTHER: "Otro",
    }
    return <Badge className={colors[type] || colors.OTHER}>{labels[type] || type}</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700">Activo</Badge>
      case "FINISHED":
        return <Badge className="bg-gray-100 text-gray-700">Finalizado</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Torneos y Ligas</h1>
            <p className="text-foreground/70">Gestiona competiciones y estadísticas</p>
          </div>
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Torneo
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : tournaments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-foreground/40" />
              <h3 className="text-lg font-semibold mb-2">No hay torneos</h3>
              <p className="text-foreground/60 mb-4">Crea tu primer torneo para empezar</p>
              <Button onClick={() => setOpenDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Torneo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => router.push(`/${params.orgSlug}/club/tournaments/${tournament.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Trophy className="h-8 w-8 text-primary" />
                    <div className="flex gap-2">
                      {getTypeBadge(tournament.type)}
                      {getStatusBadge(tournament.status)}
                    </div>
                  </div>
                  <CardTitle>{tournament.name}</CardTitle>
                  <CardDescription>Temporada {tournament.season}</CardDescription>
                </CardHeader>
                <CardContent>
                  {tournament.description && (
                    <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                      {tournament.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground/60">
                      <Calendar className="h-4 w-4" />
                      {new Date(tournament.startDate).toLocaleDateString('es-CL')}
                      {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString('es-CL')}`}
                    </div>
                    <div className="flex items-center gap-2 text-foreground/60">
                      <Users className="h-4 w-4" />
                      {tournament._count?.matches || 0} partidos
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:w-[min(90vw,800px)] w-screen p-0 overflow-hidden sm:rounded-xl rounded-none sm:h-auto h-[100dvh] sm:shadow-2xl sm:max-w-[800px]">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
              <DialogHeader className="px-6 py-5">
                <DialogTitle className="text-xl font-bold">Crear Nuevo Torneo</DialogTitle>
                <DialogDescription className="text-base">
                  Configura un nuevo torneo o liga para tu equipo
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 pb-6 space-y-4 overflow-y-auto sm:max-h-[80vh] max-h-[calc(100dvh-80px)]">
              <div className="grid gap-2">
                <Label>Nombre del Torneo *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Liga Nacional 2025"
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="grid gap-2">
                <Label>Descripción</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción del torneo..."
                  rows={3}
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Temporada *</Label>
                  <Input
                    value={form.season}
                    onChange={(e) => setForm({ ...form, season: e.target.value })}
                    placeholder="2025"
                    className="placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Tipo *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APERTURA">Liga Apertura</SelectItem>
                      <SelectItem value="CLAUSURA">Liga Clausura</SelectItem>
                      <SelectItem value="LIGA_LARGA">Liga Larga</SelectItem>
                      <SelectItem value="CUP">Copa</SelectItem>
                      <SelectItem value="FRIENDLY">Amistoso</SelectItem>
                      <SelectItem value="PLAYOFF">Playoff</SelectItem>
                      <SelectItem value="OTHER">Otro (personalizado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Type Input - Solo visible cuando type = OTHER */}
              {form.type === "OTHER" && (
                <div className="grid gap-2">
                  <Label>Nombre del Torneo Personalizado *</Label>
                  <Input
                    value={form.customType}
                    onChange={(e) => setForm({ ...form, customType: e.target.value })}
                    placeholder="Ej: Copa de Verano, Torneo Regional..."
                    required={form.type === "OTHER"}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Reglas y Bases</Label>
                <Textarea
                  value={form.rules}
                  onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  placeholder="Reglas específicas del torneo..."
                  rows={3}
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              {/* PDF Upload Section - Múltiples Archivos */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Bases del Torneo (PDF) - Puedes subir múltiples archivos
                </Label>
                <div className="space-y-3">
                  {/* File Input */}
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        const validFiles: File[] = []
                        
                        for (const file of files) {
                          if (file.type !== 'application/pdf') {
                            toast.error(`${file.name}: Solo se permiten archivos PDF`)
                            continue
                          }
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error(`${file.name}: El archivo no puede superar los 10MB`)
                            continue
                          }
                          validFiles.push(file)
                        }
                        
                        if (validFiles.length > 0) {
                          setRulesFiles(prev => [...prev, ...validFiles])
                          toast.success(`${validFiles.length} archivo(s) agregado(s)`)
                        }
                        // Reset input
                        e.target.value = ''
                      }}
                      className="hidden"
                      id="rules-file-input"
                    />
                    <label
                      htmlFor="rules-file-input"
                      className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Subir archivos PDF</p>
                        <p className="text-xs text-muted-foreground">Máximo 10MB por archivo - Múltiples archivos permitidos</p>
                      </div>
                    </label>
                  </div>

                  {/* Selected Files Display */}
                  {rulesFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{rulesFiles.length} archivo(s) seleccionado(s):</p>
                      {rulesFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                              <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRulesFiles(prev => prev.filter((_, i) => i !== index))}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t px-6 py-4">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={createTournament} 
                  disabled={!form.name || !form.season || uploadingFile}
                  className="min-w-[120px]"
                >
                  {uploadingFile ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Creando...
                    </div>
                  ) : (
                    'Crear Torneo'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
