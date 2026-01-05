"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search,
  Video,
  Youtube,
  FileText,
  FolderOpen,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
  Clock,
  Calendar,
  ChevronRight,
  Upload,
  Link as LinkIcon,
  PlayCircle,
  BookOpen,
  Sparkles,
  FolderPlus,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

interface Module {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: "PUBLIC" | "STUDENTS" | "COACHES"
  order: number
  _count?: { contents: number }
  contents?: Content[]
  createdAt: string
}

interface Content {
  id: string
  title: string
  description: string | null
  type: "VIDEO" | "YOUTUBE" | "DOCUMENT" | "IMAGE" | "AUDIO"
  fileUrl: string
  thumbnailUrl: string | null
  duration: number | null
  visibility: "PUBLIC" | "PLAN_RESTRICTED" | "LEVEL_RESTRICTED" | "PRIVATE"
  channelId: string | null
  createdAt: string
}

const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return ""
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function AdminContentPage() {
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Module dialog state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleForm, setModuleForm] = useState({
    name: "",
    description: "",
    visibility: "STUDENTS" as "PUBLIC" | "STUDENTS" | "COACHES"
  })
  const [savingModule, setSavingModule] = useState(false)

  // Content dialog state
  const [contentDialogOpen, setContentDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [contentForm, setContentForm] = useState({
    title: "",
    description: "",
    type: "YOUTUBE" as "VIDEO" | "YOUTUBE" | "DOCUMENT",
    fileUrl: "",
    duration: ""
  })
  const [savingContent, setSavingContent] = useState(false)

  // Fetch modules
  const fetchModules = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/content/modules")
      if (res.ok) {
        const data = await res.json()
        setModules(data.modules || [])
      }
    } catch (e) {
      console.error("Error fetching modules:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch module contents
  const fetchModuleContents = useCallback(async (moduleId: string) => {
    try {
      const res = await fetch(`/api/admin/content/modules/${moduleId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedModule(data.module)
      }
    } catch (e) {
      console.error("Error fetching module contents:", e)
    }
  }, [])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  // Module handlers
  const openModuleDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module)
      setModuleForm({
        name: module.name,
        description: module.description || "",
        visibility: module.visibility
      })
    } else {
      setEditingModule(null)
      setModuleForm({ name: "", description: "", visibility: "STUDENTS" })
    }
    setModuleDialogOpen(true)
  }

  const saveModule = async () => {
    if (!moduleForm.name.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    try {
      setSavingModule(true)
      const url = editingModule 
        ? `/api/admin/content/modules/${editingModule.id}`
        : "/api/admin/content/modules"
      
      const res = await fetch(url, {
        method: editingModule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleForm)
      })

      if (res.ok) {
        toast.success(editingModule ? "Módulo actualizado" : "Módulo creado")
        setModuleDialogOpen(false)
        fetchModules()
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al guardar módulo")
      }
    } catch (e) {
      toast.error("Error de conexión")
    } finally {
      setSavingModule(false)
    }
  }

  const deleteModule = async (moduleId: string) => {
    if (!confirm("¿Estás seguro de eliminar este módulo y todo su contenido?")) return

    try {
      const res = await fetch(`/api/admin/content/modules/${moduleId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast.success("Módulo eliminado")
        if (selectedModule?.id === moduleId) {
          setSelectedModule(null)
        }
        fetchModules()
      } else {
        toast.error("Error al eliminar módulo")
      }
    } catch (e) {
      toast.error("Error de conexión")
    }
  }

  // Content handlers
  const openContentDialog = (content?: Content) => {
    if (content) {
      setEditingContent(content)
      setContentForm({
        title: content.title,
        description: content.description || "",
        type: content.type as any,
        fileUrl: content.fileUrl,
        duration: content.duration?.toString() || ""
      })
    } else {
      setEditingContent(null)
      setContentForm({ title: "", description: "", type: "YOUTUBE", fileUrl: "", duration: "" })
    }
    setContentDialogOpen(true)
  }

  const saveContent = async () => {
    if (!contentForm.title.trim() || !contentForm.fileUrl.trim()) {
      toast.error("Título y URL son requeridos")
      return
    }

    if (!selectedModule) {
      toast.error("Selecciona un módulo primero")
      return
    }

    try {
      setSavingContent(true)
      const url = editingContent 
        ? `/api/admin/content/${editingContent.id}`
        : "/api/admin/content"
      
      const res = await fetch(url, {
        method: editingContent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contentForm,
          channelId: selectedModule.id,
          duration: contentForm.duration ? parseInt(contentForm.duration) : null
        })
      })

      if (res.ok) {
        toast.success(editingContent ? "Contenido actualizado" : "Contenido agregado")
        setContentDialogOpen(false)
        fetchModuleContents(selectedModule.id)
        fetchModules()
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al guardar contenido")
      }
    } catch (e) {
      toast.error("Error de conexión")
    } finally {
      setSavingContent(false)
    }
  }

  const deleteContent = async (contentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este contenido?")) return

    try {
      const res = await fetch(`/api/admin/content/${contentId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast.success("Contenido eliminado")
        if (selectedModule) {
          fetchModuleContents(selectedModule.id)
        }
        fetchModules()
      } else {
        toast.error("Error al eliminar contenido")
      }
    } catch (e) {
      toast.error("Error de conexión")
    }
  }

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getContentIcon = (type: string) => {
    switch (type) {
      case "YOUTUBE": return <Youtube className="h-5 w-5 text-red-500" />
      case "VIDEO": return <Video className="h-5 w-5 text-blue-500" />
      case "DOCUMENT": return <FileText className="h-5 w-5 text-amber-500" />
      default: return <PlayCircle className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen w-full bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Contenido Educativo</h1>
              <p className="text-muted-foreground">Gestiona videos y material de estudio para tus alumnos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openModuleDialog()} className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Nuevo Módulo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modules.length}</p>
                  <p className="text-sm text-muted-foreground">Módulos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Youtube className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {modules.reduce((acc, m) => acc + (m._count?.contents || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Eye className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-muted-foreground">Vistas hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-muted-foreground">Nuevo esta semana</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modules List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Módulos
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar módulo..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : filteredModules.length === 0 ? (
                  <div className="p-8 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">
                      {searchQuery ? "No se encontraron módulos" : "Crea tu primer módulo"}
                    </p>
                    {!searchQuery && (
                      <Button variant="outline" className="mt-4" onClick={() => openModuleDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear módulo
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredModules.map((module) => (
                      <div 
                        key={module.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedModule?.id === module.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                        onClick={() => fetchModuleContents(module.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{module.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {module._count?.contents || 0} videos
                              </Badge>
                            </div>
                            {module.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {module.description}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openModuleDialog(module) }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); deleteModule(module.id) }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Module Contents */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                {selectedModule ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedModule.name}</CardTitle>
                      <CardDescription>{selectedModule.description}</CardDescription>
                    </div>
                    <Button onClick={() => openContentDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Contenido
                    </Button>
                  </div>
                ) : (
                  <div>
                    <CardTitle>Contenido del Módulo</CardTitle>
                    <CardDescription>Selecciona un módulo para ver su contenido</CardDescription>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!selectedModule ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-muted/50">
                      <ChevronRight className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-muted-foreground">
                      Selecciona un módulo de la lista para ver y gestionar su contenido
                    </p>
                  </div>
                ) : !selectedModule.contents?.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-muted/50">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-muted-foreground">
                      Este módulo no tiene contenido aún
                    </p>
                    <Button className="mt-4" onClick={() => openContentDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar primer video
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedModule.contents.map((content) => (
                      <div 
                        key={content.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-muted">
                          {content.type === "YOUTUBE" && getYouTubeId(content.fileUrl) ? (
                            <img 
                              src={`https://img.youtube.com/vi/${getYouTubeId(content.fileUrl)}/mqdefault.jpg`}
                              alt={content.title}
                              className="w-full h-full object-cover"
                            />
                          ) : content.thumbnailUrl ? (
                            <img 
                              src={content.thumbnailUrl}
                              alt={content.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getContentIcon(content.type)}
                            </div>
                          )}
                          {content.duration && (
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
                              {formatDuration(content.duration)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium line-clamp-1">{content.title}</h4>
                              {content.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {content.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  {getContentIcon(content.type)}
                                  {content.type === "YOUTUBE" ? "YouTube" : content.type}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(content.createdAt).toLocaleDateString("es-CL")}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(content.fileUrl, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openContentDialog(content)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => deleteContent(content.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Editar Módulo" : "Nuevo Módulo"}</DialogTitle>
            <DialogDescription>
              {editingModule 
                ? "Actualiza la información del módulo" 
                : "Crea un nuevo módulo para organizar tu contenido educativo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="module-name">Nombre del módulo *</Label>
              <Input 
                id="module-name"
                placeholder="Ej: Semana 1 - Berimbolo"
                value={moduleForm.name}
                onChange={(e) => setModuleForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-desc">Descripción</Label>
              <Textarea 
                id="module-desc"
                placeholder="Describe el contenido de este módulo..."
                value={moduleForm.description}
                onChange={(e) => setModuleForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Visibilidad</Label>
              <Select 
                value={moduleForm.visibility} 
                onValueChange={(v: any) => setModuleForm(f => ({ ...f, visibility: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENTS">Solo Alumnos</SelectItem>
                  <SelectItem value="PUBLIC">Público</SelectItem>
                  <SelectItem value="COACHES">Solo Coaches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveModule} disabled={savingModule}>
              {savingModule ? "Guardando..." : editingModule ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Dialog */}
      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContent ? "Editar Contenido" : "Agregar Contenido"}</DialogTitle>
            <DialogDescription>
              {editingContent 
                ? "Actualiza la información del contenido" 
                : "Agrega un video de YouTube o sube un archivo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="content-title">Título *</Label>
              <Input 
                id="content-title"
                placeholder="Ej: Berimbolo desde DLR"
                value={contentForm.title}
                onChange={(e) => setContentForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-desc">Descripción</Label>
              <Textarea 
                id="content-desc"
                placeholder="Describe el contenido del video..."
                value={contentForm.description}
                onChange={(e) => setContentForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de contenido</Label>
              <Select 
                value={contentForm.type} 
                onValueChange={(v: any) => setContentForm(f => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YOUTUBE">
                    <span className="flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-500" />
                      Video de YouTube
                    </span>
                  </SelectItem>
                  <SelectItem value="VIDEO">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-blue-500" />
                      Video (URL directa)
                    </span>
                  </SelectItem>
                  <SelectItem value="DOCUMENT">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-500" />
                      Documento
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-url">
                {contentForm.type === "YOUTUBE" ? "URL de YouTube *" : "URL del archivo *"}
              </Label>
              <Input 
                id="content-url"
                placeholder={contentForm.type === "YOUTUBE" 
                  ? "https://www.youtube.com/watch?v=..."
                  : "https://..."}
                value={contentForm.fileUrl}
                onChange={(e) => setContentForm(f => ({ ...f, fileUrl: e.target.value }))}
              />
              {contentForm.type === "YOUTUBE" && contentForm.fileUrl && getYouTubeId(contentForm.fileUrl) && (
                <div className="mt-2 rounded-lg overflow-hidden">
                  <img 
                    src={`https://img.youtube.com/vi/${getYouTubeId(contentForm.fileUrl)}/mqdefault.jpg`}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>
            {contentForm.type !== "DOCUMENT" && (
              <div className="space-y-2">
                <Label htmlFor="content-duration">Duración (segundos)</Label>
                <Input 
                  id="content-duration"
                  type="number"
                  placeholder="Ej: 300 para 5 minutos"
                  value={contentForm.duration}
                  onChange={(e) => setContentForm(f => ({ ...f, duration: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveContent} disabled={savingContent}>
              {savingContent ? "Guardando..." : editingContent ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
