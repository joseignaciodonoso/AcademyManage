import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"

async function ensureBranchAccess(session: any, branchId: string) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, academyId: true } })
  if (!branch) return { ok: false, status: 404 as const, error: "Not found" }
  if (session.user.role !== "SUPER_ADMIN" && session.user.academyId !== branch.academyId) {
    return { ok: false, status: 403 as const, error: "Forbidden" }
  }
  return { ok: true, branch }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    requirePermission(session.user.role, "branch:read")

    const access = await ensureBranchAccess(session, params.id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const [coaches, assigned] = await Promise.all([
      prisma.user.findMany({
        where: { role: "COACH", academyId: access.branch!.academyId },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
      prisma.branchCoach.findMany({ where: { branchId: params.id } }),
    ])

    const assignedSet = new Set(assigned.map((a) => a.coachId))

    const data = coaches.map((c) => ({
      id: c.id,
      name: c.name ?? "(Sin nombre)",
      email: c.email,
      assigned: assignedSet.has(c.id),
    }))

    return NextResponse.json({ coaches: data })
  } catch (e) {
    console.error("GET /admin/branches/[id]/coaches error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    requirePermission(session.user.role, "branch:write")

    const access = await ensureBranchAccess(session, params.id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const body = await req.json().catch(() => ({}))
    const coachIds: string[] = Array.isArray(body?.coachIds) ? body.coachIds : []

    // Validate coaches belong to same academy and role is COACH
    const validCoaches = await prisma.user.findMany({
      where: { id: { in: coachIds }, role: "COACH", academyId: access.branch!.academyId },
      select: { id: true },
    })
    const validIds = new Set(validCoaches.map((c) => c.id))

    // Current assignments
    const current = await prisma.branchCoach.findMany({ where: { branchId: params.id } })
    const currentIds = new Set(current.map((a) => a.coachId))

    // Compute diffs using only valid coach ids
    const targetIds = new Set([...coachIds].filter((id) => validIds.has(id)))

    const toAdd = [...targetIds].filter((id) => !currentIds.has(id))
    const toRemove = [...currentIds].filter((id) => !targetIds.has(id))

    await prisma.$transaction([
      toAdd.length
        ? prisma.branchCoach.createMany({
            data: toAdd.map((id) => ({ branchId: params.id, coachId: id })),
            skipDuplicates: true,
          })
        : prisma.branchCoach.findFirst({ where: { branchId: params.id } }), // no-op
      toRemove.length
        ? prisma.branchCoach.deleteMany({ where: { branchId: params.id, coachId: { in: toRemove } } })
        : prisma.branchCoach.findFirst({ where: { branchId: params.id } }), // no-op
    ])

    // Return updated set
    const updated = await prisma.branchCoach.findMany({ where: { branchId: params.id } })
    return NextResponse.json({ coachIds: updated.map((a) => a.coachId) })
  } catch (e) {
    console.error("PATCH /admin/branches/[id]/coaches error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
