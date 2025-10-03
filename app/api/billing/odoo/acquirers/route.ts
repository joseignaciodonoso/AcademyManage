import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-simple"
import { createOdooConnector } from "@/lib/odoo/connector"
import { requirePermission } from "@/lib/rbac"

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

    const odooConnector = createOdooConnector(session.user.academyId)
    const acquirers = await odooConnector.listActiveAcquirers()

    return NextResponse.json({ acquirers })
  } catch (error) {
    console.error("Error fetching Odoo acquirers:", error)
    return NextResponse.json({ error: "Error al obtener métodos de pago" }, { status: 500 })
  }
}
