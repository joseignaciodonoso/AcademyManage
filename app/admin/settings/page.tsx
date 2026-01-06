"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  CheckCircle2,
  XCircle,
  CreditCard,
  ChevronRight,
  Palette,
  Download,
  Upload,
  Database,
  RefreshCw,
  Shield,
  AlertTriangle,
  FileJson
} from "lucide-react"
import Link from "next/link"

interface BankAccount {
  id: string
  name: string
  bank: string
  accountType: string
  accountNumber: string
  currency: string
  isActive: boolean
}

const ACCOUNT_TYPES = {
  CHECKING: "Cuenta Corriente",
  SAVINGS: "Cuenta de Ahorro",
  CREDIT: "Cuenta de Crédito",
  OTHER: "Otra"
}

const BANKS_CHILE = [
  "Banco de Chile",
  "Banco Estado",
  "Banco Santander",
  "BCI",
  "Banco Scotiabank",
  "Banco Itaú",
  "Banco Security",
  "Banco Falabella",
  "Banco Ripley",
  "Banco Consorcio",
  "Banco BICE",
  "Otro"
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)

  // Data management state
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importStats, setImportStats] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bank: "",
    accountType: "",
    accountNumber: "",
    currency: "CLP",
    isActive: true,
  })

  useEffect(() => {
    fetchBankAccounts()
  }, [])

  const fetchBankAccounts = async () => {
    try {
      setLoading(true)
      console.log("Fetching bank accounts...")
      const response = await fetch("/api/admin/bank-accounts")
      const data = await response.json()
      console.log("Response:", response.status, data)

      if (response.ok) {
        setBankAccounts(data.bankAccounts || [])
        console.log("Bank accounts loaded:", data.bankAccounts?.length || 0)
      } else {
        setError(data.error || "Error al cargar cuentas bancarias")
        console.error("Error loading bank accounts:", data.error)
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const url = editingAccount 
        ? `/api/admin/bank-accounts/${editingAccount.id}`
        : "/api/admin/bank-accounts"
      
      const method = editingAccount ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingAccount ? "Cuenta actualizada" : "Cuenta creada exitosamente")
        await fetchBankAccounts()
        setShowCreateDialog(false)
        setEditingAccount(null)
        setFormData({
          name: "",
          bank: "",
          accountType: "",
          accountNumber: "",
          currency: "CLP",
          isActive: true,
        })
      } else {
        setError(data.error || "Error al guardar cuenta bancaria")
      }
    } catch (err) {
      setError("Error de conexión")
    }
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      bank: account.bank,
      accountType: account.accountType,
      accountNumber: account.accountNumber,
      currency: account.currency,
      isActive: account.isActive,
    })
    setShowCreateDialog(true)
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cuenta bancaria?")) return

    try {
      const response = await fetch(`/api/admin/bank-accounts/${accountId}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Cuenta eliminada exitosamente")
        await fetchBankAccounts()
      } else {
        setError(data.error || "Error al eliminar cuenta bancaria")
      }
    } catch (err) {
      setError("Error de conexión")
    }
  }

  const handleToggleActive = async (account: BankAccount) => {
    try {
      const response = await fetch(`/api/admin/bank-accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive })
      })

      if (response.ok) {
        setSuccess(`Cuenta ${!account.isActive ? 'activada' : 'desactivada'} exitosamente`)
        await fetchBankAccounts()
      } else {
        const data = await response.json()
        setError(data.error || "Error al actualizar cuenta")
      }
    } catch (err) {
      setError("Error de conexión")
    }
  }

  // Data Export
  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/admin/data/export")
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al exportar datos")
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const disposition = response.headers.get("Content-Disposition")
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `backup-${new Date().toISOString().split('T')[0]}.json`

      const blob = await response.blob()
      
      if (blob.size === 0) {
        throw new Error("El archivo de respaldo está vacío")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({ title: "Exportación exitosa", description: "Se ha descargado el archivo de respaldo" })
    } catch (error: any) {
      console.error("Export error:", error)
      toast({ title: "Error", description: error.message || "No se pudo exportar los datos", variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  // Data Import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportStats(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.version || !data.data) throw new Error("Formato de archivo inválido")

      const response = await fetch("/api/admin/data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Error al importar datos")

      setImportStats(result.stats)
      toast({ title: "Importación exitosa", description: "Se importaron los datos correctamente" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo importar los datos", variant: "destructive" })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="bg-green-500/10 border-green-500/50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/settings/payments">
          <Card className="glass-effect rounded-2xl border-[hsl(var(--border))]/50 hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                    <CreditCard className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Pasarelas de Pago</h3>
                    <p className="text-sm text-muted-foreground">MercadoPago, Khipu, Flow, Transferencia</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/settings/branding">
          <Card className="glass-effect rounded-2xl border-[hsl(var(--border))]/50 hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <Palette className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Marca y Apariencia</h3>
                    <p className="text-sm text-muted-foreground">Logo, colores y personalización</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Bank Accounts Section */}
      <Card className="glass-effect rounded-2xl border-[hsl(var(--border))]/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cuentas Bancarias
            </CardTitle>
            <CardDescription>
              Gestiona las cuentas bancarias para el seguimiento de pagos
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingAccount(null)
                setFormData({
                  name: "",
                  bank: "",
                  accountType: "",
                  accountNumber: "",
                  currency: "CLP",
                  isActive: true,
                })
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
                </DialogTitle>
                <DialogDescription>
                  {editingAccount ? "Modifica los datos de la cuenta" : "Registra una nueva cuenta bancaria"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Cuenta</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Cuenta Principal Academia"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank">Banco</Label>
                  <Select 
                    value={formData.bank} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, bank: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS_CHILE.map((bank) => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountType">Tipo de Cuenta</Label>
                  <Select 
                    value={formData.accountType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Número de Cuenta (últimos 4 dígitos)</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="****1234"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Cuenta activa</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAccount ? "Actualizar" : "Crear"} Cuenta
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando cuentas bancarias...
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay cuentas bancarias registradas. Crea una para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.bank}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ACCOUNT_TYPES[account.accountType as keyof typeof ACCOUNT_TYPES]}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.accountNumber}</TableCell>
                      <TableCell>
                        {account.isActive ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(account)}
                          >
                            {account.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card className="glass-effect rounded-2xl border-[hsl(var(--border))]/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestión de Datos
          </CardTitle>
          <CardDescription>
            Exporta e importa datos de tu academia para respaldo o migración
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Download className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold">Exportar Datos (Backup)</h4>
                <p className="text-sm text-muted-foreground">Descarga un archivo JSON con todos los datos</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Las contraseñas NO se incluyen por seguridad</span>
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-4 w-4" />
                  Descargar Backup
                </>
              )}
            </Button>
          </div>

          {/* Import Section */}
          <div className="rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Upload className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-semibold">Importar Datos (Restaurar)</h4>
                <p className="text-sm text-muted-foreground">Restaura datos desde un archivo de backup</p>
              </div>
            </div>
            <Alert variant="destructive" className="bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                La importación sobrescribirá datos existentes (excepto credenciales de admins)
              </AlertDescription>
            </Alert>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                variant="outline"
              >
                {importing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Seleccionar archivo
                  </>
                )}
              </Button>
            </div>

            {importStats && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4">
                <h4 className="font-medium flex items-center gap-2 text-green-800 dark:text-green-200 mb-3">
                  <CheckCircle2 className="h-4 w-4" />
                  Importación completada
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Usuarios</span>
                    <p className="font-semibold">{importStats.users || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Planes</span>
                    <p className="font-semibold">{importStats.plans || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sedes</span>
                    <p className="font-semibold">{importStats.branches || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gastos</span>
                    <p className="font-semibold">{importStats.expenses || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
