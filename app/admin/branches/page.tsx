"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Plus, Pencil, Trash2, Copy, Clock, Mail, Phone, MapPin, Building2, Users } from "lucide-react"

interface Branch {
  id: string
  name: string
  address: string
  phone?: string | null
  email?: string | null
  mondayOpen?: string | null
  mondayClose?: string | null
  tuesdayOpen?: string | null
  tuesdayClose?: string | null
  wednesdayOpen?: string | null
  wednesdayClose?: string | null
  thursdayOpen?: string | null
  thursdayClose?: string | null
  fridayOpen?: string | null
  fridayClose?: string | null
  saturdayOpen?: string | null
  saturdayClose?: string | null
  sundayOpen?: string | null
  sundayClose?: string | null
}

interface CoachItem {
  id: string
  name: string
  email: string
  assigned: boolean
}

const dayKeys: Array<{ key: keyof Branch; label: string; open: keyof Branch; close: keyof Branch }> = [
  { key: "mondayOpen", label: "Lunes", open: "mondayOpen", close: "mondayClose" },
  { key: "tuesdayOpen", label: "Martes", open: "tuesdayOpen", close: "tuesdayClose" },
  { key: "wednesdayOpen", label: "Miércoles", open: "wednesdayOpen", close: "wednesdayClose" },
  { key: "thursdayOpen", label: "Jueves", open: "thursdayOpen", close: "thursdayClose" },
  { key: "fridayOpen", label: "Viernes", open: "fridayOpen", close: "fridayClose" },
  { key: "saturdayOpen", label: "Sábado", open: "saturdayOpen", close: "saturdayClose" },
  { key: "sundayOpen", label: "Domingo", open: "sundayOpen", close: "sundayClose" },
]

export default function BranchesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [search, setSearch] = useState("")

  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState<Partial<Branch>>({
    name: "",
    address: "",
  })

  const [deleting, setDeleting] = useState<Branch | null>(null)

  // Assign coaches dialog state
  const [openAssign, setOpenAssign] = useState(false)
  const [assignBranch, setAssignBranch] = useState<Branch | null>(null)
  const [coachItems, setCoachItems] = useState<CoachItem[]>([])
  const [coachSearch, setCoachSearch] = useState("")
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignSaving, setAssignSaving] = useState(false)
  const [selectedCoaches, setSelectedCoaches] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return branches
    return branches.filter((b) =>
      [b.name, b.address, b.email, b.phone].some((v) => (v || "").toLowerCase().includes(q))
    )
  }, [branches, search])

  async function load() {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/branches")
      if (!res.ok) throw new Error("No se pudieron cargar las sedes")
      const data = await res.json()
      setBranches(data.branches || [])
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudieron cargar las sedes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function openAssignDialog(b: Branch) {
    try {
      setAssignBranch(b)
      setOpenAssign(true)
      setAssignLoading(true)
      const res = await fetch(`/api/admin/branches/${b.id}/coaches`)
      if (!res.ok) throw new Error("No se pudieron cargar coaches")
      const data = await res.json()
      const items: CoachItem[] = Array.isArray(data.coaches) ? data.coaches : []
      setCoachItems(items)
      setSelectedCoaches(new Set(items.filter((i) => i.assigned).map((i) => i.id)))
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudieron cargar coaches", variant: "destructive" })
      setOpenAssign(false)
    } finally {
      setAssignLoading(false)
    }
  }

  const filteredCoaches = useMemo(() => {
    const q = coachSearch.trim().toLowerCase()
    if (!q) return coachItems
    return coachItems.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q))
  }, [coachItems, coachSearch])

  function toggleCoach(id: string, checked: boolean) {
    setSelectedCoaches((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function saveAssignments() {
    if (!assignBranch) return
    try {
      setAssignSaving(true)
      const res = await fetch(`/api/admin/branches/${assignBranch.id}/coaches`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachIds: Array.from(selectedCoaches) }),
      })
      if (!res.ok) throw new Error("No se pudieron guardar las asignaciones")
      toast({ title: "Asignaciones guardadas" })
      setOpenAssign(false)
      setAssignBranch(null)
      setCoachItems([])
      setSelectedCoaches(new Set())
      setCoachSearch("")
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudieron guardar las asignaciones", variant: "destructive" })
    } finally {
      setAssignSaving(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetForm(b?: Branch | null) {
    if (b) {
      setForm({ ...b })
    } else {
      setForm({ name: "", address: "", phone: "", email: "" })
    }
  }

  function hoursSummary(b: Branch): string {
    const compact = (open?: string | null, close?: string | null) =>
      open && close ? `${open}–${close}` : "Cerrado"

    const weekdays = [b.mondayOpen, b.tuesdayOpen, b.wednesdayOpen, b.thursdayOpen, b.fridayOpen]
    const weekdaysClose = [b.mondayClose, b.tuesdayClose, b.wednesdayClose, b.thursdayClose, b.fridayClose]
    const sameWeekdays = weekdays.every((v) => v === weekdays[0]) && weekdaysClose.every((v) => v === weekdaysClose[0])

    const lv = compact(b.mondayOpen, b.mondayClose)
    const s = compact(b.saturdayOpen, b.saturdayClose)
    const d = compact(b.sundayOpen, b.sundayClose)

    if (sameWeekdays) {
      return `L–V ${lv} · S ${s} · D ${d}`
    }

    return `L ${compact(b.mondayOpen, b.mondayClose)}, M ${compact(b.tuesdayOpen, b.tuesdayClose)}, X ${compact(b.wednesdayOpen, b.wednesdayClose)}, J ${compact(b.thursdayOpen, b.thursdayClose)}, V ${compact(b.fridayOpen, b.fridayClose)}, S ${s}, D ${d}`
  }

  const handleOpenCreate = () => {
    setEditing(null)
    resetForm(null)
    setOpenDialog(true)
  }

  const handleOpenEdit = (b: Branch) => {
    setEditing(b)
    resetForm(b)
    setOpenDialog(true)
  }

  const copyMonToWeekdays = () => {
    setForm((prev) => ({
      ...prev,
      tuesdayOpen: prev.mondayOpen,
      tuesdayClose: prev.mondayClose,
      wednesdayOpen: prev.mondayOpen,
      wednesdayClose: prev.mondayClose,
      thursdayOpen: prev.mondayOpen,
      thursdayClose: prev.mondayClose,
      fridayOpen: prev.mondayOpen,
      fridayClose: prev.mondayClose,
    }))
  }

  async function saveBranch() {
    try {
      if (!form.name || !form.address) {
        toast({ title: "Faltan datos", description: "Nombre y dirección son obligatorios", variant: "destructive" })
        return
      }

      const payload = { ...form }
      const res = await fetch(editing ? `/api/admin/branches/${editing.id}` : "/api/admin/branches", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo guardar la sede")
      }

      toast({ title: editing ? "Sede actualizada" : "Sede creada" })
      setOpenDialog(false)
      setEditing(null)
      resetForm(null)
      load()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo guardar la sede", variant: "destructive" })
    }
  }

  async function deleteBranch() {
    if (!deleting) return
    try {
      const res = await fetch(`/api/admin/branches/${deleting.id}`, { method: "DELETE" })
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}))
        toast({ title: "No se puede eliminar", description: data.error || "La sede tiene datos asociados", variant: "destructive" })
        setDeleting(null)
        return
      }
      if (!res.ok) throw new Error("No se pudo eliminar la sede")
      toast({ title: "Sede eliminada" })
      setDeleting(null)
      load()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo eliminar la sede", variant: "destructive" })
    }
  }

  const empty = !loading && branches.length === 0

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-20" />
      <div className="absolute top-10 -left-24 w-72 h-72 bg-blue-500 rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float" />
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Building2 className="h-7 w-7" /> Sedes</h1>
            <p className="text-gray-400">Gestiona múltiples sedes de tu academia. Define horarios, datos de contacto y más.</p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Buscar por nombre, dirección, email o teléfono"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white w-72"
            />
            <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" /> Nueva sede
            </Button>
          </div>
        </header>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : empty ? (
          <Card className="border-gray-700/50 bg-gray-800/30">
            <CardHeader>
              <CardTitle>No tienes sedes aún</CardTitle>
              <CardDescription className="text-gray-400">Crea tu primera sede para empezar a agendar clases y matricular alumnos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Crear sede</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-700/50 bg-gray-800/30">
            <CardHeader>
              <CardTitle>Listado de sedes</CardTitle>
              <CardDescription className="text-gray-400">Edita datos de contacto, horarios y elimina sedes sin actividad.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-gray-700/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">Sede</TableHead>
                      <TableHead className="text-gray-300">Contacto</TableHead>
                      <TableHead className="text-gray-300">Dirección</TableHead>
                      <TableHead className="text-gray-300">Horario</TableHead>
                      <TableHead className="text-right text-gray-300">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((b) => (
                      <TableRow key={b.id} className="hover:bg-gray-800/40">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{b.name}</span>
                            <span className="text-xs text-gray-400">ID: {b.id.slice(0, 8)}...</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {b.email && (<div className="flex items-center gap-2 text-gray-300"><Mail className="h-3.5 w-3.5" /> {b.email}</div>)}
                            {b.phone && (<div className="flex items-center gap-2 text-gray-300"><Phone className="h-3.5 w-3.5" /> {b.phone}</div>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2 text-gray-300"><MapPin className="h-3.5 w-3.5 mt-0.5" /> <span>{b.address}</span></div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-300"><Clock className="h-3.5 w-3.5" /> <span>{hoursSummary(b)}</span></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openAssignDialog(b)} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                              <Users className="h-3.5 w-3.5 mr-2" /> Coaches
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleOpenEdit(b)} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => setDeleting(b)}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar sede?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Si la sede tiene clases o inscripciones, no podrás eliminarla.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleting(null)}>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={deleteBranch}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar sede" : "Nueva sede"}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Define datos básicos y horarios de apertura/cierre. Deja en blanco para marcar como cerrado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Nombre</label>
                  <Input value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="bg-gray-800/50 border-gray-700 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Email</label>
                  <Input type="email" value={form.email || ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="bg-gray-800/50 border-gray-700 text-white" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-gray-300">Dirección</label>
                  <Input value={form.address || ""} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="bg-gray-800/50 border-gray-700 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Teléfono</label>
                  <Input value={form.phone || ""} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="bg-gray-800/50 border-gray-700 text-white" />
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Horarios</h3>
                  <p className="text-sm text-gray-400">Usa formato 24h. Deja vacío para marcar como cerrado.</p>
                </div>
                <Button variant="outline" size="sm" onClick={copyMonToWeekdays} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                  <Copy className="h-3.5 w-3.5 mr-2" /> Copiar Lunes a L–V
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayKeys.map((d) => (
                  <div key={String(d.key)} className="grid grid-cols-[110px_1fr_1fr] items-center gap-3">
                    <div className="text-sm text-gray-300">{d.label}</div>
                    <Input
                      type="time"
                      value={(form[d.open] as string) || ""}
                      onChange={(e) => setForm((p) => ({ ...p, [d.open]: e.target.value }))}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                    <Input
                      type="time"
                      value={(form[d.close] as string) || ""}
                      onChange={(e) => setForm((p) => ({ ...p, [d.close]: e.target.value }))}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <div className="flex items-center justify-end gap-3 w-full">
                <Button variant="outline" onClick={() => setOpenDialog(false)} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                  Cancelar
                </Button>
                <Button onClick={saveBranch} className="bg-indigo-600 hover:bg-indigo-700">
                  {editing ? "Guardar cambios" : "Crear sede"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Coaches Dialog */}
        <Dialog open={openAssign} onOpenChange={setOpenAssign}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Asignar coaches {assignBranch ? `— ${assignBranch.name}` : ""}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Selecciona los coaches que podrán trabajar en esta sede.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="Buscar coach por nombre o email"
                value={coachSearch}
                onChange={(e) => setCoachSearch(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white"
              />

              {assignLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <ScrollArea className="h-72 rounded-md border border-gray-700/50 p-3 bg-gray-800/30">
                  <div className="space-y-3">
                    {filteredCoaches.length === 0 ? (
                      <div className="text-sm text-gray-400">No se encontraron coaches.</div>
                    ) : (
                      filteredCoaches.map((c) => {
                        const checked = selectedCoaches.has(c.id)
                        return (
                          <label key={c.id} className="flex items-center gap-3 text-sm text-gray-200">
                            <Checkbox checked={checked} onCheckedChange={(v) => toggleCoach(c.id, Boolean(v))} />
                            <div className="flex flex-col">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-gray-400">{c.email}</span>
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            <DialogFooter>
              <div className="flex items-center justify-end gap-3 w-full">
                <Button variant="outline" onClick={() => setOpenAssign(false)} className="border-gray-700 text-gray-200 hover:bg-gray-800">
                  Cancelar
                </Button>
                <Button onClick={saveAssignments} disabled={assignSaving || assignLoading} className="bg-indigo-600 hover:bg-indigo-700">
                  {assignSaving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
