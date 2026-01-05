import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { membershipId } = await request.json()
    if (!membershipId) {
      return NextResponse.json({ error: "membershipId requerido" }, { status: 400 })
    }

    // Verify membership belongs to user
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { plan: true, user: true },
    })

    if (!membership) {
      return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 })
    }

    if (membership.userId !== session.user.id) {
      return NextResponse.json({ error: "No tienes permiso para esta membresía" }, { status: 403 })
    }

    // Update membership status to PAST_DUE (waiting for payment verification)
    await prisma.membership.update({
      where: { id: membershipId },
      data: { status: "PAST_DUE" },
    })

    // Create a pending payment record
    const payment = await prisma.payment.create({
      data: {
        academyId: membership.academyId,
        userId: membership.userId,
        membershipId: membership.id,
        amount: membership.plan.price,
        currency: membership.plan.currency,
        method: "TRANSFER",
        status: "PENDING",
        description: `Pago de suscripción - ${membership.plan.name}`,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        academyId: membership.academyId,
        userId: session.user.id,
        action: "PAYMENT_TRANSFER_CONFIRMED",
        entityType: "Payment",
        entityId: payment.id,
        details: {
          membershipId,
          planName: membership.plan.name,
          amount: membership.plan.price,
          currency: membership.plan.currency,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      message: "Transferencia registrada. Tu pago será verificado pronto.",
    })
  } catch (e: any) {
    console.error("Error confirming transfer:", e)
    return NextResponse.json({ error: e.message || "Error al confirmar transferencia" }, { status: 500 })
  }
}
