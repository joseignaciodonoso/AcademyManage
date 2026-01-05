import "server-only"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { headers } from "next/headers"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrentPlan } from "@/components/student/billing/current-plan"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle, CreditCard } from "lucide-react"

// Force dynamic rendering to ensure requestAsyncStorage is available
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
export const runtime = "nodejs"

export default async function PlanPage() {
  // Force server context by accessing headers
  headers()
  
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  if (session.user.role !== "STUDENT") redirect("/unauthorized")

  // Fetch all memberships to check status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!user) redirect("/auth/signin")

  // Find active/trial membership first
  const activeMembership = user.memberships.find(m => m.status === "ACTIVE" || m.status === "TRIAL")
  
  // Find pending payment membership
  const pendingMembership = user.memberships.find(m => m.status === "PENDING_PAYMENT")

  // No membership at all - redirect to subscribe
  if (!activeMembership && !pendingMembership) {
    redirect("/app/subscribe")
  }

  // Has pending payment membership - show payment required view
  if (!activeMembership && pendingMembership) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Plan</h1>
          <p className="text-muted-foreground">Estado de tu suscripción</p>
        </div>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-amber-800 dark:text-amber-200">Pago Pendiente</CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  Tu membresía está pendiente de pago
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">{pendingMembership.plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat("es-CL", { style: "currency", currency: pendingMembership.plan.currency }).format(pendingMembership.plan.price)}/mes
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-sm font-medium">
                  Pendiente
                </span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Para activar tu membresía, completa el proceso de pago. Una vez confirmado, tendrás acceso completo a todas las funcionalidades.
            </p>

            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link href="/app/subscribe?step=3">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Completar Pago
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/app/billing">Ver Historial</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>¿Qué incluye tu plan?</CardTitle>
            <CardDescription>Beneficios que tendrás una vez activo</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
              <li>Acceso a clases según tu plan</li>
              <li>Calendario de actividades</li>
              <li>Seguimiento de asistencia</li>
              <li>Contenido exclusivo para estudiantes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Has active membership - show normal view
  const m = activeMembership!
  const clientMembership = {
    id: m.id,
    status: m.status as any,
    startDate: m.startDate.toISOString(),
    endDate: m.endDate ? m.endDate.toISOString() : undefined,
    trialEndDate: (m as any).trialEndDate ? (m as any).trialEndDate.toISOString() : undefined,
    nextBillingDate: m.nextBillingDate ? m.nextBillingDate.toISOString() : undefined,
    plan: {
      id: m.plan.id,
      name: m.plan.name,
      price: m.plan.price,
      currency: m.plan.currency,
      type: (m.plan as any).type,
      unlimitedClasses: Boolean((m.plan as any).unlimitedClasses),
      classesPerMonth: (m.plan as any).classesPerMonth ?? undefined,
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Plan</h1>
        <p className="text-muted-foreground">Detalles de tu membresía</p>
      </div>

      <CurrentPlan membership={clientMembership as any} />

      <Card>
        <CardHeader>
          <CardTitle>Condiciones del Plan</CardTitle>
          <CardDescription>Información adicional sobre tu suscripción</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>Los pagos se procesan en CLP.</li>
            <li>Puedes cambiar o cancelar tu plan desde facturación.</li>
            <li>Si tienes dudas, contáctanos desde tu perfil.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
