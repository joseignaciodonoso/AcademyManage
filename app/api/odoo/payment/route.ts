import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import crypto from "crypto"
import { z } from "zod"

const WebhookPayloadSchema = z.object({
  transactionId: z.number(),
  docType: z.enum(["subscription", "invoice"]),
  docId: z.number(),
  status: z.enum(["draft", "pending", "authorized", "done", "cancel", "error"]),
  amount: z.number(),
  currency: z.string(),
  externalRef: z.string(),
  customerExternalId: z.string(),
  acquirerCode: z.string().optional(),
})

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.ODOO_WEBHOOK_SHARED_SECRET
  if (!secret) {
    console.error("ODOO_WEBHOOK_SHARED_SECRET not configured")
    return false
  }

  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const signature = headersList.get("X-Odoo-Signature")

    if (!signature) {
      return NextResponse.json({ error: "Firma faltante" }, { status: 400 })
    }

    const payload = await request.text()

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 })
    }

    const webhookData = WebhookPayloadSchema.parse(JSON.parse(payload))

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { externalRef: webhookData.externalRef },
      include: { membership: { include: { user: true } } },
    })

    if (!payment) {
      console.error(`Payment not found for external ref: ${webhookData.externalRef}`)
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:
          webhookData.status === "done"
            ? "PAID"
            : webhookData.status === "cancel"
              ? "CANCELED"
              : webhookData.status === "error"
                ? "FAILED"
                : "PROCESSING",
        paidAt: webhookData.status === "done" ? new Date() : null,
        failureReason: webhookData.status === "error" ? "Payment failed in Odoo" : null,
        odooTransactionId: webhookData.transactionId.toString(),
        acquirerCode: webhookData.acquirerCode,
      },
    })

    // Update membership status if payment is successful
    if (webhookData.status === "done" && payment.membershipId) {
      await prisma.membership.update({
        where: { id: payment.membershipId },
        data: {
          status: "ACTIVE",
          // Extend end date based on plan type
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for now
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        academyId: payment.academyId,
        userId: payment.membership?.user.id,
        action: "PAYMENT",
        resource: "payment",
        resourceId: payment.id,
        newValues: {
          status: updatedPayment.status,
          amount: webhookData.amount,
          transactionId: webhookData.transactionId,
        },
      },
    })

    // TODO: Send confirmation email to user
    // TODO: Update KPIs cache

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing payment webhook:", error)
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 })
  }
}
