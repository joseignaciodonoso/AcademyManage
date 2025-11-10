"use client"

import { useState, useEffect } from "react"
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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  CheckCircle2,
  XCircle
} from "lucide-react"

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
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)

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
    </div>
  )
}
