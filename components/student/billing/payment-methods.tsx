"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Smartphone, Building2, AlertCircle } from "lucide-react"
import type { OdooAcquirer } from "@/lib/odoo/connector"

interface PaymentMethodsProps {
  membershipId?: string
  amount: number
  description: string
  onPaymentInitiated?: (checkoutUrl: string, externalRef: string) => void
}

export function PaymentMethods({ membershipId, amount, description, onPaymentInitiated }: PaymentMethodsProps) {
  const [acquirers, setAcquirers] = useState<OdooAcquirer[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAcquirers()
  }, [])

  const fetchAcquirers = async () => {
    try {
      const response = await fetch("/api/billing/odoo/acquirers")
      if (!response.ok) throw new Error("Error al cargar métodos de pago")

      const data = await response.json()
      setAcquirers(data.acquirers)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (acquirerId: number) => {
    setCreating(true)
    setError("")

    try {
      const response = await fetch("/api/billing/odoo/create-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId,
          amount,
          description,
          type: membershipId ? "subscription" : "invoice",
          acquirerId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear enlace de pago")
      }

      const { checkoutUrl, externalRef } = await response.json()

      if (onPaymentInitiated) {
        onPaymentInitiated(checkoutUrl, externalRef)
      } else {
        // Redirect to Odoo checkout
        window.location.href = checkoutUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setCreating(false)
    }
  }

  const getAcquirerIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "mercadopago":
        return <CreditCard className="h-5 w-5" />
      case "webpay":
        return <Building2 className="h-5 w-5" />
      case "khipu":
        return <Smartphone className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Cargando métodos de pago...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (acquirers.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No hay métodos de pago disponibles en este momento.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecciona tu método de pago</CardTitle>
        <CardDescription>
          Total a pagar: <strong>{formatCurrency(amount)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3">
          {acquirers.map((acquirer) => (
            <Button
              key={acquirer.id}
              variant="outline"
              className="h-auto p-4 justify-start bg-transparent"
              onClick={() => handlePayment(acquirer.id)}
              disabled={creating}
            >
              <div className="flex items-center gap-3 w-full">
                {getAcquirerIcon(acquirer.provider)}
                <div className="flex-1 text-left">
                  <div className="font-medium">{acquirer.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">{acquirer.provider}</div>
                </div>
                <div className="flex items-center gap-2">
                  {acquirer.state === "test" && (
                    <Badge variant="secondary" className="text-xs">
                      Prueba
                    </Badge>
                  )}
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Serás redirigido a la plataforma de pago segura para completar tu transacción
        </div>
      </CardContent>
    </Card>
  )
}
