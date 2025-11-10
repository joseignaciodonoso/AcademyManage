"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Lock, 
  User, 
  Mail, 
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  Building2,
  Plus,
  Edit,
  Trash2,
  XCircle
} from "lucide-react"
import { toast } from "sonner"
import { useEffect } from "react"

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

export default function AdminSettingsPage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  
  // Password change state
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Profile update state
  const [profileForm, setProfileForm] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || ""
  })

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [bankLoading, setBankLoading] = useState(true)
  const [bankError, setBankError] = useState("")
  const [bankSuccess, setBankSuccess] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    bank: "",
    accountType: "",
    accountNumber: "",
    currency: "CLP",
    isActive: true,
  })

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Todos los campos son obligatorios")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }

    try {
      setPasswordLoading(true)
      
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Error al cambiar contraseña")
      }

      toast.success("Contraseña cambiada exitosamente")
      setOpenPasswordDialog(false)
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error(error instanceof Error ? error.message : "Error al cambiar contraseña")
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    if (!profileForm.name || !profileForm.email) {
      toast.error("Nombre y email son obligatorios")
      return
    }

    try {
      setLoading(true)
      
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Error al actualizar perfil")
      }

      // Update session with new data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: profileForm.name,
          email: profileForm.email
        }
      })

      toast.success("Perfil actualizado exitosamente")
      
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error instanceof Error ? error.message : "Error al actualizar perfil")
    } finally {
      setLoading(false)
    }
  }

  // Bank account functions
  useEffect(() => {
    fetchBankAccounts()
  }, [])

  const fetchBankAccounts = async () => {
    try {
      setBankLoading(true)
      const response = await fetch("/api/admin/bank-accounts")
      const data = await response.json()

      if (response.ok) {
        setBankAccounts(data.bankAccounts || [])
      } else {
        setBankError(data.error || "Error al cargar cuentas bancarias")
      }
    } catch (err) {
      setBankError("Error de conexión")
    } finally {
      setBankLoading(false)
    }
  }

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBankError("")
    setBankSuccess("")

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
        setBankSuccess(editingAccount ? "Cuenta actualizada" : "Cuenta creada exitosamente")
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
        setBankError(data.error || "Error al guardar cuenta bancaria")
      }
    } catch (err) {
      setBankError("Error de conexión")
    }
  }

  const handleBankEdit = (account: BankAccount) => {
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

  const handleBankDelete = async (accountId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cuenta bancaria?")) return

    try {
      const response = await fetch(`/api/admin/bank-accounts/${accountId}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (response.ok) {
        setBankSuccess("Cuenta eliminada exitosamente")
        await fetchBankAccounts()
      } else {
        setBankError(data.error || "Error al eliminar cuenta bancaria")
      }
    } catch (err) {
      setBankError("Error de conexión")
    }
  }

  const handleBankToggleActive = async (account: BankAccount) => {
    try {
      const response = await fetch(`/api/admin/bank-accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive })
      })

      if (response.ok) {
        setBankSuccess(`Cuenta ${!account.isActive ? 'activada' : 'desactivada'} exitosamente`)
        await fetchBankAccounts()
      } else {
        const data = await response.json()
        setBankError(data.error || "Error al actualizar cuenta")
      }
    } catch (err) {
      setBankError("Error de conexión")
    }
  }

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configuración</h1>
            <p className="text-muted-foreground">Gestiona tu cuenta y preferencias</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="banking">Cuentas Bancarias</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Perfil
                </CardTitle>
                <CardDescription>
                  Actualiza tu información personal y de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Rol</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {session?.user?.role === 'SUPER_ADMIN' ? 'Super Administrador' : 
                         session?.user?.role === 'ACADEMY_ADMIN' ? 'Administrador' : 
                         session?.user?.role}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="min-w-[120px]"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        Guardando...
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Seguridad de la Cuenta
                </CardTitle>
                <CardDescription>
                  Gestiona la seguridad de tu cuenta y contraseña
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">Contraseña</h4>
                      <p className="text-sm text-muted-foreground">
                        Cambia tu contraseña para mantener tu cuenta segura
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setOpenPasswordDialog(true)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Cambiar contraseña
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">Sesión activa</h4>
                      <p className="text-sm text-muted-foreground">
                        Última actividad: {new Date().toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Activa</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banking Tab */}
          <TabsContent value="banking">
            <div className="space-y-6">
              {bankSuccess && (
                <Alert className="bg-green-500/10 border-green-500/50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-500">{bankSuccess}</AlertDescription>
                </Alert>
              )}

              {bankError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{bankError}</AlertDescription>
                </Alert>
              )}

              <Card>
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
                      <form onSubmit={handleBankSubmit} className="space-y-4">
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
                  {bankLoading ? (
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
                                    <CheckCircle className="h-3 w-3 mr-1" />
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
                                    onClick={() => handleBankToggleActive(account)}
                                  >
                                    {account.isActive ? 'Desactivar' : 'Activar'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBankEdit(account)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBankDelete(account.id)}
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
          </TabsContent>
        </Tabs>

        {/* Password Change Dialog */}
        <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Cambiar Contraseña
              </DialogTitle>
              <DialogDescription>
                Ingresa tu contraseña actual y la nueva contraseña
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Tu contraseña actual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Nueva contraseña (mín. 6 caracteres)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {passwordForm.newPassword && passwordForm.confirmPassword && 
               passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setOpenPasswordDialog(false)}
                disabled={passwordLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handlePasswordChange}
                disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || 
                         passwordForm.newPassword !== passwordForm.confirmPassword}
                className="min-w-[120px]"
              >
                {passwordLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Cambiando...
                  </div>
                ) : (
                  'Cambiar contraseña'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
