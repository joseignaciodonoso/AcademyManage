import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
        mercadopagoEnabled: true,
        mercadopagoPublicKey: true,
        mercadopagoToken: true,
        khipuEnabled: true,
        khipuReceiverId: true,
        khipuSecret: true,
        flowEnabled: true,
        flowApiKey: true,
        flowSecretKey: true,
        transferEnabled: true,
        bankName: true,
        bankAccountType: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        bankAccountRut: true,
        bankAccountEmail: true,
      },
    })

    if (!academy) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    // Mask sensitive tokens for display (show only last 4 chars)
    const maskToken = (token: string | null) => {
      if (!token) return ""
      if (token.length <= 4) return token
      return "•".repeat(token.length - 4) + token.slice(-4)
    }

    return NextResponse.json({
      mercadopagoEnabled: academy.mercadopagoEnabled,
      mercadopagoPublicKey: academy.mercadopagoPublicKey || "",
      mercadopagoToken: academy.mercadopagoToken ? maskToken(academy.mercadopagoToken) : "",
      khipuEnabled: academy.khipuEnabled,
      khipuReceiverId: academy.khipuReceiverId || "",
      khipuSecret: academy.khipuSecret ? maskToken(academy.khipuSecret) : "",
      flowEnabled: academy.flowEnabled,
      flowApiKey: academy.flowApiKey || "",
      flowSecretKey: academy.flowSecretKey ? maskToken(academy.flowSecretKey) : "",
      transferEnabled: academy.transferEnabled,
      bankName: academy.bankName || "",
      bankAccountType: academy.bankAccountType || "",
      bankAccountNumber: academy.bankAccountNumber || "",
      bankAccountHolder: academy.bankAccountHolder || "",
      bankAccountRut: academy.bankAccountRut || "",
      bankAccountEmail: academy.bankAccountEmail || "",
    })
  } catch (error) {
    console.error("Error fetching payment settings:", error)
    return NextResponse.json({ error: "Error al cargar configuración" }, { status: 500 })
  }
}

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

    // Get current academy to check if tokens are being updated
    const currentAcademy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: {
        mercadopagoToken: true,
        khipuSecret: true,
        flowSecretKey: true,
      },
    })

    // Only update tokens if they don't contain masked characters
    const isMasked = (value: string) => value.includes("•")
    
    const updateData: any = {
      mercadopagoEnabled: data.mercadopagoEnabled,
      mercadopagoPublicKey: data.mercadopagoPublicKey || null,
      khipuEnabled: data.khipuEnabled,
      khipuReceiverId: data.khipuReceiverId || null,
      flowEnabled: data.flowEnabled,
      flowApiKey: data.flowApiKey || null,
      transferEnabled: data.transferEnabled,
      bankName: data.bankName || null,
      bankAccountType: data.bankAccountType || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankAccountHolder: data.bankAccountHolder || null,
      bankAccountRut: data.bankAccountRut || null,
      bankAccountEmail: data.bankAccountEmail || null,
    }

    // Only update secret tokens if they're not masked (meaning user entered a new value)
    if (data.mercadopagoToken && !isMasked(data.mercadopagoToken)) {
      updateData.mercadopagoToken = data.mercadopagoToken
    }
    if (data.khipuSecret && !isMasked(data.khipuSecret)) {
      updateData.khipuSecret = data.khipuSecret
    }
    if (data.flowSecretKey && !isMasked(data.flowSecretKey)) {
      updateData.flowSecretKey = data.flowSecretKey
    }

    await prisma.academy.update({
      where: { id: academyId },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        academyId,
        userId: session.user.id,
        action: "PAYMENT_SETTINGS_UPDATED",
        entityType: "Academy",
        entityId: academyId,
        details: {
          mercadopagoEnabled: data.mercadopagoEnabled,
          khipuEnabled: data.khipuEnabled,
          flowEnabled: data.flowEnabled,
          transferEnabled: data.transferEnabled,
        },
      },
    })

    return NextResponse.json({ ok: true, message: "Configuración guardada" })
  } catch (error) {
    console.error("Error saving payment settings:", error)
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 })
  }
}
