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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id
    const body = await request.json()
    const { title, description, type, allDay, date, startTime, endTime, published, important, branchId } = body || {}

    const existing = await prisma.event.findFirst({ where: { id, academyId: session.user.academyId ?? undefined } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const data: any = {}
    if (title !== undefined) data.title = title
    if (description !== undefined) data.description = description
    if (type !== undefined) data.type = String(type).toUpperCase()
    if (allDay !== undefined) data.allDay = Boolean(allDay)
    if (published !== undefined) data.published = Boolean(published)
    if (important !== undefined) data.important = Boolean(important)
    if (branchId !== undefined) data.branchId = branchId || null

    if (date) {
      data.eventDate = new Date(`${date}T00:00:00`)
      // if time provided alongside date
      if (!allDay && startTime) data.startAt = new Date(`${date}T${startTime}`)
      if (!allDay && endTime) data.endAt = new Date(`${date}T${endTime}`)
      if (allDay) { data.startAt = null; data.endAt = null }
    } else {
      if (allDay) { data.startAt = null; data.endAt = null }
      if (!allDay && startTime) data.startAt = new Date(`${toYMD(existing.eventDate)}T${startTime}`)
      if (!allDay && endTime) data.endAt = new Date(`${toYMD(existing.eventDate)}T${endTime}`)
    }

    const updated = await prisma.event.update({ where: { id }, data })

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      date: toYMD(updated.eventDate),
      allDay: updated.allDay,
      startTime: hhmm(updated.startAt),
      endTime: hhmm(updated.endAt),
      type: updated.type.toLowerCase(),
      description: updated.description ?? undefined,
      published: updated.published,
      important: updated.important,
      branchId: updated.branchId ?? undefined,
    })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id

    const existing = await prisma.event.findFirst({ where: { id, academyId: session.user.academyId ?? undefined } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.event.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
