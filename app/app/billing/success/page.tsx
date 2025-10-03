"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  const externalRef = searchParams.get("ref")

  useEffect(() => {
    if (!externalRef) {
      setStatus("error")
      return
    }

    checkPaymentStatus()
  }, [externalRef])

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/billing/odoo/transaction-status?externalRef=${externalRef}`)

      if (!response.ok) {
        throw new Error("Error al verificar el pago")
      }

      const data = await response.json()
      setPaymentDetails(data)

      if (data.status === "done") {
        setStatus("success")
      } else if (data.status === "error" || data.status === "cancel") {
        setStatus("error")
      } else {
        // Still processing, check again in a few seconds
        setTimeout(checkPaymentStatus, 3000)
      }
    } catch (error) {
      console.error("Error checking payment status:", error)
      setStatus("error")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h2 className="text-lg font-semibold mb-2">Verificando tu pago...</h2>
            <p className="text-sm text-muted-foreground text-center">
              Estamos confirmando tu transacción. Esto puede tomar unos momentos.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Error en el Pago</CardTitle>
            <CardDescription>Hubo un problema al procesar tu pago</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                No pudimos confirmar tu pago. Por favor, verifica con tu banco o intenta nuevamente.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <Link href="/app/billing">Volver a Pagos</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/app">Ir al Inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">¡Pago Exitoso!</CardTitle>
          <CardDescription>Tu pago ha sido procesado correctamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentDetails && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Monto:</span>
                <span className="text-sm">{formatCurrency(paymentDetails.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Referencia:</span>
                <span className="text-sm font-mono">{paymentDetails.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <span className="text-sm text-green-600 font-medium">Pagado</span>
              </div>
            </div>
          )}

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Tu membresía ha sido activada. Ya puedes acceder a todas las clases y contenido.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1 bg-transparent">
              <Link href="/app/billing">Ver Pagos</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/app">Ir al Inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
