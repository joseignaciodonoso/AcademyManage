import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrentPlan } from "@/components/student/billing/current-plan"

export default async function PlanPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  if (session.user.role !== "STUDENT") redirect("/unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { status: { in: ["ACTIVE", "TRIAL"] } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })
  if (!user) redirect("/auth/signin")

  const m = user.memberships[0]
  if (!m) redirect("/app/billing")

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
