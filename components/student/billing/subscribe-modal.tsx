"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PlanPicker } from "@/components/student/billing/plan-picker"
import { PaymentProof } from "@/components/student/billing/payment-proof"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Plan = {
  id: string
  name: string
  price: number
  currency: string
  type: string
  classesPerMonth?: number | null
  unlimitedClasses: boolean
  trialDays?: number
}

export function SubscribeModal({
  defaultOpen = true,
  plans: initialPlans,
  hasAcademy,
}: {
  defaultOpen?: boolean
  plans: Plan[]
  hasAcademy: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [justSubscribed, setJustSubscribed] = useState(false)
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [error, setError] = useState<string | null>(null)

  // Listen to refresh after subscribe
  useEffect(() => {
    // Register global callback fired by PlanPicker after successful subscribe
    ;(window as any).__onStudentSubscribed = () => {
      setJustSubscribed(true)
    }
    return () => {
      delete (window as any).__onStudentSubscribed
    }
  }, [])

  const handleSubscribed = () => {
    setJustSubscribed(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inscríbete ahora</DialogTitle>
          <DialogDescription>
            Elige tu plan y sube el comprobante para activar tu cuenta.
          </DialogDescription>
        </DialogHeader>

        {!hasAcademy ? (
          <Alert>
            <AlertDescription>
              Tu cuenta aún no está asociada a una academia. Contacta al administrador.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {!justSubscribed && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Selecciona un plan</div>
                <PlanPicker plans={plans} />
                {error && <div className="text-xs text-red-500">{error}</div>}
              </div>
            )}

            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Pago por transferencia</div>
              {justSubscribed && (
                <div className="text-xs text-emerald-600">Plan activado. Ahora sube tu comprobante para validar el pago.</div>
              )}
              <PaymentProof />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
