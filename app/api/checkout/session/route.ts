import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createMercadoPagoPreference } from "@/lib/payments/mercadopago"
import { createFlowPayment } from "@/lib/payments/flow"

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

    const plan = await prisma.plan.findUnique({ 
      where: { id: String(planId) },
      include: { academy: true }
    })
    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    
    // Get academy payment settings from database
    const academy = plan.academy

    // Create a lightweight internal payment-intent for traceability (optional)
    const methodMap: Record<string, "MERCADOPAGO" | "KHIPU" | "FLOW" | "WEBPAY" | "TRANSFER" | "CASH" | "CARD" | "OTHER"> = {
      mercadopago: "MERCADOPAGO",
      khipu: "KHIPU",
      flow: "FLOW",
      webpay: "WEBPAY",
      transfer: "TRANSFER",
      cash: "CASH",
      card: "CARD",
    }
    const paymentMethod = methodMap[String(provider).toLowerCase()] || "OTHER"
    
    const intent = await prisma.payment.create({
      data: {
        academyId: plan.academyId,
        membershipId: membershipId || null,
        amount: plan.price,
        currency: plan.currency || "CLP",
        status: "PENDING",
        type: "SUBSCRIPTION",
        method: paymentMethod,
      },
    })

    // Provider routing
    switch (String(provider)) {
      case "mercadopago": {
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return notConfigured("Mercado Pago")
        const url = new URL(req.url)
        const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`
        const pref = await createMercadoPagoPreference({ plan: { id: plan.id, name: plan.name, price: plan.price, currency: plan.currency || "CLP" }, paymentId: intent.id, baseUrl: base, userId: session.user.id })
        return NextResponse.json({ checkoutUrl: pref.init_point })
      }
      case "khipu": {
        const receiver = process.env.KHIPU_RECEIVER_ID
        const secret = process.env.KHIPU_SECRET
        if (!receiver || !secret) return notConfigured("Khipu")
        const url = new URL(req.url)
        const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`
        const checkoutUrl = `${base}/app/subscribe/success?provider=khipu&status=success&paymentId=${intent.id}`
        return NextResponse.json({ checkoutUrl })
      }
      case "webpay": {
        const code = process.env.WEBPAY_COMMERCE_CODE
        const apiKey = process.env.WEBPAY_API_KEY
        if (!code || !apiKey) return notConfigured("Webpay")
        const url = new URL(req.url)
        const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`
        const checkoutUrl = `${base}/app/subscribe/success?provider=webpay&status=success&paymentId=${intent.id}`
        return NextResponse.json({ checkoutUrl })
      }
      case "flow": {
        // Get credentials from database (academy settings) or fallback to env vars
        const apiKey = academy.flowApiKey || process.env.FLOW_API_KEY
        const secretKey = academy.flowSecretKey || process.env.FLOW_SECRET_KEY
        const flowEnabled = academy.flowEnabled
        
        if (!flowEnabled || !apiKey || !secretKey) return notConfigured("Flow")
        
        const url = new URL(req.url)
        const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`
        
        // Get user email for Flow - Flow requires a valid email
        // In sandbox mode, use a test email if the user's email is not from a real domain
        let userEmail = session.user.email || ""
        const isSandbox = process.env.FLOW_ENVIRONMENT !== "production"
        
        // Validate email has a real-looking domain (not .cl test domains)
        const invalidTestDomains = ["prueba.cl", "test.cl", "ejemplo.cl", "academia.cl", "local"]
        const emailDomain = userEmail.split("@")[1] || ""
        const isInvalidEmail = !userEmail || invalidTestDomains.some(d => emailDomain.includes(d))
        
        if (isInvalidEmail && isSandbox) {
          // Flow requires REAL email addresses even in sandbox
          // Use configured sandbox email from environment
          const sandboxEmail = process.env.FLOW_SANDBOX_EMAIL
          if (!sandboxEmail) {
            return NextResponse.json({ 
              error: "Para pruebas con Flow, configura FLOW_SANDBOX_EMAIL en .env con un email real" 
            }, { status: 400 })
          }
          userEmail = sandboxEmail
        } else if (isInvalidEmail) {
          return NextResponse.json({ 
            error: "Se requiere un email válido para procesar el pago. Actualiza tu perfil con un email real." 
          }, { status: 400 })
        }
        
        try {
          const flowPayment = await createFlowPayment({
            commerceOrder: intent.id,
            subject: `Suscripción: ${plan.name}`,
            amount: plan.price,
            email: userEmail,
            urlConfirmation: `${base}/api/webhooks/flow`,
            urlReturn: `${base}/api/payment/success?provider=flow&paymentId=${intent.id}&orgSlug=${academy.slug}`,
            currency: plan.currency || "CLP",
            optional: {
              planId: plan.id,
              userId: session.user.id,
            },
          }, apiKey, secretKey)
          
          // Update payment with Flow order reference
          await prisma.payment.update({
            where: { id: intent.id },
            data: { 
              externalRef: `flow-${flowPayment.flowOrder}`,
              odooTransactionId: flowPayment.token,
            },
          })
          
          // Flow returns URL + token, redirect to URL with token
          const checkoutUrl = `${flowPayment.url}?token=${flowPayment.token}`
          return NextResponse.json({ checkoutUrl })
        } catch (flowError: any) {
          console.error("Flow payment creation error:", flowError)
          return NextResponse.json({ 
            error: `Error al crear pago en Flow: ${flowError.message}` 
          }, { status: 500 })
        }
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
