import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(role)
}

const weekdayMap: Record<number, string> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
}

function parseHm(hm: string) {
  const [h, m] = hm.split(":" ).map(Number)
  return { h: h || 0, m: m || 0 }
}

export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: "Class schedules feature disabled" }, { status: 410 })
}
