import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createMercadoPagoPreference } from "@/lib/payments/mercadopago"

// Simple helpers
function notConfigured(provider: string) {
  return NextResponse.json({ error: `${provider} no está configurado. Usa Transferencia o contacta al admin.` }, { status: 400 })
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { planId, provider, membershipId } = body || {}
    if (!planId || !provider) return NextResponse.json({ error: "planId y provider son requeridos" }, { status: 400 })

    const plan = await prisma.plan.findUnique({ where: { id: String(planId) } })
    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

    // Create a lightweight internal payment-intent for traceability (optional)
    const intent = await prisma.payment.create({
      data: ({
        academyId: plan.academyId,
        membershipId: membershipId || null,
        amount: plan.price,
        currency: plan.currency || "CLP",
        status: "PENDING",
        type: "SUBSCRIPTION",
        method: String(provider).toUpperCase(),
      } as any),
    })

    // Provider routing
    switch (String(provider)) {
      case "mercadopago": {
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return notConfigured("Mercado Pago")
        const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3001"
        const pref = await createMercadoPagoPreference({ plan: { id: plan.id, name: plan.name, price: plan.price, currency: plan.currency || "CLP" }, paymentId: intent.id, baseUrl: base, userId: session.user.id })
        return NextResponse.json({ checkoutUrl: pref.init_point })
      }
      case "khipu": {
        const receiver = process.env.KHIPU_RECEIVER_ID
        const secret = process.env.KHIPU_SECRET
        if (!receiver || !secret) return notConfigured("Khipu")
        const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3001"
        const checkoutUrl = `${base}/app/subscribe/success?provider=khipu&status=success&paymentId=${intent.id}`
        return NextResponse.json({ checkoutUrl })
      }
      case "webpay": {
        const code = process.env.WEBPAY_COMMERCE_CODE
        const apiKey = process.env.WEBPAY_API_KEY
        if (!code || !apiKey) return notConfigured("Webpay")
        const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3001"
        const checkoutUrl = `${base}/app/subscribe/success?provider=webpay&status=success&paymentId=${intent.id}`
        return NextResponse.json({ checkoutUrl })
      }
      case "transfer": {
        const bank = process.env.TRANSFER_BANK_NAME || "Banco Ejemplo"
        const account = process.env.TRANSFER_ACCOUNT || "00 0000 0000"
        const rut = process.env.TRANSFER_RUT || "11.111.111-1"
        const email = process.env.TRANSFER_EMAIL || "pagos@academia.cl"
        return NextResponse.json({
          instructions: {
            bank,
            account,
            rut,
            email,
            amount: plan.price,
            currency: plan.currency || "CLP",
            paymentId: intent.id,
          },
        })
      }
      default:
        return NextResponse.json({ error: "Proveedor no soportado" }, { status: 400 })
    }
  } catch (e: any) {
    console.error("checkout session error", e)
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 })
  }
}
