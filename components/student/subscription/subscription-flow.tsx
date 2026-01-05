"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  CheckCircle2, 
  CreditCard, 
  ArrowLeft, 
  ArrowRight,
  Star,
  Zap,
  Building2,
  Upload,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
  Copy,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Plan = {
  id: string
  name: string
  price: number
  currency: string
  type: string
  classesPerMonth: number | null
  unlimitedClasses: boolean | null
  description: string | null
}

type PaymentMethods = {
  mercadopago: boolean
  khipu: boolean
  flow: boolean
  transfer: boolean
}

type BankInfo = {
  bankName: string | null
  accountType: string | null
  accountNumber: string | null
  accountHolder: string | null
  rut: string | null
  email: string | null
} | null

type PendingMembership = {
  id: string
  planId: string
  planName: string
  status: string
} | null

type Props = {
  user: { id: string; name: string; email: string }
  academy: { id: string; name: string; logoUrl: string | null; slug: string }
  plans: Plan[]
  paymentMethods: PaymentMethods
  bankInfo: BankInfo
  initialPlanId?: string
  initialStep?: number
  pendingMembership: PendingMembership
  prefix: string
}

const PAYMENT_PROVIDERS = [
  { 
    id: "mercadopago", 
    name: "MercadoPago", 
    description: "Tarjeta de crédito/débito",
    icon: "💳",
    color: "from-blue-500 to-blue-600"
  },
  { 
    id: "khipu", 
    name: "Khipu", 
    description: "Transferencia bancaria instantánea",
    icon: "🏦",
    color: "from-green-500 to-green-600"
  },
  { 
    id: "flow", 
    name: "Flow", 
    description: "Múltiples métodos de pago",
    icon: "💰",
    color: "from-purple-500 to-purple-600"
  },
  { 
    id: "transfer", 
    name: "Transferencia Manual", 
    description: "Transferencia bancaria directa",
    icon: "🏧",
    color: "from-gray-500 to-gray-600"
  },
]

export function SubscriptionFlow({
  user,
  academy,
  plans,
  paymentMethods,
  bankInfo,
  initialPlanId,
  initialStep = 1,
  pendingMembership,
  prefix,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep as 1 | 2 | 3 | 4)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlanId || pendingMembership?.planId || null)
  const [selectedProvider, setSelectedProvider] = useState<string>("transfer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [membershipId, setMembershipId] = useState<string | null>(pendingMembership?.id || null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofUploading, setProofUploading] = useState(false)

  // Auto-select first plan if none selected
  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].id)
    }
  }, [plans, selectedPlanId])

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const recommendedPlanId = plans.find((p) => p.unlimitedClasses)?.id || plans[plans.length - 1]?.id

  const formatCurrency = (amount: number, currency = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const availableProviders = PAYMENT_PROVIDERS.filter((p) => {
    if (p.id === "mercadopago") return paymentMethods.mercadopago
    if (p.id === "khipu") return paymentMethods.khipu
    if (p.id === "flow") return paymentMethods.flow
    if (p.id === "transfer") return paymentMethods.transfer
    return false
  })

  // Auto-select first available provider
  useEffect(() => {
    if (availableProviders.length > 0 && !availableProviders.find(p => p.id === selectedProvider)) {
      setSelectedProvider(availableProviders[0].id)
    }
  }, [availableProviders, selectedProvider])

  const handleNextStep = async () => {
    setError(null)

    if (step === 1) {
      if (!selectedPlanId) {
        setError("Selecciona un plan para continuar")
        return
      }

      setLoading(true)
      try {
        // Create or update membership
        const res = await fetch("/api/student/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlanId }),
        })
        const data = await res.json()
        
        if (!res.ok) {
          throw new Error(data.error || "No se pudo procesar la suscripción")
        }

        setMembershipId(data.membershipId)
        setStep(2)
        router.replace(`${prefix}/app/subscribe?planId=${selectedPlanId}&step=2`)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    } else if (step === 2) {
      if (!selectedProvider) {
        setError("Selecciona un método de pago")
        return
      }

      setLoading(true)
      try {
        // For online payment providers, create checkout session
        if (selectedProvider !== "transfer") {
          const res = await fetch("/api/checkout/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId: selectedPlanId,
              provider: selectedProvider,
              membershipId,
              returnUrl: `${window.location.origin}${prefix}/app/subscribe/success`,
              cancelUrl: `${window.location.origin}${prefix}/app/subscribe?step=2`,
            }),
          })
          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.error || "No se pudo iniciar el pago")
          }

          // Redirect to payment provider
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl
            return
          }
        }

        // For transfer, go to step 3
        setStep(3)
        router.replace(`${prefix}/app/subscribe?planId=${selectedPlanId}&step=3&provider=${selectedProvider}`)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handlePrevStep = () => {
    setError(null)
    if (step === 2) {
      setStep(1)
      router.replace(`${prefix}/app/subscribe?planId=${selectedPlanId}&step=1`)
    } else if (step === 3) {
      setStep(2)
      router.replace(`${prefix}/app/subscribe?planId=${selectedPlanId}&step=2`)
    }
  }

  const handleUploadProof = async () => {
    if (!proofFile || !membershipId) return

    setProofUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", proofFile)
      formData.append("membershipId", membershipId)
      formData.append("amount", String(selectedPlan?.price || 0))

      const res = await fetch("/api/student/payment-proof", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir el comprobante")
      }

      toast({
        title: "Comprobante enviado",
        description: "Tu pago será verificado pronto",
      })

      setStep(4)
      router.replace(`${prefix}/app/subscribe?step=4`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setProofUploading(false)
    }
  }

  const handleConfirmTransfer = async () => {
    if (!membershipId) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/student/confirm-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "No se pudo confirmar la transferencia")
      }

      setStep(4)
      router.replace(`${prefix}/app/subscribe?step=4`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado", description: "Texto copiado al portapapeles" })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Activar Suscripción</h1>
        <p className="text-[hsl(var(--foreground))]/60">
          {step === 1 && "Elige el plan que mejor se adapte a ti"}
          {step === 2 && "Selecciona tu método de pago preferido"}
          {step === 3 && "Completa tu pago"}
          {step === 4 && "¡Listo!"}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step >= s
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]/50"
              }`}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 rounded ${
                  step > s ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Membership Alert */}
      {pendingMembership && step === 1 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Tienes una suscripción pendiente</AlertTitle>
          <AlertDescription>
            Tu plan "{pendingMembership.planName}" está pendiente de pago. 
            Puedes continuar con el pago o seleccionar otro plan.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-4">
          {/* Step 1: Select Plan */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Selecciona tu Plan
                </CardTitle>
                <CardDescription>
                  Elige el plan que mejor se adapte a tus necesidades de entrenamiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedPlanId || undefined}
                  onValueChange={setSelectedPlanId}
                  className="space-y-3"
                >
                  {plans.map((plan) => (
                    <Label key={plan.id} htmlFor={plan.id} className="cursor-pointer">
                      <div
                        className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          selectedPlanId === plan.id
                            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-md"
                            : "border-border hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--muted))]/50"
                        }`}
                      >
                        <RadioGroupItem id={plan.id} value={plan.id} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{plan.name}</span>
                            {plan.id === recommendedPlanId && (
                              <Badge className="bg-[hsl(var(--primary))] text-white text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Recomendado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[hsl(var(--foreground))]/60 mt-1">
                            {plan.unlimitedClasses ? (
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-yellow-500" />
                                Clases ilimitadas
                              </span>
                            ) : plan.classesPerMonth ? (
                              `${plan.classesPerMonth} clases por mes`
                            ) : (
                              "Acceso básico"
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {formatCurrency(plan.price, plan.currency)}
                          </div>
                          <div className="text-xs text-[hsl(var(--foreground))]/60">
                            /{plan.type === "MONTHLY" ? "mes" : plan.type === "QUARTERLY" ? "trim" : "año"}
                          </div>
                        </div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleNextStep} disabled={!selectedPlanId || loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Payment Method */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Método de Pago
                </CardTitle>
                <CardDescription>
                  Selecciona cómo deseas pagar tu suscripción
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableProviders.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No hay métodos de pago disponibles. Contacta a la academia.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <RadioGroup
                    value={selectedProvider}
                    onValueChange={setSelectedProvider}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {availableProviders.map((provider) => (
                      <Label key={provider.id} htmlFor={provider.id} className="cursor-pointer">
                        <div
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                            selectedProvider === provider.id
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                              : "border-border hover:border-[hsl(var(--primary))]/50"
                          }`}
                        >
                          <RadioGroupItem id={provider.id} value={provider.id} />
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center text-xl`}>
                            {provider.icon}
                          </div>
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-xs text-[hsl(var(--foreground))]/60">
                              {provider.description}
                            </div>
                          </div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                  <Button onClick={handleNextStep} disabled={!selectedProvider || loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        {selectedProvider === "transfer" ? "Ver datos de transferencia" : "Ir a pagar"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Complete Payment (Transfer) */}
          {step === 3 && selectedProvider === "transfer" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Datos para Transferencia
                </CardTitle>
                <CardDescription>
                  Realiza la transferencia y luego confirma tu pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bank Info */}
                {bankInfo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bankInfo.bankName && (
                      <div className="p-3 rounded-lg bg-[hsl(var(--muted))]/50 border border-border">
                        <div className="text-xs text-[hsl(var(--foreground))]/60 mb-1">Banco</div>
                        <div className="font-medium flex items-center justify-between">
                          {bankInfo.bankName}
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(bankInfo.bankName!)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {bankInfo.accountType && (
                      <div className="p-3 rounded-lg bg-[hsl(var(--muted))]/50 border border-border">
                        <div className="text-xs text-[hsl(var(--foreground))]/60 mb-1">Tipo de Cuenta</div>
                        <div className="font-medium">{bankInfo.accountType}</div>
                      </div>
                    )}
                    {bankInfo.accountNumber && (
                      <div className="p-3 rounded-lg bg-[hsl(var(--muted))]/50 border border-border">
                        <div className="text-xs text-[hsl(var(--foreground))]/60 mb-1">N° de Cuenta</div>
                        <div className="font-medium flex items-center justify-between">
                          {bankInfo.accountNumber}
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(bankInfo.accountNumber!)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {bankInfo.accountHolder && (
                      <div className="p-3 rounded-lg bg-[hsl(var(--muted))]/50 border border-border">
                        <div className="text-xs text-[hsl(var(--foreground))]/60 mb-1">Titular</div>
                        <div className="font-medium">{bankInfo.accountHolder}</div>
                      </div>
                    )}
                    {bankInfo.rut && (
                      <div className="p-3 rounded-lg bg-[hsl(var(--muted))]/50 border border-border">
                        <div className="text-xs text-[hsl(var(--foreground))]/60 mb-1">RUT</div>
                        <div className="font-medium flex items-center justify-between">
                          {bankInfo.rut}
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(bankInfo.rut!)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {bankInfo.email && (
                      <div className="p-3 rounded-lg bg-[hsl(var(--muted))]/50 border border-border">
                        <div className="text-xs text-[hsl(var(--foreground))]/60 mb-1">Email</div>
                        <div className="font-medium flex items-center justify-between">
                          {bankInfo.email}
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(bankInfo.email!)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 sm:col-span-2">
                      <div className="text-xs text-[hsl(var(--foreground))]/60 mb-1">Monto a transferir</div>
                      <div className="font-bold text-xl text-[hsl(var(--primary))] flex items-center justify-between">
                        {formatCurrency(selectedPlan?.price || 0, selectedPlan?.currency)}
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(String(selectedPlan?.price || 0))}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Proof */}
                <div className="space-y-3">
                  <Label>Comprobante de transferencia (opcional)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    {proofFile && (
                      <Button
                        variant="outline"
                        onClick={handleUploadProof}
                        disabled={proofUploading}
                      >
                        {proofUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--foreground))]/60">
                    Puedes subir una imagen o PDF de tu comprobante para agilizar la verificación
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                  <Button onClick={handleConfirmTransfer} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Ya realicé la transferencia
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <Card className="border-green-500/20">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">¡Solicitud Enviada!</h2>
                  <p className="text-[hsl(var(--foreground))]/60 max-w-md mx-auto">
                    {selectedProvider === "transfer" ? (
                      "Tu pago está pendiente de verificación. Un administrador validará tu transferencia pronto."
                    ) : (
                      "Tu pago ha sido procesado correctamente. Tu suscripción estará activa en breve."
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-[hsl(var(--muted))]/50 max-w-sm mx-auto">
                  <Clock className="h-5 w-5 text-[hsl(var(--foreground))]/60" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Tiempo de verificación</div>
                    <div className="text-xs text-[hsl(var(--foreground))]/60">
                      Normalmente dentro de 24 horas hábiles
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                  <Button asChild variant="outline">
                    <a href={`${prefix}/app/billing`}>
                      Ver mis pagos
                    </a>
                  </Button>
                  <Button asChild>
                    <a href={`${prefix}/app`}>
                      Ir al inicio
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPlan ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--foreground))]/60">Plan</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--foreground))]/60">Precio</span>
                    <span className="font-bold">
                      {formatCurrency(selectedPlan.price, selectedPlan.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--foreground))]/60">Frecuencia</span>
                    <span>
                      {selectedPlan.type === "MONTHLY" ? "Mensual" : selectedPlan.type === "QUARTERLY" ? "Trimestral" : "Anual"}
                    </span>
                  </div>
                  {step >= 2 && selectedProvider && (
                    <div className="flex justify-between text-sm pt-2 border-t border-border">
                      <span className="text-[hsl(var(--foreground))]/60">Método</span>
                      <span>{PAYMENT_PROVIDERS.find(p => p.id === selectedProvider)?.name}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-lg text-[hsl(var(--primary))]">
                        {formatCurrency(selectedPlan.price, selectedPlan.currency)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[hsl(var(--foreground))]/60">
                  Selecciona un plan para ver el resumen
                </p>
              )}
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-[hsl(var(--muted))]/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[hsl(var(--foreground))]/60 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium mb-1">¿Necesitas ayuda?</h4>
                  <p className="text-xs text-[hsl(var(--foreground))]/60">
                    Contacta a {academy.name} si tienes dudas sobre los planes o el proceso de pago.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
