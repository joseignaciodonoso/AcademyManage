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
  XCircle,
  CreditCard,
  Wallet,
  Banknote,
  Save,
  AlertTriangle,
  Send,
  Bell,
  Clock,
  TestTube
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

  // Payment gateway state
  const [paymentConfig, setPaymentConfig] = useState({
    mercadopagoEnabled: false,
    mercadopagoPublicKey: "",
    mercadopagoToken: "",
    khipuEnabled: false,
    khipuReceiverId: "",
    khipuSecret: "",
    flowEnabled: false,
    flowApiKey: "",
    flowSecretKey: "",
    transferEnabled: true,
    bankName: "",
    bankAccountType: "",
    bankAccountNumber: "",
    bankAccountHolder: "",
    bankAccountRut: "",
    bankAccountEmail: "",
  })
  const [paymentLoading, setPaymentLoading] = useState(true)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // Email/SMTP config state
  const [emailConfig, setEmailConfig] = useState({
    smtpEnabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "",
    smtpSecure: true,
    paymentReminderEnabled: false,
    paymentReminderDaysBefore: 3,
    paymentReminderDaysAfter: 1,
    paymentReminderFrequency: 3
  })
  const [emailLoading, setEmailLoading] = useState(true)
  const [emailSaving, setEmailSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

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
    fetchPaymentConfig()
    fetchEmailConfig()
  }, [])

  const fetchEmailConfig = async () => {
    try {
      setEmailLoading(true)
      const response = await fetch("/api/admin/settings/email")
      if (response.ok) {
        const data = await response.json()
        setEmailConfig(data)
      }
    } catch (err) {
      console.error("Error fetching email config:", err)
    } finally {
      setEmailLoading(false)
    }
  }

  const handleEmailSave = async () => {
    try {
      setEmailSaving(true)
      const response = await fetch("/api/admin/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailConfig)
      })
      if (response.ok) {
        toast.success("Configuración de email guardada")
      } else {
        toast.error("Error al guardar configuración")
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setEmailSaving(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true)
      const response = await fetch("/api/admin/settings/email/test", {
        method: "POST"
      })
      if (response.ok) {
        toast.success("Email de prueba enviado correctamente")
      } else {
        const data = await response.json()
        toast.error(data.error || "Error al enviar email de prueba")
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setTestingEmail(false)
    }
  }

  const fetchPaymentConfig = async () => {
    try {
      setPaymentLoading(true)
      const response = await fetch("/api/admin/settings/payments")
      if (response.ok) {
        const data = await response.json()
        setPaymentConfig(data)
      }
    } catch (err) {
      console.error("Error fetching payment config:", err)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handlePaymentSave = async () => {
    try {
      setPaymentSaving(true)
      const response = await fetch("/api/admin/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentConfig)
      })

      if (response.ok) {
        toast.success("Configuración de pagos guardada")
      } else {
        const data = await response.json()
        toast.error(data.error || "Error al guardar configuración")
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setPaymentSaving(false)
    }
  }

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="banking">Cuentas Bancarias</TabsTrigger>
            <TabsTrigger value="payments">Pasarelas de Pago</TabsTrigger>
            <TabsTrigger value="email">Email y Recordatorios</TabsTrigger>
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

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="space-y-6">
              {paymentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Transferencia Bancaria */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Building2 className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Transferencia Bancaria</CardTitle>
                            <CardDescription>Permite pagos por transferencia con comprobante</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={paymentConfig.transferEnabled}
                            onCheckedChange={(checked) => setPaymentConfig(prev => ({ ...prev, transferEnabled: checked }))}
                          />
                          <Badge variant={paymentConfig.transferEnabled ? "default" : "secondary"}>
                            {paymentConfig.transferEnabled ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {paymentConfig.transferEnabled && (
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Banco</Label>
                            <Select 
                              value={paymentConfig.bankName} 
                              onValueChange={(v) => setPaymentConfig(prev => ({ ...prev, bankName: v }))}
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
                            <Label>Tipo de Cuenta</Label>
                            <Select 
                              value={paymentConfig.bankAccountType} 
                              onValueChange={(v) => setPaymentConfig(prev => ({ ...prev, bankAccountType: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cuenta Corriente">Cuenta Corriente</SelectItem>
                                <SelectItem value="Cuenta Vista">Cuenta Vista</SelectItem>
                                <SelectItem value="Cuenta de Ahorro">Cuenta de Ahorro</SelectItem>
                                <SelectItem value="Cuenta RUT">Cuenta RUT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Número de Cuenta</Label>
                            <Input
                              value={paymentConfig.bankAccountNumber}
                              onChange={(e) => setPaymentConfig(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                              placeholder="Ej: 12345678"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Titular de la Cuenta</Label>
                            <Input
                              value={paymentConfig.bankAccountHolder}
                              onChange={(e) => setPaymentConfig(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                              placeholder="Nombre completo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>RUT del Titular</Label>
                            <Input
                              value={paymentConfig.bankAccountRut}
                              onChange={(e) => setPaymentConfig(prev => ({ ...prev, bankAccountRut: e.target.value }))}
                              placeholder="12.345.678-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email para Notificaciones</Label>
                            <Input
                              type="email"
                              value={paymentConfig.bankAccountEmail}
                              onChange={(e) => setPaymentConfig(prev => ({ ...prev, bankAccountEmail: e.target.value }))}
                              placeholder="pagos@tuacademia.cl"
                            />
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* MercadoPago */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-sky-500/10">
                            <Wallet className="h-5 w-5 text-sky-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">MercadoPago</CardTitle>
                            <CardDescription>Tarjetas de crédito/débito y otros medios</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={paymentConfig.mercadopagoEnabled}
                            onCheckedChange={(checked) => setPaymentConfig(prev => ({ ...prev, mercadopagoEnabled: checked }))}
                          />
                          <Badge variant={paymentConfig.mercadopagoEnabled ? "default" : "secondary"}>
                            {paymentConfig.mercadopagoEnabled ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {paymentConfig.mercadopagoEnabled && (
                      <CardContent className="space-y-4">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Obtén tus credenciales en{" "}
                            <a href="https://www.mercadopago.cl/developers/panel/app" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                              developers.mercadopago.com
                            </a>
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Public Key</Label>
                            <Input
                              value={paymentConfig.mercadopagoPublicKey}
                              onChange={(e) => setPaymentConfig(prev => ({ ...prev, mercadopagoPublicKey: e.target.value }))}
                              placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Access Token</Label>
                            <div className="flex gap-2">
                              <Input
                                type={showSecrets.mercadopagoToken ? "text" : "password"}
                                value={paymentConfig.mercadopagoToken}
                                onChange={(e) => setPaymentConfig(prev => ({ ...prev, mercadopagoToken: e.target.value }))}
                                placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              />
                              <Button type="button" variant="outline" size="icon" onClick={() => toggleShowSecret("mercadopagoToken")}>
                                {showSecrets.mercadopagoToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Khipu */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Banknote className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Khipu</CardTitle>
                            <CardDescription>Pagos directos desde cuentas bancarias chilenas</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={paymentConfig.khipuEnabled}
                            onCheckedChange={(checked) => setPaymentConfig(prev => ({ ...prev, khipuEnabled: checked }))}
                          />
                          <Badge variant={paymentConfig.khipuEnabled ? "default" : "secondary"}>
                            {paymentConfig.khipuEnabled ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {paymentConfig.khipuEnabled && (
                      <CardContent className="space-y-4">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Obtén tus credenciales en{" "}
                            <a href="https://khipu.com/page/comercios" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                              khipu.com
                            </a>
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Receiver ID</Label>
                            <Input
                              value={paymentConfig.khipuReceiverId}
                              onChange={(e) => setPaymentConfig(prev => ({ ...prev, khipuReceiverId: e.target.value }))}
                              placeholder="123456"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <div className="flex gap-2">
                              <Input
                                type={showSecrets.khipuSecret ? "text" : "password"}
                                value={paymentConfig.khipuSecret}
                                onChange={(e) => setPaymentConfig(prev => ({ ...prev, khipuSecret: e.target.value }))}
                                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              />
                              <Button type="button" variant="outline" size="icon" onClick={() => toggleShowSecret("khipuSecret")}>
                                {showSecrets.khipuSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Flow */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/10">
                            <CreditCard className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Flow</CardTitle>
                            <CardDescription>Pagos con tarjetas y transferencias en Chile</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={paymentConfig.flowEnabled}
                            onCheckedChange={(checked) => setPaymentConfig(prev => ({ ...prev, flowEnabled: checked }))}
                          />
                          <Badge variant={paymentConfig.flowEnabled ? "default" : "secondary"}>
                            {paymentConfig.flowEnabled ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {paymentConfig.flowEnabled && (
                      <CardContent className="space-y-4">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Obtén tus credenciales en{" "}
                            <a href="https://www.flow.cl/app/web/login.php" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                              flow.cl
                            </a>
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>API Key</Label>
                            <Input
                              value={paymentConfig.flowApiKey}
                              onChange={(e) => setPaymentConfig(prev => ({ ...prev, flowApiKey: e.target.value }))}
                              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Secret Key</Label>
                            <div className="flex gap-2">
                              <Input
                                type={showSecrets.flowSecretKey ? "text" : "password"}
                                value={paymentConfig.flowSecretKey}
                                onChange={(e) => setPaymentConfig(prev => ({ ...prev, flowSecretKey: e.target.value }))}
                                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              />
                              <Button type="button" variant="outline" size="icon" onClick={() => toggleShowSecret("flowSecretKey")}>
                                {showSecrets.flowSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={handlePaymentSave} disabled={paymentSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {paymentSaving ? "Guardando..." : "Guardar Configuración"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email">
            <div className="space-y-6">
              {emailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* SMTP Configuration */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Mail className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Configuración SMTP</CardTitle>
                            <CardDescription>Configura el servidor de correo saliente</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={emailConfig.smtpEnabled}
                            onCheckedChange={(checked) => setEmailConfig(prev => ({ ...prev, smtpEnabled: checked }))}
                          />
                          <Badge variant={emailConfig.smtpEnabled ? "default" : "secondary"}>
                            {emailConfig.smtpEnabled ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {emailConfig.smtpEnabled && (
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Servidor SMTP</Label>
                            <Input
                              value={emailConfig.smtpHost}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                              placeholder="smtp.gmail.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Puerto</Label>
                            <Input
                              type="number"
                              value={emailConfig.smtpPort}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                              placeholder="587"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Usuario</Label>
                            <Input
                              value={emailConfig.smtpUser}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpUser: e.target.value }))}
                              placeholder="tu@email.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Contraseña</Label>
                            <div className="flex gap-2">
                              <Input
                                type={showSecrets.smtpPassword ? "text" : "password"}
                                value={emailConfig.smtpPassword}
                                onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                                placeholder="••••••••"
                              />
                              <Button type="button" variant="outline" size="icon" onClick={() => setShowSecrets(prev => ({ ...prev, smtpPassword: !prev.smtpPassword }))}>
                                {showSecrets.smtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Email de Remitente</Label>
                            <Input
                              type="email"
                              value={emailConfig.smtpFromEmail}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpFromEmail: e.target.value }))}
                              placeholder="noreply@tuacademia.cl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nombre del Remitente</Label>
                            <Input
                              value={emailConfig.smtpFromName}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, smtpFromName: e.target.value }))}
                              placeholder="Mi Academia"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={emailConfig.smtpSecure}
                              onCheckedChange={(checked) => setEmailConfig(prev => ({ ...prev, smtpSecure: checked }))}
                            />
                            <Label>Usar TLS/SSL</Label>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={handleTestEmail}
                            disabled={testingEmail || !emailConfig.smtpHost}
                          >
                            <TestTube className="h-4 w-4 mr-2" />
                            {testingEmail ? "Enviando..." : "Enviar Email de Prueba"}
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Payment Reminders */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/10">
                            <Bell className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Recordatorios de Pago</CardTitle>
                            <CardDescription>Envía emails automáticos para recordar pagos vencidos</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={emailConfig.paymentReminderEnabled}
                            onCheckedChange={(checked) => setEmailConfig(prev => ({ ...prev, paymentReminderEnabled: checked }))}
                            disabled={!emailConfig.smtpEnabled}
                          />
                          <Badge variant={emailConfig.paymentReminderEnabled && emailConfig.smtpEnabled ? "default" : "secondary"}>
                            {emailConfig.paymentReminderEnabled && emailConfig.smtpEnabled ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {emailConfig.paymentReminderEnabled && emailConfig.smtpEnabled && (
                      <CardContent className="space-y-4">
                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            Los recordatorios se enviarán automáticamente según la configuración. 
                            Asegúrate de tener configurado el SMTP correctamente.
                          </AlertDescription>
                        </Alert>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Días antes del vencimiento</Label>
                            <Input
                              type="number"
                              min="0"
                              value={emailConfig.paymentReminderDaysBefore}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, paymentReminderDaysBefore: parseInt(e.target.value) || 0 }))}
                            />
                            <p className="text-xs text-muted-foreground">Enviar recordatorio X días antes</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Días después del vencimiento</Label>
                            <Input
                              type="number"
                              min="1"
                              value={emailConfig.paymentReminderDaysAfter}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, paymentReminderDaysAfter: parseInt(e.target.value) || 1 }))}
                            />
                            <p className="text-xs text-muted-foreground">Primer aviso de mora</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Frecuencia de recordatorios</Label>
                            <Input
                              type="number"
                              min="1"
                              value={emailConfig.paymentReminderFrequency}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, paymentReminderFrequency: parseInt(e.target.value) || 3 }))}
                            />
                            <p className="text-xs text-muted-foreground">Cada X días mientras siga vencido</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                    {!emailConfig.smtpEnabled && (
                      <CardContent>
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Primero debes configurar y activar el servidor SMTP para poder enviar recordatorios.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    )}
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={handleEmailSave} disabled={emailSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {emailSaving ? "Guardando..." : "Guardar Configuración"}
                    </Button>
                  </div>
                </>
              )}
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
