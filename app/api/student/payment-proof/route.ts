import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const membershipId = formData.get("membershipId") as string | null
    const amount = formData.get("amount") as string | null

    if (!membershipId) {
      return NextResponse.json({ error: "membershipId requerido" }, { status: 400 })
    }

    // Verify membership belongs to user
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    })

    if (!membership) {
      return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 })
    }

    if (membership.userId !== session.user.id) {
      return NextResponse.json({ error: "No tienes permiso para esta membresía" }, { status: 403 })
    }

    // For now, we'll store the proof as a base64 string or URL
    // In production, this should upload to S3/Cloudinary/etc.
    let proofUrl: string | null = null
    
    if (file) {
      // Convert file to base64 for simple storage
      // In production, upload to cloud storage
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")
      const mimeType = file.type
      proofUrl = `data:${mimeType};base64,${base64}`
    }

    // Update membership status
    await prisma.membership.update({
      where: { id: membershipId },
      data: { status: "PAST_DUE" },
    })

    // Create or update payment record with proof
    const existingPayment = await prisma.payment.findFirst({
      where: {
        membershipId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    })

    let payment
    if (existingPayment) {
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          proofUrl,
          notes: "Comprobante de transferencia adjunto",
        },
      })
    } else {
      payment = await prisma.payment.create({
        data: {
          academyId: membership.academyId,
          userId: membership.userId,
          membershipId: membership.id,
          amount: amount ? parseFloat(amount) : membership.plan.price,
          currency: membership.plan.currency,
          method: "TRANSFER",
          status: "PENDING",
          proofUrl,
          description: `Pago de suscripción - ${membership.plan.name}`,
          notes: proofUrl ? "Comprobante de transferencia adjunto" : undefined,
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        academyId: membership.academyId,
        userId: session.user.id,
        action: "PAYMENT_PROOF_UPLOADED",
        entityType: "Payment",
        entityId: payment.id,
        details: {
          membershipId,
          planName: membership.plan.name,
          hasProof: Boolean(proofUrl),
        },
      },
    })

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      message: "Comprobante recibido. Tu pago será verificado pronto.",
    })
  } catch (e: any) {
    console.error("Error uploading payment proof:", e)
    return NextResponse.json({ error: e.message || "Error al subir comprobante" }, { status: 500 })
  }
}
