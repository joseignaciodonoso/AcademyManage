import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    requirePermission(session.user.role as any, "payment:write")

    const { planId } = await request.json()
    if (!planId) return NextResponse.json({ error: "planId requerido" }, { status: 400 })

    // Load plan
    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan) return NextResponse.json({ error: "Plan no existe" }, { status: 404 })

    // Ensure user is in the same academy, otherwise attach
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    if (user.academyId && user.academyId !== plan.academyId) {
      return NextResponse.json({ error: "No puedes suscribirte a un plan de otra academia" }, { status: 403 })
    }

    if (!user.academyId) {
      await prisma.user.update({ where: { id: user.id }, data: { academyId: plan.academyId } })
    }

    // Check if user already has an active membership
    const existingActiveMembership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        status: { in: ["ACTIVE", "TRIAL"] },
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
    })

    // If user already has an active membership, don't allow creating a new one
    // They should renew or upgrade through payment, not create duplicate subscriptions
    if (existingActiveMembership) {
      return NextResponse.json({ 
        error: "Ya tienes una membresía activa. Para renovar o cambiar de plan, contacta con la academia.",
        existingMembershipId: existingActiveMembership.id 
      }, { status: 400 })
    }

    // Create new membership (TRIAL if plan has trialDays, else PENDING until payment)
    const now = new Date()
    const startDate = now
    const trialEndDate = plan.trialDays && plan.trialDays > 0 ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000) : null
    const status = trialEndDate ? "TRIAL" : "PENDING"

    const membership = await prisma.membership.create({
      data: {
        academyId: plan.academyId,
        userId: user.id,
        planId: plan.id,
        status,
        startDate,
        trialEndDate,
      },
      include: { plan: true },
    })

    return NextResponse.json({ ok: true, membershipId: membership.id, status: membership.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al suscribirse" }, { status: 500 })
  }
}
