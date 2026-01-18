"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  XCircle,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Wallet,
  Banknote,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface PaymentConfig {
  mercadopagoEnabled: boolean
  mercadopagoPublicKey: string
  mercadopagoToken: string
  khipuEnabled: boolean
  khipuReceiverId: string
  khipuSecret: string
  flowEnabled: boolean
  flowApiKey: string
  flowSecretKey: string
  transferEnabled: boolean
  bankName: string
  bankAccountType: string
  bankAccountNumber: string
  bankAccountHolder: string
  bankAccountRut: string
  bankAccountEmail: string
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

const ACCOUNT_TYPES = [
  "Cuenta Corriente",
  "Cuenta Vista",
  "Cuenta de Ahorro",
  "Cuenta RUT"
]

export default function PaymentSettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  
  const [config, setConfig] = useState<PaymentConfig>({
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

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/settings/payments")
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      } else {
        const data = await response.json()
        setError(data.error || "Error al cargar configuración")
      }
    } catch (err) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const response = await fetch("/api/admin/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setSuccess("✅ Configuración guardada exitosamente")
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => setSuccess(""), 5000)
      } else {
        const data = await response.json()
        setError(data.error || "Error al guardar configuración")
      }
    } catch (err) {
      setError("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateConfig = (key: keyof PaymentConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Configuración de Pagos</h1>
            <p className="text-muted-foreground">Configura las pasarelas de pago y métodos de cobro</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

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

      <Tabs defaultValue="transfer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transfer" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Transferencia</span>
          </TabsTrigger>
          <TabsTrigger value="mercadopago" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">MercadoPago</span>
          </TabsTrigger>
          <TabsTrigger value="khipu" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Khipu</span>
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Flow</span>
          </TabsTrigger>
        </TabsList>

        {/* Transferencia Bancaria */}
        <TabsContent value="transfer">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Building2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Transferencia Bancaria</CardTitle>
                    <CardDescription>
                      Permite a los alumnos pagar mediante transferencia y subir comprobante
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.transferEnabled}
                    onCheckedChange={(checked) => updateConfig("transferEnabled", checked)}
                  />
                  <Badge variant={config.transferEnabled ? "default" : "secondary"}>
                    {config.transferEnabled ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Los pagos por transferencia requieren aprobación manual. El alumno sube un comprobante y 
                  tú lo verificas desde la sección de Pagos.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Select 
                    value={config.bankName} 
                    onValueChange={(v) => updateConfig("bankName", v)}
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
                    value={config.bankAccountType} 
                    onValueChange={(v) => updateConfig("bankAccountType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Número de Cuenta</Label>
                  <Input
                    value={config.bankAccountNumber}
                    onChange={(e) => updateConfig("bankAccountNumber", e.target.value)}
                    placeholder="Ej: 12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Titular de la Cuenta</Label>
                  <Input
                    value={config.bankAccountHolder}
                    onChange={(e) => updateConfig("bankAccountHolder", e.target.value)}
                    placeholder="Nombre completo o razón social"
                  />
                </div>

                <div className="space-y-2">
                  <Label>RUT del Titular</Label>
                  <Input
                    value={config.bankAccountRut}
                    onChange={(e) => updateConfig("bankAccountRut", e.target.value)}
                    placeholder="12.345.678-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email para Notificaciones</Label>
                  <Input
                    type="email"
                    value={config.bankAccountEmail}
                    onChange={(e) => updateConfig("bankAccountEmail", e.target.value)}
                    placeholder="pagos@tuacademia.cl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MercadoPago */}
        <TabsContent value="mercadopago">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10">
                    <Wallet className="h-5 w-5 text-sky-500" />
                  </div>
                  <div>
                    <CardTitle>MercadoPago</CardTitle>
                    <CardDescription>
                      Acepta tarjetas de crédito/débito y otros medios de pago
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.mercadopagoEnabled}
                    onCheckedChange={(checked) => updateConfig("mercadopagoEnabled", checked)}
                  />
                  <Badge variant={config.mercadopagoEnabled ? "default" : "secondary"}>
                    {config.mercadopagoEnabled ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Obtén tus credenciales en{" "}
                  <a 
                    href="https://www.mercadopago.cl/developers/panel/app" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    developers.mercadopago.com
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <Input
                    value={config.mercadopagoPublicKey}
                    onChange={(e) => updateConfig("mercadopagoPublicKey", e.target.value)}
                    placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets.mercadopagoToken ? "text" : "password"}
                      value={config.mercadopagoToken}
                      onChange={(e) => updateConfig("mercadopagoToken", e.target.value)}
                      placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowSecret("mercadopagoToken")}
                    >
                      {showSecrets.mercadopagoToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Khipu */}
        <TabsContent value="khipu">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Banknote className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>Khipu</CardTitle>
                    <CardDescription>
                      Pagos directos desde cuentas bancarias chilenas
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.khipuEnabled}
                    onCheckedChange={(checked) => updateConfig("khipuEnabled", checked)}
                  />
                  <Badge variant={config.khipuEnabled ? "default" : "secondary"}>
                    {config.khipuEnabled ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Obtén tus credenciales en{" "}
                  <a 
                    href="https://khipu.com/page/comercios" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    khipu.com
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Receiver ID</Label>
                  <Input
                    value={config.khipuReceiverId}
                    onChange={(e) => updateConfig("khipuReceiverId", e.target.value)}
                    placeholder="123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets.khipuSecret ? "text" : "password"}
                      value={config.khipuSecret}
                      onChange={(e) => updateConfig("khipuSecret", e.target.value)}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowSecret("khipuSecret")}
                    >
                      {showSecrets.khipuSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flow */}
        <TabsContent value="flow">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <CreditCard className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle>Flow</CardTitle>
                    <CardDescription>
                      Pagos con tarjetas y transferencias en Chile
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.flowEnabled}
                    onCheckedChange={(checked) => updateConfig("flowEnabled", checked)}
                  />
                  <Badge variant={config.flowEnabled ? "default" : "secondary"}>
                    {config.flowEnabled ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Obtén tus credenciales en{" "}
                  <a 
                    href="https://www.flow.cl/app/web/login.php" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    flow.cl
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    value={config.flowApiKey}
                    onChange={(e) => updateConfig("flowApiKey", e.target.value)}
                    placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets.flowSecretKey ? "text" : "password"}
                      value={config.flowSecretKey}
                      onChange={(e) => updateConfig("flowSecretKey", e.target.value)}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowSecret("flowSecretKey")}
                    >
                      {showSecrets.flowSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
