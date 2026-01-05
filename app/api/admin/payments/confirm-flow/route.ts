import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFlowPaymentStatus } from "@/lib/payments/flow"

/**
 * POST /api/admin/payments/confirm-flow
 * Manually confirm pending Flow payments by checking their status with Flow API
 * This is needed because Flow can't reach localhost webhooks
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { paymentId } = body

    // If specific payment ID provided, confirm just that one
    if (paymentId) {
      const result = await confirmSinglePayment(paymentId)
      return NextResponse.json(result)
    }

    // Otherwise, check all pending Flow payments for this user's academy
    const academyId = session.user.academyId
    
    const pendingPayments = await prisma.payment.findMany({
      where: {
        academyId: academyId || undefined,
        status: "PENDING",
        method: "FLOW",
        odooTransactionId: { not: null }, // Has Flow token
      },
      include: { membership: true },
    })

    const results = []
    for (const payment of pendingPayments) {
      try {
        const result = await confirmSinglePayment(payment.id)
        results.push(result)
      } catch (e: any) {
        results.push({ paymentId: payment.id, error: e.message })
      }
    }

    return NextResponse.json({ 
      ok: true, 
      checked: pendingPayments.length,
      results 
    })
  } catch (error: any) {
    console.error("Confirm Flow payments error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function confirmSinglePayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { membership: true },
  })

  if (!payment) {
    return { paymentId, error: "Pago no encontrado" }
  }

  if (!payment.odooTransactionId) {
    return { paymentId, error: "Sin token de Flow" }
  }

  // Get status from Flow API
  const flowStatus = await getFlowPaymentStatus(payment.odooTransactionId)
  
  // Map Flow status: 1=Pending, 2=Paid, 3=Rejected, 4=Cancelled
  let newStatus: "PENDING" | "PAID" | "FAILED" | "CANCELED" = "PENDING"
  if (flowStatus.status === 2) {
    newStatus = "PAID"
  } else if (flowStatus.status === 3) {
    newStatus = "FAILED"
  } else if (flowStatus.status === 4) {
    newStatus = "CANCELED"
  }

  // Update payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      externalRef: `flow-${flowStatus.flowOrder}`,
      paidAt: newStatus === "PAID" ? new Date() : null,
      failureReason: newStatus === "FAILED" ? `Flow: ${flowStatus.statusStr}` : null,
    },
  })

  // If paid, activate membership
  if (newStatus === "PAID" && payment.membershipId) {
    await prisma.membership.update({
      where: { id: payment.membershipId },
      data: { status: "ACTIVE" },
    })

    // Expire other memberships
    if (payment.membership?.userId) {
      await prisma.membership.updateMany({
        where: {
          userId: payment.membership.userId,
          id: { not: payment.membershipId },
          status: { in: ["ACTIVE", "TRIAL"] },
        },
        data: { status: "EXPIRED" },
      })
    }
  }

  return {
    paymentId: payment.id,
    previousStatus: payment.status,
    newStatus,
    flowStatus: flowStatus.statusStr,
    membershipActivated: newStatus === "PAID" && !!payment.membershipId,
  }
}

/**
 * GET /api/admin/payments/confirm-flow
 * Check pending Flow payments without modifying them
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId

    const pendingPayments = await prisma.payment.findMany({
      where: {
        academyId: academyId || undefined,
        status: "PENDING",
        method: "FLOW",
      },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        odooTransactionId: true,
        membership: {
          select: {
            user: { select: { name: true, email: true } },
            plan: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ 
      ok: true, 
      count: pendingPayments.length,
      payments: pendingPayments 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
