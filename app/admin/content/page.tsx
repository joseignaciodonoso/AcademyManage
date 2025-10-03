"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  Search,
  Video,
  Megaphone,
  FileText,
  Link as LinkIcon,
  Folder,
  Plus,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react"

// --- Types (MVP mock) ---
interface CoachPerm {
  id: string
  name: string
  email: string
  canVideo: boolean
  canAnnouncement: boolean
  canDoc: boolean
  canLink: boolean
  requireApproval: boolean
}

interface ContentItem {
  id: string
  title: string
  type: "VIDEO" | "ANNOUNCEMENT" | "DOC" | "LINK"
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED"
  author: string
  channel: string
  createdAt: string
}

interface ChannelItem {
  id: string
  name: string
  slug: string
  visibility: "PUBLIC" | "STUDENTS" | "COACHES"
  description?: string
}

export default function AdminContentPage() {
  // --- Mock state (replace with API later) ---
  const [activeTab, setActiveTab] = useState<string>("permissions")
  const [query, setQuery] = useState("")

  const [coaches, setCoaches] = useState<CoachPerm[]>([
    { id: "c1", name: "Juan Pérez", email: "juan@academy.com", canVideo: true, canAnnouncement: true, canDoc: false, canLink: true, requireApproval: true },
    { id: "c2", name: "María Rojas", email: "maria@academy.com", canVideo: false, canAnnouncement: true, canDoc: true, canLink: true, requireApproval: false },
    { id: "c3", name: "Luis Soto", email: "luis@academy.com", canVideo: true, canAnnouncement: false, canDoc: true, canLink: false, requireApproval: true },
  ])
  const [loadingPerms, setLoadingPerms] = useState(false)

  const [library, setLibrary] = useState<ContentItem[]>([
    { id: "cnt1", title: "Drills de guardia", type: "VIDEO", status: "PUBLISHED", author: "Juan Pérez", channel: "BJJ Tips", createdAt: "2025-09-10" },
    { id: "cnt2", title: "Torneo interno - anuncio", type: "ANNOUNCEMENT", status: "PENDING", author: "María Rojas", channel: "Noticias", createdAt: "2025-09-12" },
    { id: "cnt3", title: "Planilla de estiramientos", type: "DOC", status: "DRAFT", author: "Luis Soto", channel: "Recursos", createdAt: "2025-09-14" },
  ])

  const [pending, setPending] = useState<ContentItem[]>([
    { id: "p1", title: "Pasadas de guardia avanzadas", type: "VIDEO", status: "PENDING", author: "Juan Pérez", channel: "BJJ Tips", createdAt: "2025-09-13" },
  ])

  const [channels, setChannels] = useState<ChannelItem[]>([
    { id: "ch1", name: "BJJ Tips", slug: "bjj-tips", visibility: "STUDENTS", description: "Consejos y técnicas BJJ" },
    { id: "ch2", name: "Noticias", slug: "news", visibility: "PUBLIC", description: "Anuncios y novedades de la academia" },
    { id: "ch3", name: "Recursos", slug: "resources", visibility: "STUDENTS", description: "Documentos y material de apoyo" },
  ])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [newChannel, setNewChannel] = useState<{name: string; slug: string; visibility: "PUBLIC" | "STUDENTS" | "COACHES"}>({ name: "", slug: "", visibility: "STUDENTS" })
  const [creating, setCreating] = useState(false)

  const [settings, setSettings] = useState({ requireApprovalByDefault: true, maxUploadMB: 500, monthlyQuota: 30 })

  // --- Derived ---
  const filteredCoaches = useMemo(
    () => coaches.filter(c => `${c.name} ${c.email}`.toLowerCase().includes(query.toLowerCase())),
    [coaches, query]
  )

  const [libType, setLibType] = useState<string>("ALL")
  const [libStatus, setLibStatus] = useState<string>("ALL")
  const filteredLibrary = useMemo(() =>
    library.filter(item =>
      (libType === "ALL" || item.type === libType) &&
      (libStatus === "ALL" || item.status === libStatus)
    ), [library, libType, libStatus]
  )

  // --- Handlers (mock) ---
  const toggleCoach = async (id: string, key: keyof CoachPerm) => {
    // optimistic update
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, [key]: !c[key] as any } : c))
    try {
      const coach = coaches.find(c => c.id === id)
      const next = coach ? !coach[key] : true
      await fetch("/api/admin/content-permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId: id, updates: { [key]: next } }),
      })
    } catch (e) {
      // revert on error
      setCoaches(prev => prev.map(c => c.id === id ? { ...c, [key]: !c[key] as any } : c))
      console.error("Error updating permission", e)
    }
  }

  const handleCreateChannel = async () => {
    if (!newChannel.name || !newChannel.slug) return
    try {
      setCreating(true)
      const res = await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChannel),
      })
      if (res.ok) {
        const created = await res.json()
        setChannels(prev => [created, ...prev])
        setNewChannel({ name: "", slug: "", visibility: "STUDENTS" })
        setOpenCreate(false)
      }
    } catch (e) {
      console.error("Error creating channel", e)
    } finally {
      setCreating(false)
    }
  }

  // --- Effects (load from API) ---
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingPerms(true)
        const res = await fetch("/api/admin/content-permissions")
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.coaches)) setCoaches(data.coaches)
        }
      } catch (e) {
        console.error("Error loading content permissions", e)
      } finally {
        setLoadingPerms(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingChannels(true)
        const res = await fetch("/api/admin/channels")
        if (res.ok) {
          const data = await res.json()
          if (mounted && Array.isArray(data.channels)) setChannels(data.channels)
        }
      } catch (e) {
        console.error("Error loading channels", e)
      } finally {
        setLoadingChannels(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const approveItem = (id: string) => {
    setPending(prev => prev.filter(p => p.id !== id))
    setLibrary(prev => prev.map(i => i.id === id ? { ...i, status: "PUBLISHED" } : i))
  }

  const rejectItem = (id: string) => {
    setPending(prev => prev.filter(p => p.id !== id))
    setLibrary(prev => prev.map(i => i.id === id ? { ...i, status: "DRAFT" } : i))
  }

  // --- UI ---
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-20" />
      <div className="absolute top-10 -left-24 w-72 h-72 bg-blue-500 rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float" />
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000" />

      <div className="relative z-10 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Contenido</h1>
            <p className="text-gray-400">Define permisos, modera publicaciones y organiza la biblioteca</p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all">Nueva publicación</Button>
        </header>

        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardHeader>
            <CardTitle>Centro de Contenido</CardTitle>
            <CardDescription className="text-gray-400">Configura y administra el contenido de tu academia</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-gray-800/50 border border-gray-700">
                <TabsTrigger value="permissions">Permisos</TabsTrigger>
                <TabsTrigger value="library">Biblioteca</TabsTrigger>
                <TabsTrigger value="moderation">Moderación</TabsTrigger>
                <TabsTrigger value="channels">Canales</TabsTrigger>
                <TabsTrigger value="settings">Configuración</TabsTrigger>
              </TabsList>

              {/* Permisos */}
              <TabsContent value="permissions" className="mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input placeholder="Buscar coach..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm bg-gray-800/50 border-gray-700 text-white" />
                </div>
                <div className="rounded-xl border border-gray-700/50 overflow-hidden bg-gray-800/30">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-800/50">
                        <TableHead>Coach</TableHead>
                        <TableHead className="text-center"><span className="inline-flex items-center gap-1"><Video className="h-4 w-4" />Video</span></TableHead>
                        <TableHead className="text-center"><span className="inline-flex items-center gap-1"><Megaphone className="h-4 w-4" />Anuncio</span></TableHead>
                        <TableHead className="text-center"><span className="inline-flex items-center gap-1"><FileText className="h-4 w-4" />Documento</span></TableHead>
                        <TableHead className="text-center"><span className="inline-flex items-center gap-1"><LinkIcon className="h-4 w-4" />Link</span></TableHead>
                        <TableHead className="text-center">Requiere aprobación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCoaches.map((c) => (
                        <TableRow key={c.id} className="hover:bg-gray-800/30">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-white">{c.name}</div>
                              <div className="text-sm text-gray-400">{c.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center"><Switch checked={c.canVideo} onCheckedChange={() => toggleCoach(c.id, "canVideo")} /></TableCell>
                          <TableCell className="text-center"><Switch checked={c.canAnnouncement} onCheckedChange={() => toggleCoach(c.id, "canAnnouncement")} /></TableCell>
                          <TableCell className="text-center"><Switch checked={c.canDoc} onCheckedChange={() => toggleCoach(c.id, "canDoc")} /></TableCell>
                          <TableCell className="text-center"><Switch checked={c.canLink} onCheckedChange={() => toggleCoach(c.id, "canLink")} /></TableCell>
                          <TableCell className="text-center"><Switch checked={c.requireApproval} onCheckedChange={() => toggleCoach(c.id, "requireApproval")} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Biblioteca */}
              <TabsContent value="library" className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar contenido..." className="bg-gray-800/50 border-gray-700 text-white" />
                  </div>
                  <Select value={libType} onValueChange={setLibType}>
                    <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">Anuncio</SelectItem>
                      <SelectItem value="DOC">Documento</SelectItem>
                      <SelectItem value="LINK">Link</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={libStatus} onValueChange={setLibStatus}>
                    <SelectTrigger className="w-44 bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="DRAFT">Borrador</SelectItem>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="PUBLISHED">Publicado</SelectItem>
                      <SelectItem value="ARCHIVED">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLibrary.map((item) => (
                    <Card key={item.id} className="border-gray-700/50 bg-gray-800/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white text-base truncate">{item.title}</CardTitle>
                          <Badge className={
                            item.status === "PUBLISHED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                            item.status === "PENDING" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                            item.status === "DRAFT" ? "bg-gray-500/20 text-gray-300 border-gray-500/30" :
                            "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          }>
                            {item.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-400 mt-1">
                          {item.type} · {item.channel} · {item.author}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between pt-0">
                        <div className="text-sm text-gray-400">{new Date(item.createdAt).toLocaleDateString("es-CL")}</div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white">Editar</Button>
                          <Button variant="outline" size="sm" className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white">Mover</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Moderación */}
              <TabsContent value="moderation" className="mt-4">
                <div className="rounded-xl border border-gray-700/50 overflow-hidden bg-gray-800/30">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-800/50">
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Autor</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-gray-400">No hay contenidos pendientes de aprobación.</TableCell>
                        </TableRow>
                      ) : (
                        pending.map((p) => (
                          <TableRow key={p.id} className="hover:bg-gray-800/30">
                            <TableCell className="text-white">{p.title}</TableCell>
                            <TableCell>{p.type}</TableCell>
                            <TableCell>{p.author}</TableCell>
                            <TableCell>{p.channel}</TableCell>
                            <TableCell>{new Date(p.createdAt).toLocaleDateString("es-CL")}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="h-4 w-4 mr-1" /> Aprobar</Button>
                              <Button size="sm" variant="outline" className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-red-600 hover:text-white" onClick={() => rejectItem(p.id)}><XCircle className="h-4 w-4 mr-1" /> Rechazar</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Canales */}
              <TabsContent value="channels" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-gray-400">Organiza el contenido por canales temáticos</div>
                  <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                    <DialogTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-1" /> Nuevo canal</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Crear canal</DialogTitle>
                        <DialogDescription className="text-gray-400">Define el nombre, slug y visibilidad</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-3 py-2">
                        <Input placeholder="Nombre" value={newChannel.name} onChange={(e) => setNewChannel(n => ({ ...n, name: e.target.value }))} className="bg-gray-700 border-gray-600" />
                        <Input placeholder="Slug" value={newChannel.slug} onChange={(e) => setNewChannel(n => ({ ...n, slug: e.target.value }))} className="bg-gray-700 border-gray-600" />
                        <Select value={newChannel.visibility} onValueChange={(v: any) => setNewChannel(n => ({ ...n, visibility: v }))}>
                          <SelectTrigger className="bg-gray-700 border-gray-600">
                            <SelectValue placeholder="Visibilidad" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="PUBLIC">Pública</SelectItem>
                            <SelectItem value="STUDENTS">Solo estudiantes</SelectItem>
                            <SelectItem value="COACHES">Solo coaches</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateChannel} disabled={creating || !newChannel.name || !newChannel.slug} className="bg-indigo-600 hover:bg-indigo-700">
                          {creating ? "Creando..." : "Crear"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="rounded-xl border border-gray-700/50 overflow-hidden bg-gray-800/30">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-800/50">
                        <TableHead><span className="inline-flex items-center gap-1"><Folder className="h-4 w-4" /> Canal</span></TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Visibilidad</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channels.map((ch) => (
                        <TableRow key={ch.id} className="hover:bg-gray-800/30">
                          <TableCell className="text-white">{ch.name}</TableCell>
                          <TableCell>{ch.slug}</TableCell>
                          <TableCell>
                            <Badge className={
                              ch.visibility === "PUBLIC" ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" :
                              ch.visibility === "STUDENTS" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                              "bg-gray-500/20 text-gray-300 border-gray-500/30"
                            }>{ch.visibility}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">{ch.description || "-"}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white">Editar</Button>
                            <Button variant="outline" size="sm" className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-red-600 hover:text-white">Eliminar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Configuración */}
              <TabsContent value="settings" className="mt-4 space-y-6">
                <Card className="border-gray-700/50 bg-gray-800/30">
                  <CardHeader>
                    <CardTitle className="inline-flex items-center gap-2"><Settings className="h-5 w-5" /> Políticas de publicación</CardTitle>
                    <CardDescription className="text-gray-400">Ajustes globales para coaches y moderación</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">Requerir aprobación por defecto</div>
                        <div className="text-sm text-gray-400">Si está activo, todo nuevo contenido pasa por moderación</div>
                      </div>
                      <Switch checked={settings.requireApprovalByDefault} onCheckedChange={(v) => setSettings(s => ({ ...s, requireApprovalByDefault: v }))} />
                    </div>
                    <Separator className="bg-gray-700/50" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Tamaño máximo por archivo (MB)</div>
                        <Input type="number" value={settings.maxUploadMB} onChange={(e) => setSettings(s => ({ ...s, maxUploadMB: Number(e.target.value) }))} className="bg-gray-800/50 border-gray-700 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Cuota mensual por coach (ítems)</div>
                        <Input type="number" value={settings.monthlyQuota} onChange={(e) => setSettings(s => ({ ...s, monthlyQuota: Number(e.target.value) }))} className="bg-gray-800/50 border-gray-700 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Mini-analytics (placeholder) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription className="text-gray-400">Últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">{library.length}</div>
                <div className="text-xs text-gray-400">Contenidos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{pending.length}</div>
                <div className="text-xs text-gray-400">Pendientes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{coaches.filter(c => c.canVideo || c.canAnnouncement || c.canDoc || c.canLink).length}</div>
                <div className="text-xs text-gray-400">Coaches habilitados</div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden lg:col-span-2">
            <CardHeader>
              <CardTitle>Capacidad de publicación</CardTitle>
              <CardDescription className="text-gray-400">Uso aproximado de cuotas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coaches.slice(0, 5).map((c) => {
                  const used = Math.min(100, Math.round((Math.random() * 0.9 + 0.1) * 100)) // placeholder
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-300">{c.name}</span>
                        <span className="text-gray-400">{used}%</span>
                      </div>
                      <Progress value={used} className="h-2 bg-gray-700/50" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
