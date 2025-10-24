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
    if (!session?.user || !["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const branchId = searchParams.get("branchId")
    const published = searchParams.get("published")

    // Resolve academy from tenant header or session
    // Multi-tenant support disabled
    const academyId = session.user.academyId ?? undefined
    const where: any = { academyId }

    if (startDate && endDate) {
      where.eventDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (branchId) where.branchId = branchId
    if (published != null) where.published = published === "true"

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
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      type = "other",
      allDay = true,
      date,
      startTime,
      endTime,
      published = true,
      important = false,
      branchId,
      // Match-specific fields for CHAMPIONSHIP events
      opponent,
      location,
      homeAway,
    } = body || {}

    if (!title || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const eventDate = new Date(`${date}T00:00:00`)
    const startAt = allDay || !startTime ? null : new Date(`${date}T${startTime}`)
    const endAt = allDay || !endTime ? null : new Date(`${date}T${endTime}`)
    const typeEnum = String(type || "other").toUpperCase() as any

    // Resolve academy from tenant header or session
    // Multi-tenant support disabled
    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const created = await prisma.event.create({
      data: {
        academyId,
        branchId: branchId || null,
        title,
        description,
        type: typeEnum,
        allDay: Boolean(allDay),
        eventDate,
        startAt,
        endAt,
        published: Boolean(published),
        important: Boolean(important),
      },
    })

    // Auto-create Match for CHAMPIONSHIP events (for club-type academies)
    if (typeEnum === "CHAMPIONSHIP") {
      try {
        const academy = await prisma.academy.findUnique({ where: { id: academyId } })
        if (academy?.type === "CLUB") {
          await (prisma as any).match.create({
            data: {
              academyId,
              sport: academy.sport || "BASKETBALL", // Default to BASKETBALL if not set
              date: eventDate,
              opponent: opponent || `Rival (${title})`,
              location: location || "Por definir", 
              homeAway: homeAway || "HOME",
              status: "SCHEDULED",
              notes: `Generado desde evento: ${title}`,
            },
          })
        }
      } catch (err) {
        console.warn("Failed to create associated match:", err)
        // Continue - don't fail event creation if match fails
      }
    }

    return NextResponse.json({
      id: created.id,
      title: created.title,
      date: toYMD(created.eventDate),
      allDay: created.allDay,
      startTime: hhmm(created.startAt),
      endTime: hhmm(created.endAt),
      type: created.type.toLowerCase(),
      description: created.description ?? undefined,
      published: created.published,
      important: created.important,
      branchId: created.branchId ?? undefined,
    })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
