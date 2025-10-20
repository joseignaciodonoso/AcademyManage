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

export async function GET(_req: NextRequest, _ctx: { params: { id: string } }) {
  return NextResponse.json({ error: "Branches feature disabled" }, { status: 410 })
}

export async function PATCH(_req: NextRequest, _ctx: { params: { id: string } }) {
  return NextResponse.json({ error: "Branches feature disabled" }, { status: 410 })
}
