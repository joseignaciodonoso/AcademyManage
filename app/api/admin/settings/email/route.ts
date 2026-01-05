import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Fetch email/SMTP configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ACADEMY_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: {
        smtpEnabled: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
        smtpFromEmail: true,
        smtpFromName: true,
        smtpSecure: true,
        paymentReminderEnabled: true,
        paymentReminderDaysBefore: true,
        paymentReminderDaysAfter: true,
        paymentReminderFrequency: true
      }
    })

    if (!academy) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    // Mask password for security
    return NextResponse.json({
      ...academy,
      smtpPassword: academy.smtpPassword ? "••••••••" : ""
    })
  } catch (error) {
    console.error("Error fetching email config:", error)
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
  }
}

// PUT - Update email/SMTP configuration
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ACADEMY_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    const data = await request.json()

    // Get current config to check if password changed
    const currentConfig = await prisma.academy.findUnique({
      where: { id: academyId },
      select: { smtpPassword: true }
    })

    // Only update password if it's not the masked value
    const updateData: any = {
      smtpEnabled: data.smtpEnabled ?? false,
      smtpHost: data.smtpHost || null,
      smtpPort: data.smtpPort || 587,
      smtpUser: data.smtpUser || null,
      smtpFromEmail: data.smtpFromEmail || null,
      smtpFromName: data.smtpFromName || null,
      smtpSecure: data.smtpSecure ?? true,
      paymentReminderEnabled: data.paymentReminderEnabled ?? false,
      paymentReminderDaysBefore: data.paymentReminderDaysBefore ?? 3,
      paymentReminderDaysAfter: data.paymentReminderDaysAfter ?? 1,
      paymentReminderFrequency: data.paymentReminderFrequency ?? 3
    }

    // Only update password if it changed (not masked)
    if (data.smtpPassword && data.smtpPassword !== "••••••••") {
      updateData.smtpPassword = data.smtpPassword
    }

    await prisma.academy.update({
      where: { id: academyId },
      data: updateData
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error updating email config:", error)
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 })
  }
}
