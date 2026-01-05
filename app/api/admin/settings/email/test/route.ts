import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

// POST - Send test email
export async function POST() {
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
        name: true,
        smtpEnabled: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
        smtpFromEmail: true,
        smtpFromName: true,
        smtpSecure: true
      }
    })

    if (!academy) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    if (!academy.smtpEnabled || !academy.smtpHost || !academy.smtpUser || !academy.smtpPassword) {
      return NextResponse.json({ error: "Configuración SMTP incompleta" }, { status: 400 })
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: academy.smtpHost,
      port: academy.smtpPort || 587,
      secure: academy.smtpSecure,
      auth: {
        user: academy.smtpUser,
        pass: academy.smtpPassword
      }
    })

    // Send test email
    await transporter.sendMail({
      from: `"${academy.smtpFromName || academy.name}" <${academy.smtpFromEmail || academy.smtpUser}>`,
      to: session.user.email,
      subject: `[Test] Configuración de correo - ${academy.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">¡Configuración exitosa! ✅</h2>
          <p>Este es un email de prueba enviado desde <strong>${academy.name}</strong>.</p>
          <p>Si estás recibiendo este mensaje, significa que la configuración SMTP está funcionando correctamente.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Este email fue enviado automáticamente como prueba de configuración.
          </p>
        </div>
      `
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Error sending test email:", error)
    return NextResponse.json({ 
      error: error.message || "Error al enviar email de prueba" 
    }, { status: 500 })
  }
}
