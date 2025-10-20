import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !requireAdmin(role) || !(session.user as any).academyId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  const academyId = (session.user as any).academyId as string
  const coaches = await prisma.user.findMany({
    where: { academyId, role: "COACH" as any },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ coaches })
}
