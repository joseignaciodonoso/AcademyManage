import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function hhmm(d?: Date | null) {
  if (!d) return undefined
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const branchId = searchParams.get("branchId")
    const academyIdParam = searchParams.get("academyId")

    const where: any = { published: true }

    if (startDate && endDate) {
      where.eventDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Resolve academyId: param takes precedence, else from session if available
    if (academyIdParam) {
      where.academyId = academyIdParam
    } else if (session?.user?.academyId) {
      where.academyId = session.user.academyId
    }

    if (branchId) where.branchId = branchId

    const events = await prisma.event.findMany({
      where,
      orderBy: [{ eventDate: "asc" }, { startAt: "asc" }],
    })

    const out = events.map((ev) => ({
      id: ev.id,
      title: ev.title,
      date: toYMD(ev.eventDate),
      allDay: ev.allDay,
      startTime: hhmm(ev.startAt),
      endTime: hhmm(ev.endAt),
      type: ev.type.toLowerCase(),
      description: ev.description ?? undefined,
      published: ev.published,
      important: ev.important,
      branchId: ev.branchId ?? undefined,
    }))

    return NextResponse.json(out)
  } catch (error) {
    console.error("Error fetching public events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
