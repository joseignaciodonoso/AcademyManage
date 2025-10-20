import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Requiere SUPER_ADMIN" }, { status: 403 })
    }

    const orgs = await prisma.academy.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })

    return NextResponse.json({ items: orgs })
  } catch (e) {
    console.error("GET /api/admin/organizations error", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
