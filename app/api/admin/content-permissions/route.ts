import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function isAdmin(role?: string) {
  return role === "SUPER_ADMIN" || role === "ACADEMY_ADMIN"
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdmin(String(session.user.role))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const academyId = session.user.academyId
    if (!academyId && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Missing academy" }, { status: 400 })
    }

    // Allow SUPER_ADMIN to query by academyId param
    const { searchParams } = new URL(req.url)
    const requestedAcademyId = searchParams.get("academyId") || academyId || undefined

    type CoachBasic = { id: string; name: string | null; email: string }
    const [coaches, perms] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "COACH",
          ...(requestedAcademyId ? { academyId: requestedAcademyId } : {}),
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }) as Promise<CoachBasic[]>,
      prisma.contentPermission.findMany({
        where: requestedAcademyId ? { academyId: requestedAcademyId } : undefined,
      }),
    ])

    const byCoach: Record<string, typeof perms[number]> = {}
    for (const p of perms) byCoach[p.coachId] = p as any

    const data = coaches.map((c: CoachBasic) => ({
      id: c.id,
      name: c.name ?? "(Sin nombre)",
      email: c.email,
      canVideo: byCoach[c.id]?.canVideo ?? false,
      canAnnouncement: byCoach[c.id]?.canAnnouncement ?? false,
      canDoc: byCoach[c.id]?.canDoc ?? false,
      canLink: byCoach[c.id]?.canLink ?? false,
      requireApproval: byCoach[c.id]?.requireApproval ?? true,
      monthlyQuota: byCoach[c.id]?.monthlyQuota ?? null,
      maxUploadMB: byCoach[c.id]?.maxUploadMB ?? null,
    }))

    return NextResponse.json({ coaches: data })
  } catch (e) {
    console.error("GET /admin/content-permissions error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdmin(String(session.user.role))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const academyId = session.user.academyId
    if (!academyId && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Missing academy" }, { status: 400 })
    }

    const body = await req.json()
    const { coachId, updates } = body || {}
    if (!coachId || !updates) return NextResponse.json({ error: "Missing coachId or updates" }, { status: 400 })

    const data: any = {}
    const allowed = [
      "canVideo",
      "canAnnouncement",
      "canDoc",
      "canLink",
      "requireApproval",
      "monthlyQuota",
      "maxUploadMB",
    ]
    for (const key of allowed) {
      if (key in updates) data[key] = updates[key]
    }

    const record = await prisma.contentPermission.upsert({
      where: {
        academyId_coachId: {
          academyId: academyId || updates.academyId,
          coachId,
        },
      },
      update: data,
      create: {
        academyId: academyId || updates.academyId,
        coachId,
        ...data,
      },
    })

    return NextResponse.json(record)
  } catch (e) {
    console.error("PATCH /admin/content-permissions error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
