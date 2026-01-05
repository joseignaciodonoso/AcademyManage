import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getFlowPaymentStatus, verifyFlowWebhookSignature } from "@/lib/payments/flow"

/**
 * POST /api/webhooks/flow
 * Webhook endpoint for Flow payment confirmations
 */
export async function POST(req: Request) {
  try {
    // Flow sends data as form-urlencoded
    const formData = await req.formData()
    const token = formData.get("token") as string
    
    if (!token) {
      console.error("Flow webhook: No token received")
      return NextResponse.json({ error: "Token requerido" }, { status: 400 })
    }

    console.log("Flow webhook received, token:", token)

    // Get payment status from Flow
    const flowStatus = await getFlowPaymentStatus(token)
    console.log("Flow payment status:", flowStatus)

    // Find our payment by commerceOrder (which is our payment ID)
    const payment = await prisma.payment.findUnique({
      where: { id: flowStatus.commerceOrder },
      include: { membership: true },
    })

    if (!payment) {
      console.error("Flow webhook: Payment not found for commerceOrder:", flowStatus.commerceOrder)
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    // Map Flow status to our status
    // Flow: 1=Pending, 2=Paid, 3=Rejected, 4=Cancelled
    let newStatus: "PENDING" | "PAID" | "FAILED" | "CANCELED" = "PENDING"
    if (flowStatus.status === 2) {
      newStatus = "PAID"
    } else if (flowStatus.status === 3) {
      newStatus = "FAILED"
    } else if (flowStatus.status === 4) {
      newStatus = "CANCELED"
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        externalRef: `flow-${flowStatus.flowOrder}`,
        paidAt: newStatus === "PAID" ? new Date() : null,
        failureReason: newStatus === "FAILED" ? `Flow status: ${flowStatus.statusStr}` : null,
      },
    })

    // If payment is confirmed, activate the membership
    if (newStatus === "PAID" && payment.membershipId) {
      // Activate this membership
      await prisma.membership.update({
        where: { id: payment.membershipId },
        data: { status: "ACTIVE" },
      })

      // Expire other active/trial memberships for this user
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

      console.log(`Flow webhook: Membership ${payment.membershipId} activated`)
    }

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (error: any) {
    console.error("Flow webhook error:", error)
    return NextResponse.json(
      { error: error.message || "Error procesando webhook" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/flow
 * Flow may also send GET requests for status checks
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token")
  
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 })
  }

  try {
    const flowStatus = await getFlowPaymentStatus(token)
    return NextResponse.json({ ok: true, status: flowStatus.statusStr })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
