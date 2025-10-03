import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CurrentPlan } from "@/components/student/billing/current-plan"
import { PaymentHistory } from "@/components/student/billing/payment-history"
import { PaymentMethods } from "@/components/student/billing/payment-methods"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default async function BillingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Get user's active membership
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { status: { in: ["ACTIVE", "PAST_DUE", "TRIAL"] } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  if (!user) {
    redirect("/auth/signin")
  }

  const activeMembership = user.memberships[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación y Pagos</h1>
        <p className="text-muted-foreground">Gestiona tu plan, pagos y métodos de pago</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {activeMembership ? (
            <CurrentPlan
              membership={activeMembership}
              onUpgrade={() => {
                // TODO: Implement plan upgrade flow
              }}
              onPayNow={() => {
                // TODO: Implement payment flow
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No tienes un plan activo</CardTitle>
                <CardDescription>Selecciona un plan para comenzar tu entrenamiento</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Necesitas activar un plan para acceder a las clases y contenido de la academia.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <PaymentHistory />
        </div>

        {/* Payment Methods - Takes 1 column */}
        <div className="space-y-6">
          {activeMembership?.status === "PAST_DUE" && (
            <Card>
              <CardHeader>
                <CardTitle>Pago Pendiente</CardTitle>
                <CardDescription>Tu membresía está vencida</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethods
                  membershipId={activeMembership.id}
                  amount={activeMembership.plan.price}
                  description={`Pago de ${activeMembership.plan.name}`}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Información de Facturación</CardTitle>
              <CardDescription>Detalles de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Email de Facturación</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>

              {user.phone && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Teléfono</div>
                  <div className="text-sm text-muted-foreground">{user.phone}</div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Moneda</div>
                <div className="text-sm text-muted-foreground">Peso Chileno (CLP)</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
