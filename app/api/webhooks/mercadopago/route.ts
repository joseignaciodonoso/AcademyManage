import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMercadoPagoMerchantOrder, getMercadoPagoPayment } from "@/lib/payments/mercadopago"

async function settleByExternalReference(externalRef: string, providerPaymentId: string) {
  try {
    const payment = await prisma.payment.update({
      where: { id: String(externalRef) },
      data: { status: "PAID" as any, externalRef: providerPaymentId, paidAt: new Date() },
      include: { membership: true },
    })

    if (payment.membershipId) {
      // Activate membership
      await prisma.membership.update({
        where: { id: payment.membershipId },
        data: { status: "ACTIVE" as any },
      })
    }
    return true
  } catch (e) {
    // Not found by id, try locating by externalRef field (fallback)
    const p = await prisma.payment.findFirst({ where: { externalRef: providerPaymentId } })
    if (p) {
      await prisma.payment.update({ where: { id: p.id }, data: { status: "PAID" as any, paidAt: new Date() } })
      if (p.membershipId) {
        await prisma.membership.update({ where: { id: p.membershipId }, data: { status: "ACTIVE" as any } })
      }
      return true
    }
    return false
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get("topic") || url.searchParams.get("type") || ""
    const id = url.searchParams.get("id") || url.searchParams.get("data.id") || ""

    if (!topic && !id) {
      const body = await req.json().catch(() => null)
      if (body?.type && body?.data?.id) {
        // MP sometimes sends JSON { type, data: { id } }
        return await handleNotification(body.type, String(body.data.id))
      }
      return NextResponse.json({ ok: true })
    }

    return await handleNotification(topic, String(id))
  } catch (e: any) {
    console.error("MP webhook error", e)
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  // Mercado Pago may call with GET as well
  return POST(req)
}

async function handleNotification(topic: string, id: string) {
  try {
    if (topic === "payment") {
      const p = await getMercadoPagoPayment(id)
      if (p?.status === "approved") {
        const external = p.external_reference || p.metadata?.paymentId
        if (external) {
          await settleByExternalReference(String(external), String(p.id))
        }
      }
      return NextResponse.json({ ok: true })
    }

    if (topic === "merchant_order") {
      const mo = await getMercadoPagoMerchantOrder(id)
      if (mo?.payments && Array.isArray(mo.payments)) {
        const approved = mo.payments.find((x: any) => x.status === "approved")
        if (approved) {
          const external = mo.external_reference || approved.external_reference
          if (external) {
            await settleByExternalReference(String(external), String(approved.id))
          }
        }
      }
      return NextResponse.json({ ok: true })
    }

    // Unknown topic - accept to avoid retries storms
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("MP handler error", e)
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 })
  }
}
