"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Building2, AlertCircle } from "lucide-react"

interface PaymentMethodsProps {
  membershipId?: string
  amount: number
  description: string
  onPaymentInitiated?: (checkoutUrl: string, externalRef: string) => void
}

export function PaymentMethods({ membershipId, amount, description, onPaymentInitiated }: PaymentMethodsProps) {
  // Static providers shown as not available for now
  const providers = useMemo(
    () => [
      { id: "mp", name: "Mercado Pago", icon: <CreditCard className="h-5 w-5" /> },
      { id: "webpay", name: "Webpay", icon: <Building2 className="h-5 w-5" /> },
    ],
    []
  )

  const getAcquirerIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "mercadopago":
        return <CreditCard className="h-5 w-5" />
      case "webpay":
        return <Building2 className="h-5 w-5" />
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecciona tu método de pago</CardTitle>
        <CardDescription>
          Total a pagar: <strong>{formatCurrency(amount)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {providers.map((p) => (
            <Button key={p.id} variant="outline" className="h-auto p-4 justify-start bg-transparent opacity-60" disabled>
              <div className="flex items-center gap-3 w-full">
                {p.icon}
                <div className="flex-1 text-left">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">No disponible por ahora</div>
                </div>
                <Badge variant="secondary" className="text-xs">Próximamente</Badge>
              </div>
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Los pagos en línea estarán disponibles pronto. Por ahora, usa la opción "Subir Comprobante" para transferencias.
        </div>
      </CardContent>
    </Card>
  )
}
