"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

export function PlanPicker({ plans }: { plans: Plan[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const formatCurrency = (amount: number, currency = "CLP") =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount)

  const subscribe = async (planId: string) => {
    setLoadingId(planId)
    setError(null)
    try {
      const res = await fetch("/api/student/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo activar el plan")
      }
      // notify parent if available
      ;(window as any).__onStudentSubscribed?.()
      // Refresh billing page to show active membership
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Ocurrió un error inesperado")
    } finally {
      setLoadingId(null)
    }
  }

  if (!plans || plans.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No hay planes disponibles en tu academia por ahora.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plans.map((p) => (
        <Card key={p.id} className="h-full">
          <CardHeader>
            <CardTitle>{p.name}</CardTitle>
            <CardDescription>
              {formatCurrency(p.price, p.currency)} • {p.type.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>{p.unlimitedClasses ? "Clases ilimitadas" : `${p.classesPerMonth || 0} clases por mes`}</li>
              <li>Acceso a contenido incluido</li>
              {p.trialDays && p.trialDays > 0 && <li>Prueba de {p.trialDays} días</li>}
            </ul>
            <Button className="w-full" onClick={() => subscribe(p.id)} disabled={loadingId === p.id}>
              {loadingId === p.id ? "Procesando..." : "Inscribirme"}
            </Button>
            {error && <div className="text-xs text-red-500">{error}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
