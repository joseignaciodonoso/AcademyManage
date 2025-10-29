"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  CreditCard,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Check,
  X
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { toast as sonnerToast } from "sonner"

interface Plan {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  type: "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNLIMITED"
  classesPerMonth?: number
  unlimitedClasses: boolean
  accessToContent: boolean
  personalTraining: boolean
  competitionAccess: boolean
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  _count?: {
    memberships: number
  }
}

interface PlanMetrics {
  totalPlans: number
  activePlans: number
  totalRevenue: number
  averagePrice: number
}

interface PlanForm {
  name: string
  slug: string
  price: number
  currency: string
  type: "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNLIMITED"
  classesPerMonth: number
  unlimitedClasses: boolean
  accessToContent: boolean
  personalTraining: boolean
  competitionAccess: boolean
}

export default function PlansPage() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [metrics, setMetrics] = useState<PlanMetrics>({
    totalPlans: 0,
    activePlans: 0,
    totalRevenue: 0,
    averagePrice: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [planForm, setPlanForm] = useState<PlanForm>({
    name: "",
    slug: "",
    price: 0,
    currency: "CLP",
    type: "MONTHLY",
    classesPerMonth: 0,
    unlimitedClasses: false,
    accessToContent: true,
    personalTraining: false,
    competitionAccess: false
  })

  useEffect(() => {
    fetchPlans()
    fetchMetrics()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans")
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/plans/metrics")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    }
  }

  const resetForm = () => {
    setPlanForm({
      name: "",
      slug: "",
      price: 0,
      currency: "CLP",
      type: "MONTHLY",
      classesPerMonth: 0,
      unlimitedClasses: false,
      accessToContent: true,
      personalTraining: false,
      competitionAccess: false
    })
  }

  const handleCreatePlan = async () => {
    try {
      setSaving(true)
      const slug = (planForm.slug && planForm.slug.trim().length > 0)
        ? planForm.slug.trim()
        : planForm.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")

      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...planForm, slug })
      })
      
      if (response.ok) {
        fetchPlans()
        fetchMetrics()
        setIsCreateDialogOpen(false)
        resetForm()
        sonnerToast.success("Plan creado exitosamente")
      } else {
        const data = await response.json().catch(() => ({}))
        sonnerToast.error(data.error || "No se pudo crear el plan")
      }
    } catch (error) {
      console.error("Error creating plan:", error)
      sonnerToast.error("Error al crear el plan")
    } finally {
      setSaving(false)
    }
  }

  const handleEditPlan = async () => {
    if (!editingPlan) {
      console.error("No hay plan para editar")
      return
    }
    
    try {
      setSaving(true)
      console.log("Editando plan:", editingPlan.id)
      console.log("Datos a enviar:", planForm)
      
      const response = await fetch(`/api/plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planForm)
      })
      
      console.log("Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Plan actualizado:", data)
        await fetchPlans()
        await fetchMetrics()
        setIsEditDialogOpen(false)
        setEditingPlan(null)
        resetForm()
        sonnerToast.success("Plan actualizado exitosamente")
      } else {
        const data = await response.json().catch(() => ({}))
        console.error("Error del servidor:", data)
        sonnerToast.error(data.error || "No se pudo actualizar el plan")
      }
    } catch (error) {
      console.error("Error updating plan:", error)
      sonnerToast.error("Error al actualizar el plan")
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      currency: plan.currency,
      type: plan.type,
      classesPerMonth: plan.classesPerMonth || 0,
      unlimitedClasses: plan.unlimitedClasses,
      accessToContent: plan.accessToContent,
      personalTraining: plan.personalTraining,
      competitionAccess: plan.competitionAccess
    })
    setIsEditDialogOpen(true)
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("¿Estás seguro de eliminar este plan?")) return
    
    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        fetchPlans()
        fetchMetrics()
        sonnerToast.success("Plan eliminado exitosamente")
      } else {
        const data = await response.json().catch(() => ({}))
        sonnerToast.error(data.error || "No se pudo eliminar el plan")
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
      sonnerToast.error("Error al eliminar el plan")
    }
  }

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number, currency: string = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    return status === "ACTIVE" ? (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Activo</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Inactivo</Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeMap = {
      MONTHLY: { label: "Mensual", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
      QUARTERLY: { label: "Trimestral", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
      YEARLY: { label: "Anual", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
      UNLIMITED: { label: "Ilimitado", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" }
    }
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, color: "bg-gray-100 text-gray-700" }
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando planes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Planes</h1>
            <p className="text-muted-foreground">Administra los planes de suscripción de tu academia</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Plan</DialogTitle>
                <DialogDescription>
                  Configura un nuevo plan de suscripción para tu academia
                </DialogDescription>
              </DialogHeader>
              <PlanFormContent form={planForm} setForm={setPlanForm} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePlan} disabled={saving}>
                  {saving ? "Creando..." : "Crear Plan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Planes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalPlans}</div>
              <p className="text-xs text-muted-foreground">Planes configurados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planes Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activePlans}</div>
              <p className="text-xs text-muted-foreground">Disponibles para venta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Revenue generado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.averagePrice)}</div>
              <p className="text-xs text-muted-foreground">Precio medio por plan</p>
            </CardContent>
          </Card>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Planes</CardTitle>
                <CardDescription>
                  Gestiona todos los planes de suscripción disponibles
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar planes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Suscriptores</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <CreditCard className="h-12 w-12 text-muted-foreground" />
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-muted-foreground">
                            {searchTerm ? "No se encontraron planes" : "No hay planes configurados"}
                          </p>
                          {!searchTerm && (
                            <p className="text-sm text-muted-foreground">
                              Crea tu primer plan para comenzar a recibir suscripciones
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">/{plan.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(plan.price, plan.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(plan.type)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(plan.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{plan._count?.memberships || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Plan</DialogTitle>
              <DialogDescription>
                Actualiza la configuración del plan de suscripción
              </DialogDescription>
            </DialogHeader>
            <PlanFormContent form={planForm} setForm={setPlanForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleEditPlan} disabled={saving}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function PlanFormContent({ form, setForm }: { form: PlanForm; setForm: (form: PlanForm) => void }) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Plan</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            placeholder="Plan Básico"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => setForm({...form, slug: e.target.value})}
            placeholder="plan-basico"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({...form, price: Number(e.target.value)})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Plan</Label>
          <Select value={form.type} onValueChange={(value: any) => setForm({...form, type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Mensual</SelectItem>
              <SelectItem value="QUARTERLY">Trimestral</SelectItem>
              <SelectItem value="YEARLY">Anual</SelectItem>
              <SelectItem value="UNLIMITED">Ilimitado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="classesPerMonth">Clases por Mes</Label>
        <Input
          id="classesPerMonth"
          type="number"
          value={form.classesPerMonth}
          onChange={(e) => setForm({...form, classesPerMonth: Number(e.target.value)})}
          disabled={form.unlimitedClasses}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="unlimitedClasses">Clases Ilimitadas</Label>
          <Switch
            id="unlimitedClasses"
            checked={form.unlimitedClasses}
            onCheckedChange={(checked) => setForm({...form, unlimitedClasses: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="accessToContent">Acceso a Contenidos</Label>
          <Switch
            id="accessToContent"
            checked={form.accessToContent}
            onCheckedChange={(checked) => setForm({...form, accessToContent: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="personalTraining">Entrenamiento Personal</Label>
          <Switch
            id="personalTraining"
            checked={form.personalTraining}
            onCheckedChange={(checked) => setForm({...form, personalTraining: checked})}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="competitionAccess">Acceso a Competiciones</Label>
          <Switch
            id="competitionAccess"
            checked={form.competitionAccess}
            onCheckedChange={(checked) => setForm({...form, competitionAccess: checked})}
          />
        </div>
      </div>
    </div>
  )
}
