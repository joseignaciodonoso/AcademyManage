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

    const { proofUrl, membershipId, amount } = await request.json()
    if (!proofUrl) return NextResponse.json({ error: "proofUrl es requerido" }, { status: 400 })

    // Find membership (active first, fallback to latest) if not provided
    let membership = null as any
    if (membershipId) {
      membership = await prisma.membership.findUnique({ where: { id: membershipId } })
    } else {
      membership = await prisma.membership.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    }

    // Resolve academyId
    let academyId: string | null = membership?.academyId || null
    if (!academyId) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { academyId: true } })
      academyId = user?.academyId || null
    }
    if (!academyId) return NextResponse.json({ error: "No hay academia asociada para registrar el pago" }, { status: 400 })

    const currency = "CLP"
    const amt = typeof amount === "number" && amount > 0 ? amount : 0

    const payment = await prisma.payment.create({
      data: {
        academyId,
        membershipId: membership?.id || null,
        amount: amt,
        currency,
        status: "PROCESSING",
        type: membership ? "SUBSCRIPTION" : "INVOICE",
        acquirerCode: "TRANSFER_PROOF",
        // store proof URL in odooTransactionId temporarily (no dedicated field)
        odooTransactionId: proofUrl,
        externalRef: `proof_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        paidAt: null,
      },
    })

    // Audit log: student uploaded transfer proof
    try {
      await prisma.auditLog.create({
        data: {
          academyId,
          userId: session.user.id,
          action: "PAYMENT",
          resource: "payments",
          resourceId: payment.id,
          newValues: {
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            acquirerCode: payment.acquirerCode,
            proofUrl,
          } as any,
        },
      })
    } catch {}

    return NextResponse.json({ ok: true, paymentId: payment.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al subir comprobante" }, { status: 500 })
  }
}
