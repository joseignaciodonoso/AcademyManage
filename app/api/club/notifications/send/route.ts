import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/club/notifications/send - Send notifications to members
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { academy: true },
    })

    if (!user?.academyId) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 })
    }

    // Only ADMIN and COACH can send notifications
    if (!["ACADEMY_ADMIN", "COACH"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { recipients, channel, subject, message, notificationType } = body

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: "No recipients specified" }, { status: 400 })
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Fetch recipient details
    const recipientUsersRaw = await prisma.user.findMany({
      where: {
        id: { in: recipients },
        academyId: user.academyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // Filter out users without name or email
    const recipientUsers = recipientUsersRaw
      .filter(u => u.name && u.email)
      .map(u => ({
        id: u.id,
        name: u.name as string,
        email: u.email,
      }))

    if (recipientUsers.length === 0) {
      return NextResponse.json({ error: "No valid recipients found" }, { status: 404 })
    }

    // Send notifications based on channel
    const results = await Promise.allSettled(
      recipientUsers.map(async (recipient) => {
        if (channel === "email") {
          return await sendEmailNotification(recipient, subject || "Notificación", message, user.academy?.name || "Club")
        } else {
          return await sendWhatsAppNotification(recipient, message, user.academy?.name || "Club")
        }
      })
    )

    const successful = results.filter(r => r.status === "fulfilled").length
    const failed = results.filter(r => r.status === "rejected").length

    // Log notification in database (optional)
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        resource: "NOTIFICATION",
        resourceId: notificationType || "custom",
        userId: user.id,
        academyId: user.academyId,
        newValues: JSON.parse(JSON.stringify({
          action: "NOTIFICATION_SENT",
          channel,
          recipients: recipientUsers.length,
          successful,
          failed,
          notificationType,
        })),
      },
    })

    console.log(`✅ Notifications sent: ${successful} successful, ${failed} failed`)

    return NextResponse.json(
      {
        message: "Notifications sent",
        successful,
        failed,
        total: recipientUsers.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error sending notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to send email notification
async function sendEmailNotification(
  recipient: { id: string; name: string; email: string },
  subject: string,
  message: string,
  clubName: string
): Promise<void> {
  // TODO: Integrate with email service (Resend, SendGrid, etc.)
  console.log(`📧 Sending email to ${recipient.email}`)
  console.log(`Subject: ${subject}`)
  console.log(`Message: ${message}`)
  
  // Placeholder for actual email sending
  // Example with Resend:
  /*
  const { Resend } = require('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  await resend.emails.send({
    from: `${clubName} <notifications@yourdomain.com>`,
    to: recipient.email,
    subject: subject,
    html: `
      <h2>Hola ${recipient.name},</h2>
      <p>${message}</p>
      <br>
      <p>Saludos,<br>${clubName}</p>
    `,
  })
  */
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100))
}

// Helper function to send WhatsApp notification
async function sendWhatsAppNotification(
  recipient: { id: string; name: string; email: string },
  message: string,
  clubName: string
): Promise<void> {
  // TODO: Integrate with WhatsApp Business API or Twilio
  console.log(`💬 Sending WhatsApp to ${recipient.name}`)
  console.log(`Message: ${message}`)
  
  // Placeholder for actual WhatsApp sending
  // Example with Twilio:
  /*
  const twilio = require('twilio')
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  
  await client.messages.create({
    from: 'whatsapp:+14155238886', // Twilio sandbox or your number
    to: `whatsapp:${recipient.phone}`, // Need to store phone numbers
    body: `${clubName}\n\n${message}`,
  })
  */
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100))
}
