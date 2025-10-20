import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session?.user?.id || !requireAdmin(role) || !(session.user as any).academyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const coachId = searchParams.get("coachId") || undefined
    if (!start || !end) return NextResponse.json({ error: "start y end son requeridos (ISO)" }, { status: 400 })

    const academyId = (session.user as any).academyId as string
    const classes = await (prisma as any).class.findMany({
      where: {
        academyId,
        startTime: { gte: new Date(start) },
        endTime: { lte: new Date(end) },
        ...(coachId ? { coachId } : {}),
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        coach: { select: { id: true, name: true, email: true } },
        _count: { select: { attendances: true } },
      },
    })

    return NextResponse.json({ classes })
  } catch (e) {
    console.error("GET /api/admin/classes error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
