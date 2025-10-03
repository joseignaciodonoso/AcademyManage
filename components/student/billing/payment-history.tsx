"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Eye, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Payment {
  id: string
  amount: number
  currency: string
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELED" | "REFUNDED"
  type: "SUBSCRIPTION" | "INVOICE" | "SETUP_FEE"
  createdAt: string
  paidAt?: string
  externalRef?: string
  acquirerCode?: string
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/student/payments")
      if (!response.ok) throw new Error("Error al cargar historial de pagos")

      const data = await response.json()
      setPayments(data.payments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: Payment["status"]) => {
    const statusConfig = {
      PENDING: { variant: "secondary" as const, icon: Clock, label: "Pendiente" },
      PROCESSING: { variant: "secondary" as const, icon: Clock, label: "Procesando" },
      PAID: { variant: "default" as const, icon: CheckCircle, label: "Pagado" },
      FAILED: { variant: "destructive" as const, icon: XCircle, label: "Fallido" },
      CANCELED: { variant: "secondary" as const, icon: XCircle, label: "Cancelado" },
      REFUNDED: { variant: "outline" as const, icon: AlertCircle, label: "Reembolsado" },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTypeLabel = (type: Payment["type"]) => {
    const typeLabels = {
      SUBSCRIPTION: "Suscripción",
      INVOICE: "Factura",
      SETUP_FEE: "Cuota de Inscripción",
    }
    return typeLabels[type]
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-pulse">Cargando historial de pagos...</div>
          </div>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historial de Pagos</CardTitle>
            <CardDescription>Todos tus pagos y transacciones</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-2">No tienes pagos registrados</div>
            <div className="text-sm">Los pagos aparecerán aquí una vez que realices tu primera transacción</div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(new Date(payment.createdAt), "dd MMM yyyy", { locale: es })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(payment.createdAt), "HH:mm")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeLabel(payment.type)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount, payment.currency)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.acquirerCode ? (
                          <Badge variant="outline" className="text-xs">
                            {payment.acquirerCode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
