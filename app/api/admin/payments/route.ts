import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-simple"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"

// GET /api/admin/payments - list payments for academy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!hasPermission(session.user.role, "payment:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }
    if (!session.user.academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const payments = await prisma.payment.findMany({
      where: { academyId: session.user.academyId },
      orderBy: { createdAt: "desc" },
      include: {
        membership: { include: { plan: true, user: true } },
      },
    })

    // Shape data for UI
    const result = payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      method: (p as any).method || null,
      transactionId: p.externalRef || p.odooTransactionId || undefined,
      paidAt: p.paidAt?.toISOString(),
      createdAt: p.createdAt.toISOString(),
      user: {
        name: (p as any).membership?.user?.name || "-",
        email: (p as any).membership?.user?.email || "-",
      },
      membership: (p as any).membership
        ? {
            plan: {
              name: (p as any).membership.plan.name,
              type: (p as any).membership.plan.type,
            },
          }
        : undefined,
    }))

    return NextResponse.json({ payments: result })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST /api/admin/payments - create manual payment (cash/transfer)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!hasPermission(session.user.role, "payment:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }
    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const { studentId, email, amount, method, paidAt, planId } = body || {}

    if ((!studentId && !email) || !amount || !method) {
      return NextResponse.json({ error: "Alumno (o email), monto y método son obligatorios" }, { status: 400 })
    }

    const methodUpper = String(method).toUpperCase()
    if (!['CASH', 'TRANSFER'].includes(methodUpper)) {
      return NextResponse.json({ error: "Método inválido (CASH o TRANSFER)" }, { status: 400 })
    }

    // Find user within academy
    const user = studentId
      ? await prisma.user.findFirst({ where: { id: String(studentId), academyId } })
      : await prisma.user.findFirst({ where: { email, academyId } })
    if (!user) {
      return NextResponse.json({ error: "Estudiante no encontrado en esta academia" }, { status: 404 })
    }

    // Optionally validate plan
    let plan: any = null
    if (planId) {
      plan = await prisma.plan.findFirst({ where: { id: String(planId), academyId } })
      if (!plan) {
        return NextResponse.json({ error: "Plan no encontrado en esta academia" }, { status: 404 })
      }
    }

    // Ensure membership for user (optionally for the given plan)
    let membership = await prisma.membership.findFirst({
      where: { userId: user.id, academyId, ...(plan ? { planId: plan.id } : {}) },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    })

    // If plan specified and no membership found, create one
    if (plan && !membership) {
      membership = await prisma.membership.create({
        data: {
          academyId,
          userId: user.id,
          planId: plan.id,
          status: "ACTIVE",
          startDate: new Date(),
        },
        include: { plan: true },
      })
    }

    const payment = await prisma.payment.create({
      data: ({
        academyId,
        membershipId: membership?.id || null,
        amount: Number(amount),
        currency: membership?.plan?.currency || plan?.currency || "CLP",
        status: "PAID",
        type: membership ? "SUBSCRIPTION" : "INVOICE",
        method: methodUpper as any,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      } as any),
      include: { membership: { include: { plan: true, user: true } } },
    })

    return NextResponse.json({
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: (payment as any).method,
        paidAt: payment.paidAt?.toISOString(),
        createdAt: payment.createdAt.toISOString(),
        user: {
          name: (payment as any).membership?.user?.name || user.name || "-",
          email: (payment as any).membership?.user?.email || user.email,
        },
        membership: (payment as any).membership
          ? { plan: { name: (payment as any).membership.plan.name, type: (payment as any).membership.plan.type } }
          : undefined,
      },
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Error al crear pago" }, { status: 500 })
  }
}
