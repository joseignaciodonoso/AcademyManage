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

async function ensureAccess(session: any, branchId: string, resolvedAcademyId?: string) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, academyId: true } })
  if (!branch) return { ok: false, status: 404 as const }
  const academyToCheck = resolvedAcademyId ?? session.user.academyId
  if (session.user.role !== "SUPER_ADMIN" && academyToCheck !== branch.academyId) {
    return { ok: false, status: 403 as const }
  }
  return { ok: true, branch }
}

export async function GET(_req: NextRequest, _ctx: { params: { id: string } }) {
  return NextResponse.json({ error: "Branches feature disabled" }, { status: 410 })
}

export async function PATCH(_req: NextRequest, _ctx: { params: { id: string } }) {
  return NextResponse.json({ error: "Branches feature disabled" }, { status: 410 })
}

export async function DELETE(_req: NextRequest, _ctx: { params: { id: string } }) {
  return NextResponse.json({ error: "Branches feature disabled" }, { status: 410 })
}
