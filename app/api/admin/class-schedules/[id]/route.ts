import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

export async function PATCH(_req: NextRequest, _ctx: { params: { id: string } }) {
  return NextResponse.json({ error: "Class schedules feature disabled" }, { status: 410 })
}

export async function DELETE(_req: NextRequest, _ctx: { params: { id: string } }) {
  return NextResponse.json({ error: "Class schedules feature disabled" }, { status: 410 })
}
