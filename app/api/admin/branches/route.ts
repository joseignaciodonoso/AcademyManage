import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"

export async function GET(_req: NextRequest) {
  return NextResponse.json({ error: "Branches feature disabled" }, { status: 410 })
}

export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: "Branches feature disabled" }, { status: 410 })
}
