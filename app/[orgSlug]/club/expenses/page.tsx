"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  FileText
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ExpensesNavigation } from "@/components/club/expenses/ExpensesNavigation"

interface Expense {
  id: string
  concept: string
  category: string
  amount: number
  currency: string
  date: string
  receiptUrl?: string
  receiptName?: string
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
}

interface ExpenseStats {
  summary: {
    totalExpenses: number
    totalCount: number
    averageExpense: number
    growthRate: number
    period: string
  }
  categoryStats: Array<{
    category: string
    categoryName: string
    total: number
    percentage: number
    count: number
  }>
  monthlyExpenses: Array<{
    month: number
    monthName: string
    total: number
    count: number
  }>
  topExpenses: Array<{
    id: string
    concept: string
    amount: number
    category: string
    date: string
  }>
  recentExpenses: Array<{
    id: string
    concept: string
    amount: number
    category: string
    categoryName: string
    date: string
  }>
}

const EXPENSE_CATEGORIES = {
  FIELD_RENTAL: "Arriendo de Cancha",
  EQUIPMENT: "Equipamiento",
  TRANSPORTATION: "Transporte", 
  BALLS: "Balones",
  REFEREES: "Árbitros",
  INSCRIPTIONS: "Inscripciones",
  UNIFORMS: "Uniformes",
  MEDICAL: "Médico",
  OTHER: "Otros"
}

export default function ExpensesPage() {
  const params = useParams()
  const { data: session } = useSession()
  const orgSlug = params?.orgSlug as string

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<ExpenseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    concept: "",
    category: "",
    amount: "",
    date: "",
    receiptUrl: "",
    receiptName: ""
  })

  const academyId = (session?.user as any)?.academyId

  useEffect(() => {
    if (academyId) {
      fetchExpenses()
      fetchStats()
    }
  }, [academyId, categoryFilter, dateFilter])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        academyId,
        ...(categoryFilter !== "ALL" && { category: categoryFilter }),
        ...(dateFilter && { startDate: dateFilter })
      })

      const response = await fetch(`/api/club/expenses?${params}`)
      const data = await response.json()

      if (response.ok) {
        setExpenses(data.expenses)
      } else {
        setError(data.error || "Error al cargar gastos")
      }
    } catch (err) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({ academyId })
      const response = await fetch(`/api/club/expenses/stats?${params}`)
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const url = editingExpense 
        ? `/api/club/expenses/${editingExpense.id}`
        : "/api/club/expenses"
      
      const method = editingExpense ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          academyId
        })
      })

      const data = await response.json()

      if (response.ok) {
        await fetchExpenses()
        await fetchStats()
        setShowCreateDialog(false)
        setEditingExpense(null)
        setFormData({
          concept: "",
          category: "",
          amount: "",
          date: "",
          receiptUrl: "",
          receiptName: ""
        })
      } else {
        setError(data.error || "Error al guardar gasto")
      }
    } catch (err) {
      setError("Error de conexión")
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      concept: expense.concept,
      category: expense.category,
      amount: expense.amount.toString(),
      date: format(new Date(expense.date), "yyyy-MM-dd"),
      receiptUrl: expense.receiptUrl || "",
      receiptName: expense.receiptName || ""
    })
    setShowCreateDialog(true)
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este gasto?")) return

    try {
      const response = await fetch(`/api/club/expenses/${expenseId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchExpenses()
        await fetchStats()
      } else {
        const data = await response.json()
        setError(data.error || "Error al eliminar gasto")
      }
    } catch (err) {
      setError("Error de conexión")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0
    }).format(amount)
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]
                           ?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando gastos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <ExpensesNavigation />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Gastos</h1>
          <p className="text-muted-foreground">Administra los gastos del club</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingExpense(null)
              setFormData({
                concept: "",
                category: "",
                amount: "",
                date: "",
                receiptUrl: "",
                receiptName: ""
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
              </DialogTitle>
              <DialogDescription>
                {editingExpense ? "Modifica los datos del gasto" : "Registra un nuevo gasto del club"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="concept">Concepto</Label>
                <Input
                  id="concept"
                  value={formData.concept}
                  onChange={(e) => setFormData(prev => ({ ...prev, concept: e.target.value }))}
                  placeholder="Ej: Arriendo cancha municipal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptUrl">URL del Comprobante (Opcional)</Label>
                <Input
                  id="receiptUrl"
                  type="url"
                  value={formData.receiptUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiptUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingExpense ? "Actualizar" : "Crear"} Gasto
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.summary.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.totalCount} gastos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Gasto</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.summary.averageExpense)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gasto promedio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variación</CardTitle>
              {stats.summary.growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                stats.summary.growthRate >= 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {stats.summary.growthRate >= 0 ? '+' : ''}{stats.summary.growthRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categoría Principal</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.categoryStats[0]?.categoryName || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.categoryStats[0] ? formatCurrency(stats.categoryStats[0].total) : "Sin gastos"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por concepto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las categorías</SelectItem>
                {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gastos</CardTitle>
          <CardDescription>
            {filteredExpenses.length} gastos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Creado por</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.date), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expense.receiptUrl && (
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                        )}
                        {expense.concept}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>{expense.creator.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {(session?.user?.role === "SUPER_ADMIN" || 
                          session?.user?.role === "ACADEMY_ADMIN") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredExpenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron gastos con los filtros aplicados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
