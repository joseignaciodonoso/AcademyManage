import "server-only"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SubscriptionFlow } from "@/components/student/subscription/subscription-flow"

export const dynamic = "force-dynamic"

export default async function SubscribePage({
  params,
  searchParams,
}: {
  params: { orgSlug: string }
  searchParams: { planId?: string; step?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect(`/${params.orgSlug}/login`)
  if (session.user.role !== "STUDENT") redirect("/unauthorized")

  // Get academy by slug
  const academy = await prisma.academy.findUnique({
    where: { slug: params.orgSlug },
    select: { 
      id: true, 
      name: true, 
      logoUrl: true,
      // Payment config
      mercadopagoEnabled: true,
      khipuEnabled: true,
      flowEnabled: true,
      transferEnabled: true,
      bankName: true,
      bankAccountType: true,
      bankAccountNumber: true,
      bankAccountHolder: true,
      bankAccountRut: true,
      bankAccountEmail: true,
    },
  })

  if (!academy) redirect("/404")

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, academyId: true },
  })

  if (!user) redirect(`/${params.orgSlug}/login`)

  // Ensure user is linked to academy
  if (!user.academyId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { academyId: academy.id },
    })
  }

  // Get available plans
  const plans = await prisma.plan.findMany({
    where: { academyId: academy.id, status: "ACTIVE" },
    orderBy: { price: "asc" },
  })

  // Check if user already has pending membership
  const pendingMembership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      status: { in: ["TRIAL", "PAST_DUE"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  })

  // Build payment methods config
  const paymentMethods = {
    mercadopago: academy.mercadopagoEnabled ?? false,
    khipu: academy.khipuEnabled ?? false,
    flow: academy.flowEnabled ?? false,
    transfer: academy.transferEnabled ?? true, // Default enabled
  }

  const bankInfo = academy.transferEnabled ? {
    bankName: academy.bankName,
    accountType: academy.bankAccountType,
    accountNumber: academy.bankAccountNumber,
    accountHolder: academy.bankAccountHolder,
    rut: academy.bankAccountRut,
    email: academy.bankAccountEmail,
  } : null

  return (
    <SubscriptionFlow
      user={{ id: user.id, name: user.name || "", email: user.email }}
      academy={{ id: academy.id, name: academy.name, logoUrl: academy.logoUrl, slug: params.orgSlug }}
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        type: p.type,
        classesPerMonth: p.classesPerMonth,
        unlimitedClasses: p.unlimitedClasses,
        description: null,
      }))}
      paymentMethods={paymentMethods}
      bankInfo={bankInfo}
      initialPlanId={searchParams.planId}
      initialStep={searchParams.step ? parseInt(searchParams.step) : 1}
      pendingMembership={pendingMembership ? {
        id: pendingMembership.id,
        planId: pendingMembership.planId,
        planName: pendingMembership.plan.name,
        status: pendingMembership.status,
      } : null}
      prefix={`/${params.orgSlug}`}
    />
  )
}
