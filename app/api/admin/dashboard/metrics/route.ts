import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!hasPermission(session.user.role, "report:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const now = new Date()
    const firstDayThisMonth = startOfMonth(now)
    const firstDayLastMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    const sixMonthsAgo = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1))

    // Students counts
    const [totalStudents, activeStudents, newStudentsThisMonth] = await Promise.all([
      prisma.user.count({ where: { academyId, role: "STUDENT" } }),
      prisma.user.count({ where: { academyId, role: "STUDENT", status: "ACTIVE" } }),
      prisma.user.count({ where: { academyId, role: "STUDENT", createdAt: { gte: firstDayThisMonth } } }),
    ])

    // Active memberships
    const activeMemberships = await prisma.membership.count({ where: { academyId, status: "ACTIVE" } })

    // Payments aggregates
    const [sumAll, sumMTD, sumPrev] = await Promise.all([
      prisma.payment.aggregate({ where: { academyId, status: "PAID" }, _sum: { amount: true } }),
      prisma.payment.aggregate({
        where: {
          academyId,
          status: "PAID",
          paidAt: { gte: firstDayThisMonth },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          academyId,
          status: "PAID",
          paidAt: { gte: firstDayLastMonth, lt: firstDayThisMonth },
        },
        _sum: { amount: true },
      }),
    ])

    const revenueTotal = sumAll._sum.amount || 0
    const revenueMTD = sumMTD._sum.amount || 0
    const revenueLastMonth = sumPrev._sum.amount || 0
    const arpuMTD = activeStudents > 0 ? revenueMTD / activeStudents : 0

    // Pending dues this month: ACTIVE memberships with nextBillingDate in [this month], excluding users who already paid this month
    const startOfNextMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1))
    const paidUsersThisMonth = await prisma.payment.findMany({
      where: {
        academyId,
        status: 'PAID',
        paidAt: { gte: firstDayThisMonth, lt: startOfNextMonth },
      },
      select: { userId: true },
      distinct: ['userId'],
    })
    const paidUserSet = new Set((paidUsersThisMonth || []).map(p => p.userId).filter(Boolean) as string[])

    const duesMemberships = await prisma.membership.findMany({
      where: {
        academyId,
        status: 'ACTIVE',
        nextBillingDate: { gte: firstDayThisMonth, lt: startOfNextMonth },
      },
      select: {
        userId: true,
        plan: { select: { price: true, currency: true } },
      },
    })

    let pendingPayments = 0
    let pendingAmountMTD = 0
    for (const m of duesMemberships) {
      if (!m.userId) continue
      if (paidUserSet.has(m.userId)) continue
      pendingPayments += 1
      pendingAmountMTD += m.plan?.price || 0
    }

    // Revenue trend (last 6 months, inclusive)
    const paid = await prisma.payment.findMany({
      where: {
        academyId,
        status: "PAID",
        OR: [
          { paidAt: { gte: sixMonthsAgo } },
          { createdAt: { gte: sixMonthsAgo } },
        ],
      },
      select: { amount: true, paidAt: true, createdAt: true },
      orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
    })
    const trendBuckets = new Map<string, number>()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      trendBuckets.set(key, 0)
    }
    for (const p of paid) {
      const dt = p.paidAt || p.createdAt || now
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
      if (trendBuckets.has(key)) {
        trendBuckets.set(key, (trendBuckets.get(key) || 0) + p.amount)
      }
    }
    const revenueTrend = Array.from(trendBuckets.entries()).map(([month, revenue]) => ({ month, revenue }))

    // Recent payments (last 5)
    const recent = await prisma.payment.findMany({
      where: { academyId, status: "PAID" },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { membership: { include: { user: true, plan: true } } },
    })
    const recentPayments = recent.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      paidAt: p.paidAt?.toISOString(),
      userName: p.membership?.user?.name || p.membership?.user?.email || "Alumno",
      planName: p.membership?.plan?.name,
    }))

    // Plan distribution (active memberships per plan)
    const byPlan = await prisma.membership.groupBy({
      by: ["planId"],
      where: { academyId, status: "ACTIVE" },
      _count: { _all: true },
    })
    const planIds = byPlan.map((b) => b.planId)
    const plans = planIds.length
      ? await prisma.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, name: true } })
      : []
    const planNameMap = new Map(plans.map((p) => [p.id, p.name]))
    const planDistribution = byPlan.map((b) => ({
      planId: b.planId,
      name: planNameMap.get(b.planId) || "Plan",
      count: (b as any)._count?._all ?? (b as any)._count ?? 0,
    }))

    // Students trend (last 6 months): signups and membership starts/ends
    const studentsSince = sixMonthsAgo
    const [studentsCreated, membershipsStarted, membershipsEnded] = await Promise.all([
      prisma.user.findMany({
        where: { academyId, role: "STUDENT", createdAt: { gte: studentsSince } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.membership.findMany({
        where: { academyId, startDate: { gte: studentsSince } },
        select: { startDate: true },
        orderBy: { startDate: "asc" },
      }),
      prisma.membership.findMany({
        where: { academyId, endDate: { not: null, gte: studentsSince } },
        select: { endDate: true },
        orderBy: { endDate: "asc" },
      }),
    ])

    const studentBuckets = new Map<string, { signups: number; starts: number; ends: number }>()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      studentBuckets.set(k, { signups: 0, starts: 0, ends: 0 })
    }
    for (const u of studentsCreated) {
      const dt = u.createdAt
      const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
      if (studentBuckets.has(k)) studentBuckets.get(k)!.signups += 1
    }
    for (const m of membershipsStarted) {
      const dt = m.startDate
      const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
      if (studentBuckets.has(k)) studentBuckets.get(k)!.starts += 1
    }
    for (const m of membershipsEnded) {
      const dt = m.endDate as Date
      const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
      if (studentBuckets.has(k)) studentBuckets.get(k)!.ends += 1
    }
    const studentsTrend = Array.from(studentBuckets.entries()).map(([month, vals]) => ({ month, ...vals }))

    return NextResponse.json({
      totalStudents,
      activeStudents,
      newStudentsThisMonth,
      activeMemberships,
      revenueTotal,
      revenueMTD,
      revenueLastMonth,
      arpuMTD,
      revenueTrend,
      recentPayments,
      planDistribution,
      studentsTrend,
      pendingPayments,
      pendingAmountMTD,
    })
  } catch (error) {
    console.error("Error dashboard metrics:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
