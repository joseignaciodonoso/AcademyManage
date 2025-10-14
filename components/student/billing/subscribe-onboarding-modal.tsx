"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type Plan = {
  id: string
  name: string
  price: number
  currency: string
  type?: string
  classesPerMonth?: number | null
  unlimitedClasses?: boolean | null
}

export function SubscribeOnboardingModal({
  openByDefault,
  plans,
  studentName,
}: {
  openByDefault?: boolean
  plans: Plan[]
  studentName?: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(!!openByDefault)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!selected && plans?.length) setSelected(plans[0].id)
  }, [plans, selected])

  const planMap = useMemo(() => Object.fromEntries(plans.map(p => [p.id, p])), [plans])

  const goCheckout = () => {
    if (!selected) return
    router.push(`/app/checkout?planId=${encodeURIComponent(selected)}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg border-border bg-[hsl(var(--background))]/80 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">¡Bienvenido{studentName ? `, ${studentName}` : ""}! 👋</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Ya formas parte del equipo. Elige tu plan y activa tu acceso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-[hsl(var(--muted))]/40 border-dashed">
            <div className="text-sm text-muted-foreground">Selecciona tu plan</div>
            <RadioGroup value={selected ?? undefined} onValueChange={setSelected as any} className="mt-3 space-y-3">
              {plans.map((p) => (
                <Label key={p.id} htmlFor={p.id} className="block">
                  <div className={`flex items-center gap-3 rounded-xl border p-3 hover:bg-[hsl(var(--muted))]/50 transition ${selected===p.id?"border-[hsl(var(--primary))] bg-[hsl(var(--muted))]/60":"border-border"}`}>
                    <RadioGroupItem id={p.id} value={p.id} />
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.unlimitedClasses ? "Clases ilimitadas" : p.classesPerMonth ? `${p.classesPerMonth} clases/mes` : "Acceso al contenido y clases"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {new Intl.NumberFormat("es-CL", { style: "currency", currency: p.currency || "CLP" }).format(p.price)}
                      </div>
                      <div className="text-xs text-muted-foreground">{(p.type||"MONTHLY") === "MONTHLY" ? "al mes" : p.type?.toLowerCase()}</div>
                    </div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </Card>

          <Button className="w-full h-12 text-base" onClick={goCheckout} disabled={!selected}>
            Inscribirme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
