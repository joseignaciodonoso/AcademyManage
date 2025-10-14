import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SubscribeWizard } from "@/components/student/checkout/subscribe-wizard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SubscribePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  if (session.user.role !== "STUDENT") redirect("/unauthorized")

  // Fetch user and ensure academy if single-academy mode
  let user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect("/auth/signin")

  if (!user.academyId) {
    const firstAcademy = await prisma.academy.findFirst({ select: { id: true } })
    if (firstAcademy) {
      await prisma.user.update({ where: { id: user.id }, data: { academyId: firstAcademy.id } })
      user = { ...user, academyId: firstAcademy.id }
    }
  }

  // Load plans for the user's academy (seed defaults if empty)
  let plans: any[] = []
  if (user.academyId) {
    plans = await prisma.plan.findMany({
      where: { academyId: user.academyId, status: "ACTIVE" },
      orderBy: { price: "asc" },
      take: 12,
    })
    if (plans.length === 0) {
      await prisma.plan.create({
        data: {
          academyId: user.academyId,
          name: "Plan Básico",
          slug: "plan-basico",
          type: "MONTHLY" as any,
          status: "ACTIVE" as any,
          price: 25000,
          currency: "CLP",
          classesPerMonth: 8,
          unlimitedClasses: false,
        },
      })
      await prisma.plan.create({
        data: {
          academyId: user.academyId,
          name: "Plan Ilimitado",
          slug: "plan-ilimitado",
          type: "MONTHLY" as any,
          status: "ACTIVE" as any,
          price: 45000,
          currency: "CLP",
          unlimitedClasses: true,
        },
      })
      plans = await prisma.plan.findMany({
        where: { academyId: user.academyId, status: "ACTIVE" },
        orderBy: { price: "asc" },
        take: 12,
      })
    }
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]">Inscripción en 3 pasos</h1>
        <p className="text-sm md:text-base text-muted-foreground">Elige tu plan, método de pago y completa el pago</p>
      </div>

      {plans.length > 0 ? (
        <SubscribeWizard plans={plans as any} />
      ) : (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--foreground))]">No hay planes disponibles</CardTitle>
            <CardDescription className="text-muted-foreground">Tu cuenta no está asociada a una academia o no hay planes activos.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Contacta a un administrador para que te asigne una academia o cree planes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
