import "server-only"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PaymentHistory } from "@/components/student/billing/payment-history"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BillingPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect(`/${params.orgSlug}/login`)
  }

  // Get user's membership status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  const membership = user?.memberships[0]
  const hasActivePlan = membership?.status === "ACTIVE" || membership?.status === "TRIAL"
  const isPending = membership?.status === "PAST_DUE"

  const prefix = `/${params.orgSlug}`

  const formatCurrency = (amount: number, currency = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>
      case "TRIAL":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Clock className="w-3 h-3 mr-1" />Prueba</Badge>
      case "PAST_DUE":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mis Pagos</h1>
          <p className="text-[hsl(var(--foreground))]/60">Historial de pagos y estado de tu suscripción</p>
        </div>
        {!hasActivePlan && (
          <Button asChild>
            <Link href={`${prefix}/app/subscribe`}>
              <Plus className="mr-2 h-4 w-4" />
              {isPending ? "Completar pago" : "Activar suscripción"}
            </Link>
          </Button>
        )}
      </div>

      {/* Current Plan Status */}
      {membership && (
        <Card className={`border-l-4 ${
          hasActivePlan ? "border-l-green-500" : isPending ? "border-l-yellow-500" : "border-l-gray-500"
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Estado de Suscripción
              </CardTitle>
              {getStatusBadge(membership.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-[hsl(var(--foreground))]/60">Plan</div>
                <div className="font-semibold">{membership.plan.name}</div>
              </div>
              <div>
                <div className="text-sm text-[hsl(var(--foreground))]/60">Precio</div>
                <div className="font-semibold">
                  {formatCurrency(membership.plan.price, membership.plan.currency)}
                  <span className="text-sm font-normal text-[hsl(var(--foreground))]/60">
                    /{membership.plan.type === "MONTHLY" ? "mes" : "año"}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-[hsl(var(--foreground))]/60">Clases</div>
                <div className="font-semibold">
                  {membership.plan.unlimitedClasses 
                    ? "Ilimitadas" 
                    : membership.plan.classesPerMonth 
                      ? `${membership.plan.classesPerMonth}/mes`
                      : "Básico"
                  }
                </div>
              </div>
            </div>

            {isPending && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-600">Pago pendiente de verificación</div>
                    <p className="text-sm text-[hsl(var(--foreground))]/60">
                      Tu transferencia está siendo verificada. Este proceso puede tomar hasta 24 horas hábiles.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Plan Message */}
      {!membership && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-full bg-[hsl(var(--muted))]/50 w-fit mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-[hsl(var(--foreground))]/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sin suscripción activa</h3>
            <p className="text-[hsl(var(--foreground))]/60 max-w-md mx-auto mb-4">
              Activa una suscripción para acceder a todas las clases y contenido de la academia.
            </p>
            <Button asChild>
              <Link href={`${prefix}/app/subscribe`}>
                Activar suscripción
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <PaymentHistory prefix={prefix} />
    </div>
  )
}
