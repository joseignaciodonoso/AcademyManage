"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Search,
  Video,
  Youtube,
  FileText,
  FolderOpen,
  GraduationCap,
  Clock,
  Calendar,
  ChevronRight,
  PlayCircle,
  BookOpen,
  ExternalLink,
  X
} from "lucide-react"

interface Module {
  id: string
  name: string
  description: string | null
  _count?: { contents: number }
  contents?: Content[]
}

interface Content {
  id: string
  title: string
  description: string | null
  type: "VIDEO" | "YOUTUBE" | "DOCUMENT" | "IMAGE" | "AUDIO"
  fileUrl: string
  thumbnailUrl: string | null
  duration: number | null
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

export default function StudentContentPage() {
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/student/content/modules")
      if (res.ok) {
        const data = await res.json()
        setModules(data.modules || [])
        // Auto-select first module if available
        if (data.modules?.length > 0 && !selectedModule) {
          fetchModuleContents(data.modules[0].id)
        }
      }
    } catch (e) {
      console.error("Error fetching modules:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchModuleContents = useCallback(async (moduleId: string) => {
    try {
      const res = await fetch(`/api/student/content/modules/${moduleId}`)
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

  const openContent = (content: Content) => {
    if (content.type === "DOCUMENT") {
      window.open(content.fileUrl, "_blank")
    } else {
      setSelectedContent(content)
    }
  }

  return (
    <div className="min-h-screen w-full bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Material de Estudio</h1>
              <p className="text-muted-foreground">Videos y recursos para complementar tu entrenamiento</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar contenido..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Modules Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Módulos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : filteredModules.length === 0 ? (
                  <div className="p-6 text-center">
                    <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay módulos disponibles
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y divide-border">
                      {filteredModules.map((module) => (
                        <button 
                          key={module.id}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                            selectedModule?.id === module.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                          }`}
                          onClick={() => fetchModuleContents(module.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{module.name}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {module._count?.contents || 0} videos
                              </p>
                            </div>
                            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                              selectedModule?.id === module.id ? "rotate-90" : ""
                            }`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="lg:col-span-3">
            {!selectedModule ? (
              <Card className="h-full min-h-[400px] flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="p-4 rounded-full bg-muted/50 inline-block">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-muted-foreground">
                    Selecciona un módulo para ver su contenido
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedModule.name}</h2>
                  {selectedModule.description && (
                    <p className="text-muted-foreground mt-1">{selectedModule.description}</p>
                  )}
                </div>

                {!selectedModule.contents?.length ? (
                  <Card className="p-8 text-center">
                    <Video className="h-10 w-10 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">
                      Este módulo aún no tiene contenido
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedModule.contents.map((content) => (
                      <Card 
                        key={content.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => openContent(content)}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-muted">
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
                          
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="p-3 rounded-full bg-white/90">
                              <PlayCircle className="h-8 w-8 text-primary" />
                            </div>
                          </div>
                          
                          {/* Duration badge */}
                          {content.duration && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium">
                              {formatDuration(content.duration)}
                            </div>
                          )}
                          
                          {/* Type badge */}
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="bg-black/50 text-white border-0">
                              {content.type === "YOUTUBE" ? "YouTube" : content.type}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {content.title}
                          </h3>
                          {content.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {content.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(content.createdAt).toLocaleDateString("es-CL")}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-8">
                <DialogTitle className="text-xl">{selectedContent?.title}</DialogTitle>
                {selectedContent?.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedContent.description}</p>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-4">
            {selectedContent?.type === "YOUTUBE" && getYouTubeId(selectedContent.fileUrl) ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(selectedContent.fileUrl)}?autoplay=1`}
                  title={selectedContent.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : selectedContent?.type === "VIDEO" ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  src={selectedContent.fileUrl}
                  controls
                  autoPlay
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <Button onClick={() => window.open(selectedContent?.fileUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir contenido
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
