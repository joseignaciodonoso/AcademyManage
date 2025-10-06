import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-simple"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!hasPermission(session.user.role, "payment:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }
    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const id = params.id
    const body = await request.json().catch(() => ({}))
    const {
      amount,
      currency,
      status,
      method,
      paidAt,
      transactionId,
    } = body || {}

    const data: any = {}
    if (amount != null) {
      const n = Number(amount)
      if (isNaN(n) || n <= 0) return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
      data.amount = n
    }
    if (currency) data.currency = String(currency)
    if (status) {
      const allowed = ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELED", "REFUNDED"]
      if (!allowed.includes(String(status))) return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
      data.status = String(status)
    }
    if (method) {
      const m = String(method).toUpperCase()
      if (!["CASH", "TRANSFER"].includes(m)) return NextResponse.json({ error: "Método inválido" }, { status: 400 })
      data.method = m
    }
    if (paidAt != null) {
      data.paidAt = paidAt ? new Date(paidAt) : null
    }
    if (transactionId !== undefined) {
      data.externalRef = transactionId || null
    }

    // Ensure the payment belongs to this academy
    const existing = await prisma.payment.findFirst({ where: { id, academyId } })
    if (!existing) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })

    const updated = await prisma.payment.update({ where: { id }, data })

    return NextResponse.json({
      payment: {
        id: updated.id,
        amount: updated.amount,
        currency: updated.currency,
        status: updated.status,
        method: (updated as any).method,
        paidAt: updated.paidAt?.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        transactionId: updated.externalRef || undefined,
      },
    })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Error al actualizar pago" }, { status: 500 })
  }
}
