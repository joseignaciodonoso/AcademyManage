import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createOdooConnector } from "@/lib/odoo/connector"
import { requirePermission } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    requirePermission(session.user.role, "payment:read")

    if (!session.user.academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const externalRef = searchParams.get("externalRef")

    if (!externalRef) {
      return NextResponse.json({ error: "Referencia externa requerida" }, { status: 400 })
    }

    const odooConnector = createOdooConnector(session.user.academyId)
    const transactionStatus = await odooConnector.getTransactionStatus(externalRef)

    if (!transactionStatus) {
      return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 })
    }

    // Update local payment record
    await prisma.payment.updateMany({
      where: {
        externalRef,
        academyId: session.user.academyId,
      },
      data: {
        status:
          transactionStatus.state === "done"
            ? "PAID"
            : transactionStatus.state === "cancel"
              ? "CANCELED"
              : transactionStatus.state === "error"
                ? "FAILED"
                : "PROCESSING",
        paidAt: transactionStatus.state === "done" ? new Date() : null,
      },
    })

    return NextResponse.json({
      status: transactionStatus.state,
      amount: transactionStatus.amount,
      reference: transactionStatus.reference,
    })
  } catch (error) {
    console.error("Error fetching transaction status:", error)
    return NextResponse.json({ error: "Error al obtener estado de transacción" }, { status: 500 })
  }
}
