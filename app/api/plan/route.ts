import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    const plan = await prisma.plan.findUnique({ where: { id: String(id) } })
    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

    return NextResponse.json({ plan })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 })
  }
}
