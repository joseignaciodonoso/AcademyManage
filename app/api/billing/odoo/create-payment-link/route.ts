import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createOdooConnector } from "@/lib/odoo/connector"
import { requirePermission } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreatePaymentLinkSchema = z.object({
  membershipId: z.string().optional(),
  amount: z.number().positive(),
  description: z.string(),
  type: z.enum(["subscription", "invoice"]),
  acquirerId: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    requirePermission(session.user.role, "payment:write")

    if (!session.user.academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const body = await request.json()
    const { membershipId, amount, description, type, acquirerId } = CreatePaymentLinkSchema.parse(body)

    const odooConnector = createOdooConnector(session.user.academyId)

    // Generate unique external reference
    const externalRef = `${session.user.academyId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Ensure partner exists in Odoo
    const partnerId = await odooConnector.ensurePartner({
      name: session.user.name || session.user.email,
      email: session.user.email,
      externalId: session.user.id,
    })

    let docId: number

    if (type === "subscription" && membershipId) {
      // Handle subscription payment
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId },
        include: { plan: true },
      })

      if (!membership) {
        return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 })
      }

      // Ensure product exists in Odoo
      const productId = await odooConnector.ensureProduct({
        name: membership.plan.name,
        price: membership.plan.price,
        recurringRuleType: membership.plan.type === "MONTHLY" ? "monthly" : "yearly",
        externalId: membership.plan.id,
      })

      // Ensure subscription exists in Odoo
      docId = await odooConnector.ensureSubscription({
        partnerId,
        templateId: productId,
        externalId: membershipId,
      })
    } else {
      // Handle invoice payment
      docId = await odooConnector.ensureInvoice({
        partnerId,
        amount,
        description,
        externalId: externalRef,
      })
    }

    // Create payment link
    const paymentLink = await odooConnector.createPaymentLink({
      docType: type,
      docId,
      amount,
      currency: "CLP",
      externalRef,
      returnUrl: `${process.env.PAYMENT_RETURN_SUCCESS_URL}?ref=${externalRef}`,
      cancelUrl: `${process.env.PAYMENT_RETURN_FAIL_URL}?ref=${externalRef}`,
      acquirerId,
    })

    // Create payment record in our database
    await prisma.payment.create({
      data: {
        academyId: session.user.academyId,
        membershipId,
        amount,
        currency: "CLP",
        status: "PENDING",
        type: type === "subscription" ? "SUBSCRIPTION" : "INVOICE",
        externalRef,
        odooTransactionId: paymentLink.transactionId?.toString(),
      },
    })

    return NextResponse.json({
      checkoutUrl: paymentLink.checkoutUrl,
      externalRef: paymentLink.externalRef,
    })
  } catch (error) {
    console.error("Error creating payment link:", error)
    return NextResponse.json({ error: "Error al crear enlace de pago" }, { status: 500 })
  }
}
