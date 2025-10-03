import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"

function selectBranch() {
  return {
    id: true,
    name: true,
    address: true,
    phone: true,
    email: true,
    mondayOpen: true,
    mondayClose: true,
    tuesdayOpen: true,
    tuesdayClose: true,
    wednesdayOpen: true,
    wednesdayClose: true,
    thursdayOpen: true,
    thursdayClose: true,
    fridayOpen: true,
    fridayClose: true,
    saturdayOpen: true,
    saturdayClose: true,
    sundayOpen: true,
    sundayClose: true,
  } as const
}

async function ensureAccess(session: any, branchId: string) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, academyId: true } })
  if (!branch) return { ok: false, status: 404 as const }
  if (session.user.role !== "SUPER_ADMIN" && session.user.academyId !== branch.academyId) {
    return { ok: false, status: 403 as const }
  }
  return { ok: true, branch }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    requirePermission(session.user.role, "branch:read")

    const access = await ensureAccess(session, params.id)
    if (!access.ok) return NextResponse.json({ error: access.status === 404 ? "Not found" : "Forbidden" }, { status: access.status })

    const branch = await prisma.branch.findUnique({ where: { id: params.id }, select: selectBranch() })
    return NextResponse.json({ branch })
  } catch (e) {
    console.error("GET /admin/branches/[id] error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    requirePermission(session.user.role, "branch:write")

    const access = await ensureAccess(session, params.id)
    if (!access.ok) return NextResponse.json({ error: access.status === 404 ? "Not found" : "Forbidden" }, { status: access.status })

    const body = await req.json().catch(() => ({}))
    const data: any = {}
    const keys = [
      "name","address","phone","email",
      "mondayOpen","mondayClose","tuesdayOpen","tuesdayClose","wednesdayOpen","wednesdayClose",
      "thursdayOpen","thursdayClose","fridayOpen","fridayClose","saturdayOpen","saturdayClose","sundayOpen","sundayClose",
    ]
    for (const k of keys) if (k in body) data[k] = body[k]

    const updated = await prisma.branch.update({ where: { id: params.id }, data, select: selectBranch() })
    return NextResponse.json({ branch: updated })
  } catch (e: any) {
    console.error("PATCH /admin/branches/[id] error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    requirePermission(session.user.role, "branch:delete")

    const access = await ensureAccess(session, params.id)
    if (!access.ok) return NextResponse.json({ error: access.status === 404 ? "Not found" : "Forbidden" }, { status: access.status })

    try {
      await prisma.branch.delete({ where: { id: params.id } })
    } catch (err: any) {
      // Likely foreign key constraint
      return NextResponse.json({ error: "No se puede eliminar la sede: tiene clases o inscripciones asociadas." }, { status: 409 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /admin/branches/[id] error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
