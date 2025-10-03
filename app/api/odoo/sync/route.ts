import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requirePermission } from "@/lib/rbac"
import { createOdooSyncService } from "@/lib/odoo/sync"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    requirePermission(session.user.role, "academy:write")

    if (!session.user.academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const { syncType } = await request.json()
    const syncService = createOdooSyncService(session.user.academyId)

    switch (syncType) {
      case "plans":
        await syncService.syncAllPlansToOdoo()
        break
      case "users":
        await syncService.syncAllUsersToOdoo()
        break
      case "all":
        await syncService.syncAllPlansToOdoo()
        await syncService.syncAllUsersToOdoo()
        break
      default:
        return NextResponse.json({ error: "Tipo de sincronización inválido" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Sincronización completada" })
  } catch (error) {
    console.error("Error in Odoo sync:", error)
    return NextResponse.json({ error: "Error en sincronización con Odoo" }, { status: 500 })
  }
}
