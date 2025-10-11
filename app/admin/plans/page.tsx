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
import { 
  CreditCard,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Users,
  TrendingUp,
  Calendar
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Plan {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  type: "MONTHLY" | "QUARTERLY" | "YEARLY"
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
  const [newPlan, setNewPlan] = useState({
    name: "",
    slug: "",
    price: 0,
    currency: "CLP",
    type: "MONTHLY" as const,
    classesPerMonth: 0,
    unlimitedClasses: false,
    accessToContent: false,
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

  const handleCreatePlan = async () => {
    try {
      const slug = (newPlan.slug && newPlan.slug.trim().length > 0)
        ? newPlan.slug.trim()
        : newPlan.name
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
        body: JSON.stringify({ ...newPlan, slug })
      })
      
      if (response.ok) {
        fetchPlans()
        fetchMetrics()
        setIsCreateDialogOpen(false)
        setNewPlan({
          name: "",
          slug: "",
          price: 0,
          currency: "CLP",
          type: "MONTHLY",
          classesPerMonth: 0,
          unlimitedClasses: false,
          accessToContent: false,
          personalTraining: false,
          competitionAccess: false
        })
        toast({ title: "Plan creado" })
      } else {
        const data = await response.json().catch(() => ({}))
        toast({ title: "No se pudo crear el plan", description: data.error || "Error desconocido", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error creating plan:", error)
      toast({ title: "Error", description: "Error al crear el plan", variant: "destructive" })
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
      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-medium">Activo</Badge>
    ) : (
      <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 font-medium">Inactivo</Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeMap = {
      MONTHLY: { label: "Mensual", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      QUARTERLY: { label: "Trimestral", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
      YEARLY: { label: "Anual", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" }
    }
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, color: "bg-gray-500/20 text-gray-300 border-gray-500/30" }
    return <Badge className={`${typeInfo.color} font-medium`}>{typeInfo.label}</Badge>
  }

  const kpiCardData = [
    {
      title: 'Total de Planes',
      value: metrics.totalPlans,
      change: 'Planes configurados',
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-600',
      progress: Math.min((metrics.totalPlans / 10) * 100, 100),
    },
    {
      title: 'Planes Activos',
      value: metrics.activePlans,
      change: 'Disponibles para venta',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      progress: metrics.totalPlans > 0 ? Math.min((metrics.activePlans / metrics.totalPlans) * 100, 100) : 0,
    },
    {
      title: 'Ingresos Totales',
      value: formatCurrency(metrics.totalRevenue),
      change: 'Revenue generado',
      icon: DollarSign,
      color: 'from-purple-500 to-violet-600',
      progress: Math.min((metrics.totalRevenue / 100000) * 100, 100),
    },
    {
      title: 'Precio Promedio',
      value: formatCurrency(metrics.averagePrice),
      change: 'Precio medio por plan',
      icon: Calendar,
      color: 'from-amber-500 to-orange-600',
      progress: Math.min((metrics.averagePrice / 50000) * 100, 100),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary,210_90%_56%))]"></div>
          <p className="text-[hsl(var(--foreground))]/70">Cargando planes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-[hsl(var(--primary,210_90%_56%))] rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-[hsl(var(--accent,262_83%_58%))] rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Planes</h1>
            <p className="text-gray-400">Administra los planes de suscripción de tu academia</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Crear Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Plan</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configura un nuevo plan de suscripción para tu academia
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nombre</Label>
                  <Input
                    id="name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                    className="col-span-3 bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Precio</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({...newPlan, price: Number(e.target.value)})}
                    className="col-span-3 bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Tipo</Label>
                  <Select value={newPlan.type} onValueChange={(value: any) => setNewPlan({...newPlan, type: value})}>
                    <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="MONTHLY">Mensual</SelectItem>
                      <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                      <SelectItem value="YEARLY">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePlan} className="bg-indigo-600 hover:bg-indigo-700">
                  Crear Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCardData.map((kpi, index) => (
            <Card key={index} className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br ${kpi.color} p-4`}>
                <CardTitle className="text-sm font-medium text-white/90">{kpi.title}</CardTitle>
                <kpi.icon className="h-5 w-5 text-white/80" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-3xl font-bold text-white">{kpi.value}</div>
                <p className="text-xs text-gray-400 mt-1">{kpi.change}</p>
                <Progress value={kpi.progress} className="mt-4 h-2 bg-gray-700/50" indicatorClassName={`bg-gradient-to-r ${kpi.color}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plans Table */}
        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Lista de Planes</CardTitle>
                <CardDescription className="text-gray-400">
                  Gestiona todos los planes de suscripción disponibles
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar planes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 focus:border-indigo-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-gray-700/50 overflow-hidden bg-gray-800/30 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800/50 hover:bg-gray-800/70 border-gray-700/50">
                    <TableHead className="font-semibold text-gray-300">Plan</TableHead>
                    <TableHead className="font-semibold text-gray-300">Precio</TableHead>
                    <TableHead className="font-semibold text-gray-300">Tipo</TableHead>
                    <TableHead className="font-semibold text-gray-300">Estado</TableHead>
                    <TableHead className="font-semibold text-gray-300">Suscriptores</TableHead>
                    <TableHead className="text-right font-semibold text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 bg-gray-800/50 rounded-full">
                            <CreditCard className="h-12 w-12 text-gray-500" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-gray-400">
                              {searchTerm ? "No se encontraron planes" : "No hay planes configurados"}
                            </p>
                            {!searchTerm && (
                              <p className="text-sm text-gray-500">
                                Crea tu primer plan para comenzar a recibir suscripciones
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => (
                      <TableRow key={plan.id} className="hover:bg-gray-800/30 transition-colors border-gray-700/30">
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="font-medium text-white">{plan.name}</div>
                            <div className="text-sm text-gray-400">/{plan.slug}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-medium text-white">
                            {formatCurrency(plan.price, plan.currency)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {getTypeBadge(plan.type)}
                        </TableCell>
                        <TableCell className="py-4">
                          {getStatusBadge(plan.status)}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-white">{plan._count?.memberships || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-red-600 hover:text-white hover:border-red-500 transition-all duration-300"
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
