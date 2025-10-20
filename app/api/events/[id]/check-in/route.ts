import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require authenticated user (students will typically call this)
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "User id missing in session" }, { status: 400 })
    }

    // Resolve tenant context
    const academy = await requireAcademyFromRequest(request)
    const academyId = academy?.id ?? (session.user as any).academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academy not resolved for tenant" }, { status: 400 })
    }

    const eventId = params.id

    // Ensure event belongs to tenant
    const event = await prisma.event.findFirst({ where: { id: eventId, academyId }, select: { id: true, title: true, type: true, eventDate: true, startAt: true, endAt: true } })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Find registration
    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { id: true, academyId: true, status: true, paidRequired: true, checkedInAt: true },
    })
    if (!registration) {
      return NextResponse.json({ error: "Registration required" }, { status: 400 })
    }
    if (registration.academyId !== academyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (registration.status !== "ENROLLED") {
      return NextResponse.json({ error: "Registration not active" }, { status: 400 })
    }
    if (registration.checkedInAt) {
      return NextResponse.json({ success: true, message: "Already checked in", checkedInAt: registration.checkedInAt })
    }

    // If payment required, ensure a PAID payment exists for this event and user
    if (registration.paidRequired) {
      const paid = await prisma.payment.findFirst({
        where: { academyId, eventId, userId, status: "PAID" },
        select: { id: true },
      })
      if (!paid) {
        return NextResponse.json({ error: "Payment required" }, { status: 402 })
      }
    }

    // Mark check-in
    const now = new Date()
    const updated = await prisma.eventRegistration.update({
      where: { eventId_userId: { eventId, userId } },
      data: { checkedInAt: now },
      select: { id: true, checkedInAt: true },
    })

    return NextResponse.json({ success: true, checkedInAt: updated.checkedInAt })
  } catch (error) {
    console.error("POST /api/events/[id]/check-in error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
