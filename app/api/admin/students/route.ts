import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    // Check permissions
    if (!hasPermission(session.user.role, "students:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    // Multi-tenant support disabled
    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    // Fetch students with their memberships and payments
    const students = await prisma.user.findMany({
      where: {
        academyId,
        role: "STUDENT"
      },
      include: {
        memberships: {
          include: {
            plan: true,
            payments: {
              orderBy: {
                createdAt: "desc"
              },
              take: 5 // Last 5 payments
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1 // Most recent membership
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Pull PAID payments this month per userId to ensure student view reflects real payments even if not linked to membership
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const studentIds = students.map((s: any) => s.id)
    const membershipIds = students.map((s: any) => s.memberships?.[0]?.id).filter(Boolean) as string[]
    const paidThisMonthByUser = studentIds.length ? await prisma.payment.findMany({
      where: {
        academyId,
        userId: { in: studentIds },
        status: "PAID",
        paidAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      select: { id: true, userId: true, amount: true, currency: true, status: true, paidAt: true },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    }) : []
    const paidThisMonthByMembershipUser = studentIds.length ? await prisma.payment.findMany({
      where: {
        academyId,
        status: 'PAID',
        paidAt: { gte: startOfMonth, lt: startOfNextMonth },
        membership: { userId: { in: studentIds } },
      },
      select: { id: true, amount: true, currency: true, status: true, paidAt: true, membership: { select: { userId: true } } },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    }) : []
    const paymentsMap = new Map<string, { id: string; amount: number; currency: string; status: string; paidAt?: Date }[]>()
    for (const p of paidThisMonthByUser) {
      const arr = paymentsMap.get(p.userId as string) || []
      arr.push({ id: p.id, amount: p.amount, currency: p.currency, status: p.status, paidAt: p.paidAt ?? undefined })
      paymentsMap.set(p.userId as string, arr)
    }
    for (const p of paidThisMonthByMembershipUser) {
      const u = (p as any).membership?.userId as string | undefined
      if (!u) continue
      const arr = paymentsMap.get(u) || []
      arr.push({ id: p.id, amount: p.amount, currency: p.currency, status: p.status, paidAt: p.paidAt ?? undefined })
      paymentsMap.set(u, arr)
    }
    // By membershipId for completeness
    const paidThisMonthByMembershipId = membershipIds.length ? await prisma.payment.findMany({
      where: {
        academyId,
        status: 'PAID',
        paidAt: { gte: startOfMonth, lt: startOfNextMonth },
        membershipId: { in: membershipIds },
      },
      select: { id: true, amount: true, currency: true, status: true, paidAt: true, membershipId: true },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    }) : []
    const membershipIdToUser = new Map<string, string>()
    for (const s of students) {
      const m = s.memberships?.[0]
      if (m?.id) membershipIdToUser.set(m.id, s.id)
    }
    for (const p of paidThisMonthByMembershipId) {
      const uid = membershipIdToUser.get(p.membershipId as string)
      if (!uid) continue
      const arr = paymentsMap.get(uid) || []
      arr.push({ id: p.id, amount: p.amount, currency: p.currency, status: p.status, paidAt: p.paidAt ?? undefined })
      paymentsMap.set(uid, arr)
    }

    // Transform data for frontend, merging membership payments with user-based monthly payments
    const transformedStudents = students.map((student: any) => {
      const membership = student.memberships[0] || null
      const membershipPayments = (membership?.payments || []).map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt ?? null,
      }))
      const extraPaid = (paymentsMap.get(student.id) || []).map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paidAt: p.paidAt ?? null,
      }))
      // de-duplicate by id, prioritize membershipPayments order
      const mergedById = new Map<string, any>()
      for (const pm of [...membershipPayments, ...extraPaid]) mergedById.set(pm.id, pm)
      const mergedPayments = Array.from(mergedById.values())

      // compute reconciled nextBillingDate from last PAID payment
      const latestPaid = mergedPayments
        .filter((p: any) => p.status === 'PAID' && p.paidAt)
        .sort((a: any, b: any) => new Date(b.paidAt as string).getTime() - new Date(a.paidAt as string).getTime())[0]
      let reconciledNext: Date | null = null
      if (latestPaid && membership?.plan?.type) {
        const months = membership.plan.type === 'MONTHLY' ? 1 : membership.plan.type === 'QUARTERLY' ? 3 : membership.plan.type === 'YEARLY' ? 12 : 1
        const base = new Date(latestPaid.paidAt as string)
        const day = base.getDate()
        const next = new Date(base)
        next.setMonth(next.getMonth() + months)
        if (next.getDate() < day) next.setDate(0)
        reconciledNext = next
      }

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        status: student.status,
        createdAt: student.createdAt.toISOString(),
        membership: membership ? {
          id: membership.id,
          status: membership.status,
          startDate: membership.startDate.toISOString(),
          endDate: membership.endDate?.toISOString(),
          nextBillingDate: (() => {
            const nb = membership.nextBillingDate ? new Date(membership.nextBillingDate) : null
            if (reconciledNext && (!nb || reconciledNext > nb)) return reconciledNext.toISOString()
            return nb?.toISOString()
          })(),
          plan: {
            name: membership.plan.name,
            price: membership.plan.price,
            currency: membership.plan.currency,
            type: membership.plan.type
          }
        } : null,
        payments: mergedPayments.map((payment: any) => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : undefined,
        }))
      }
    })

    return NextResponse.json({
      students: transformedStudents,
      total: students.length
    })

  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!hasPermission(session.user.role, "students:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const { name, email, phone, academyId: bodyAcademyId } = body || {}

    // Resolve academyId: prefer tenant header; else session; SUPER_ADMIN may override via body when no tenant header
    // Multi-tenant support disabled
    let academyId = academyFromTenant?.id ?? (session.user.academyId as string | undefined)
    if (!academyFromTenant && !academyId && session.user.role === "SUPER_ADMIN") {
      academyId = bodyAcademyId
    }
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 })
    }

    // Check for existing user by email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role: "STUDENT",
        status: "ACTIVE",
        academyId,
      },
    })

    return NextResponse.json({
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Error creating student:", error)
    // Handle Prisma unique constraint error code P2002
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }
    // Foreign key violation (e.g., academyId does not exist)
    if (error?.code === "P2003") {
      return NextResponse.json({ error: "Academia inválida" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
