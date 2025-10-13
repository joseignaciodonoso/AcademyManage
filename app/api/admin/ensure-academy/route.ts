import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ACADEMY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (session.user.role === "SUPER_ADMIN") {
    return NextResponse.json({ ok: true, academyId: null })
  }

  let academyId = (session.user as any).academyId as string | undefined
  if (!academyId) {
    const base = (session.user.name || session.user.email.split("@")[0] || "mi-academia")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 32)
    let slug = base || "mi-academia"
    let suffix = 0
    // ensure unique slug
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await prisma.academy.findUnique({ where: { slug } })
      if (!exists) break
      suffix += 1
      slug = `${base}-${suffix}`
    }

    const created = await prisma.academy.create({
      data: { name: session.user.name || "Mi Academia", slug, onboardingCompleted: false },
      select: { id: true },
    })
    academyId = created.id
    await prisma.user.update({ where: { id: session.user.id }, data: { academyId } })
  }

  return NextResponse.json({ ok: true, academyId })
}

export async function GET() {
  // Delegate to POST logic for convenience
  return POST()
}
