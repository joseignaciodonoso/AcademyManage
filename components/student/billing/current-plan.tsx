"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, CreditCard, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"

interface CurrentPlanProps {
  membership: {
    id: string
    status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | "TRIAL"
    startDate: string
    endDate?: string
    trialEndDate?: string
    nextBillingDate?: string
    plan: {
      id: string
      name: string
      price: number
      currency: string
      type: "MONTHLY" | "QUARTERLY" | "YEARLY" | "UNLIMITED"
      unlimitedClasses: boolean
      classesPerMonth?: number
    }
  }
  onUpgrade?: () => void
  onPayNow?: () => void
}

export function CurrentPlan({ membership, onUpgrade, onPayNow }: CurrentPlanProps) {
  const formatCurrency = (amount: number, currency = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: typeof membership.status) => {
    const statusConfig = {
      ACTIVE: { variant: "default" as const, icon: CheckCircle, label: "Activo", color: "text-green-600" },
      TRIAL: { variant: "secondary" as const, icon: Clock, label: "Prueba", color: "text-blue-600" },
      PAST_DUE: { variant: "destructive" as const, icon: AlertTriangle, label: "Vencido", color: "text-red-600" },
      CANCELED: { variant: "secondary" as const, icon: AlertTriangle, label: "Cancelado", color: "text-gray-600" },
      EXPIRED: { variant: "outline" as const, icon: AlertTriangle, label: "Expirado", color: "text-gray-600" },
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

  const getPlanTypeLabel = (type: typeof membership.plan.type) => {
    const typeLabels = {
      MONTHLY: "Mensual",
      QUARTERLY: "Trimestral",
      YEARLY: "Anual",
      UNLIMITED: "Ilimitado",
    }
    return typeLabels[type]
  }

  const getDaysRemaining = () => {
    const endDate = membership.trialEndDate || membership.endDate
    if (!endDate) return null

    const days = differenceInDays(new Date(endDate), new Date())
    return Math.max(0, days)
  }

  const getProgressPercentage = () => {
    const startDate = new Date(membership.startDate)
    const endDate = membership.trialEndDate || membership.endDate
    if (!endDate) return 0

    const totalDays = differenceInDays(new Date(endDate), startDate)
    const remainingDays = getDaysRemaining() || 0
    const elapsedDays = totalDays - remainingDays

    return totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0
  }

  const daysRemaining = getDaysRemaining()
  const progressPercentage = getProgressPercentage()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {membership.plan.name}
                {getStatusBadge(membership.status)}
              </CardTitle>
              <CardDescription>
                {getPlanTypeLabel(membership.plan.type)} •{" "}
                {formatCurrency(membership.plan.price, membership.plan.currency)}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatCurrency(membership.plan.price, membership.plan.currency)}
              </div>
              <div className="text-sm text-muted-foreground">
                /{membership.plan.type === "MONTHLY" ? "mes" : membership.plan.type === "YEARLY" ? "año" : "período"}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Clases</div>
              <div className="text-sm text-muted-foreground">
                {membership.plan.unlimitedClasses ? "Ilimitadas" : `${membership.plan.classesPerMonth || 0} por mes`}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Acceso a Contenido</div>
              <div className="text-sm text-muted-foreground">Incluido</div>
            </div>
          </div>

          {/* Billing Period Progress */}
          {daysRemaining !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Período actual</span>
                <span>{daysRemaining} días restantes</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{format(new Date(membership.startDate), "dd MMM", { locale: es })}</span>
                <span>
                  {format(new Date(membership.trialEndDate || membership.endDate || new Date()), "dd MMM", {
                    locale: es,
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Next Billing Date */}
          {membership.nextBillingDate && membership.status === "ACTIVE" && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Próximo cobro: {format(new Date(membership.nextBillingDate), "dd MMM yyyy", { locale: es })}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {membership.status === "PAST_DUE" && onPayNow && (
              <Button onClick={onPayNow} className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar Ahora
              </Button>
            )}
            {onUpgrade && (
              <Button variant="outline" onClick={onUpgrade} className="flex-1 bg-transparent">
                Cambiar Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {membership.status === "TRIAL" && daysRemaining !== null && daysRemaining <= 3 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu período de prueba termina en {daysRemaining} días. Actualiza tu método de pago para continuar.
          </AlertDescription>
        </Alert>
      )}

      {membership.status === "PAST_DUE" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu pago está vencido. Actualiza tu método de pago para reactivar tu membresía.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
