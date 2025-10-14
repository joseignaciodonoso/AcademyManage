"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PaymentProof } from "@/components/student/billing/payment-proof"

export type PlanDTO = {
  id: string
  name: string
  price: number
  currency: string
  type?: string
  classesPerMonth?: number | null
  unlimitedClasses?: boolean | null
}

const PROVIDERS = [
  { id: "mercadopago", name: "Mercado Pago", disabled: true },
  { id: "khipu", name: "Khipu", disabled: true },
  { id: "webpay", name: "Webpay (Transbank)", disabled: true },
  { id: "transfer", name: "Transferencia", disabled: false },
] as const

type Props = { plans: PlanDTO[]; initialStep?: 1|2|3; initialPlanId?: string | null; initialProvider?: string | null }

export function SubscribeWizard({ plans, initialStep, initialPlanId, initialProvider }: Props) {
  const router = useRouter()
  const search = useSearchParams()
  const [step, setStep] = useState<1 | 2 | 3 | 4>((() => {
    const s = Number(search.get("step") || initialStep || 1)
    return (s === 2 ? 2 : s === 3 ? 3 : s === 4 ? 4 : 1) as 1|2|3|4
  })())
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>(initialProvider || search.get("provider") || "transfer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<any | null>(null) // transfer instructions or other info
  const [membershipId, setMembershipId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const p = initialPlanId || search.get("planId")
    if (p) {
      setSelectedPlanId(String(p))
      return
    }
    if (!selectedPlanId && plans?.length) setSelectedPlanId(plans[0].id)
  }, [plans, selectedPlanId, initialPlanId, search])

  const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId) || null, [plans, selectedPlanId])
  const recommendedPlanId = useMemo(() => {
    const unlimited = plans.find(p => p.unlimitedClasses)
    if (unlimited) return unlimited.id
    const cheapest = [...plans].sort((a,b)=>a.price-b.price)[0]
    return cheapest?.id
  }, [plans])

  const formatCL = (amount?: number, currency = "CLP") =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency }).format(amount || 0)

  const goNext = async () => {
    try {
      setError(null)
      if (step === 1) {
        if (!selectedPlanId) return
        setLoading(true)
        // Suscribe (crea membresía en TRIAL/PAST_DUE)
        const r = await fetch("/api/student/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlanId }),
        })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || "No se pudo activar el plan")
        setMembershipId(d.membershipId)
        setStep(2)
        const qs = new URLSearchParams(search.toString())
        qs.set("step", "2")
        if (selectedPlanId) qs.set("planId", selectedPlanId)
        router.replace(`/app/subscribe?${qs.toString()}`)
      } else if (step === 2) {
        if (!selectedPlanId) return
        setLoading(true)
        // Solo transferencia habilitada: traer instrucciones simples desde el mismo endpoint si existe
        try {
          const r = await fetch("/api/checkout/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId: selectedPlanId, provider: selectedProvider, membershipId }),
          })
          const d = await r.json().catch(() => ({}))
          if (!r.ok && selectedProvider !== "transfer") throw new Error(d.error || "No se pudo iniciar el pago")
          if (d.instructions) setInfo(d.instructions)
        } catch {}
        setStep(3)
        const qs = new URLSearchParams(search.toString())
        qs.set("step", "3")
        qs.set("planId", selectedPlanId)
        qs.set("provider", selectedProvider)
        router.replace(`/app/subscribe?${qs.toString()}`)
      }
    } catch (e: any) {
      setError(e.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setError(null)
    if (step === 2) {
      setStep(1)
      const qs = new URLSearchParams(search.toString())
      qs.set("step", "1")
      if (selectedPlanId) qs.set("planId", selectedPlanId)
      router.replace(`/app/subscribe?${qs.toString()}`)
    }
    if (step === 3) {
      setStep(2)
      const qs = new URLSearchParams(search.toString())
      qs.set("step", "2")
      if (selectedPlanId) qs.set("planId", selectedPlanId)
      if (selectedProvider) qs.set("provider", selectedProvider)
      router.replace(`/app/subscribe?${qs.toString()}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-3 text-sm">
        <div className={`px-3 py-1 rounded-full border ${step>=1?"bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/40":"border-border"}`}>1. Plan</div>
        <div className="h-px w-8 bg-border" />
        <div className={`px-3 py-1 rounded-full border ${step>=2?"bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/40":"border-border"}`}>2. Método</div>
        <div className="h-px w-8 bg-border" />
        <div className={`px-3 py-1 rounded-full border ${step>=3?"bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/40":"border-border"}`}>3. Pago</div>
        <div className="h-px w-8 bg-border" />
        <div className={`px-3 py-1 rounded-full border ${step>=4?"bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/40":"border-border"}`}>4. Éxito</div>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-2 bg-[hsl(var(--primary))] transition-all"
          style={{ width: `${step===1?25:step===2?50:step===3?75:100}%` }}
        />
      </div>

      {error && (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Step 1: plan */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Elige tu plan</CardTitle>
                <CardDescription>Selecciona el plan que más te acomode</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPlanId ?? undefined} onValueChange={setSelectedPlanId as any} className="space-y-3">
                  {plans.map((p) => (
                    <Label key={p.id} htmlFor={p.id} className="block">
                      <div className={`relative flex items-center gap-3 rounded-xl border p-4 hover:shadow-sm hover:bg-[hsl(var(--muted))]/50 transition ${selectedPlanId===p.id?"border-[hsl(var(--primary))] bg-[hsl(var(--muted))]/60":"border-border"}`}>
                        <RadioGroupItem id={p.id} value={p.id} />
                        <div className="flex-1">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.unlimitedClasses ? "Clases ilimitadas" : p.classesPerMonth ? `${p.classesPerMonth} clases/mes` : "Acceso a contenido y clases"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCL(p.price, p.currency || "CLP")}</div>
                          <div className="text-xs text-muted-foreground">{(p.type||"MONTHLY") === "MONTHLY" ? "al mes" : p.type?.toLowerCase()}</div>
                        </div>
                        {recommendedPlanId===p.id && (
                          <span className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary))] text-white">Recomendado</span>
                        )}
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
                <div className="flex justify-end gap-2 mt-6">
                  <Button onClick={goNext} disabled={!selectedPlanId || loading}>{loading?"Guardando...":"Continuar"}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: method */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Método de pago</CardTitle>
                <CardDescription>Elige cómo quieres pagar tu suscripción {selectedPlan?`(${selectedPlan.name} – ${formatCL(selectedPlan.price, selectedPlan.currency)})`:""}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedProvider} onValueChange={(v: string)=>{ setSelectedProvider(v); const qs = new URLSearchParams(search.toString()); if (selectedPlanId) qs.set("planId", selectedPlanId); qs.set("step","2"); qs.set("provider", v); router.replace(`/app/subscribe?${qs.toString()}`) }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROVIDERS.map((p) => (
                    <Label key={p.id} htmlFor={p.id} className="block">
                      <div className={`flex items-center gap-3 rounded-xl border p-4 hover:shadow-sm hover:bg-[hsl(var(--muted))]/50 transition ${selectedProvider===p.id?"border-[hsl(var(--primary))] bg-[hsl(var(--muted))]/60":"border-border"} ${p.disabled?"opacity-60 cursor-not-allowed":""}`}>
                        <RadioGroupItem id={p.id} value={p.id} disabled={p.disabled} />
                        <div className="font-medium">{p.name} {p.disabled && <span className="ml-2 text-xs text-muted-foreground">(Próximamente)</span>}</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
                <div className="flex justify-between gap-2 mt-6">
                  <Button variant="outline" onClick={goBack}>Atrás</Button>
                  <Button onClick={goNext} disabled={loading}>{loading?"Procesando...":"Continuar"}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: pay/transfer */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Completar pago</CardTitle>
                <CardDescription>
                  {info?.redirected ? "Te redirigimos a la pasarela. Vuelve cuando termines para ver tu estado." : info ? "Realiza la transferencia y sube tu comprobante" : "Sigue las instrucciones de tu método."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {info && info.bank && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3"><span className="text-muted-foreground">Banco</span><div className="font-medium">{info.bank}</div></div>
                    <div className="rounded-lg border p-3"><span className="text-muted-foreground">Cuenta</span><div className="font-medium">{info.account}</div></div>
                    <div className="rounded-lg border p-3"><span className="text-muted-foreground">RUT</span><div className="font-medium">{info.rut}</div></div>
                    <div className="rounded-lg border p-3"><span className="text-muted-foreground">Email</span><div className="font-medium">{info.email}</div></div>
                    <div className="rounded-lg border p-3 md:col-span-2"><span className="text-muted-foreground">Monto</span><div className="font-medium">{formatCL(info.amount, info.currency)}</div></div>
                  </div>
                )}
                {selectedProvider === "transfer" && (
                  <PaymentProof membershipId={membershipId} amount={selectedPlan?.price} onSubmitted={() => { setStep(4); const qs = new URLSearchParams(search.toString()); qs.set("step","4"); if (selectedPlanId) qs.set("planId", selectedPlanId); if (selectedProvider) qs.set("provider", selectedProvider); router.replace(`/app/subscribe?${qs.toString()}`) }} />
                )}
                <div className="flex justify-between gap-2">
                  <Button variant="outline" onClick={goBack}>Atrás</Button>
                  <Button onClick={() => { setStep(4); const qs = new URLSearchParams(search.toString()); qs.set("step","4"); if (selectedPlanId) qs.set("planId", selectedPlanId); if (selectedProvider) qs.set("provider", selectedProvider); router.replace(`/app/subscribe?${qs.toString()}`) }}>
                    Confirmar transferencia
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: success */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>¡Solicitud enviada!</CardTitle>
                <CardDescription>Tu comprobante de transferencia ha sido registrado. Un administrador validará tu pago.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm rounded-lg border p-3 bg-[hsl(var(--muted))]/40">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-600"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </div>
                  <div>
                    <div className="font-medium">Pago pendiente de aprobación</div>
                    <div className="text-muted-foreground">Aparecerá en la sección "Pagos" del administrador y en sus notificaciones.</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button asChild><a href="/app/billing">Ir a Mis pagos</a></Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: persistent summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Tu selección actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {selectedPlan ? (
                <>
                  <div className="flex justify-between"><span>Plan</span><span className="font-medium">{selectedPlan.name}</span></div>
                  <div className="flex justify-between"><span>Total</span><span className="font-semibold">{formatCL(selectedPlan.price, selectedPlan.currency)}</span></div>
                  <div className="text-xs text-muted-foreground">
                    Paso actual: {step===1?"Plan":step===2?"Método de pago":step===3?"Pago":"Éxito"}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Selecciona un plan para ver el resumen</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
