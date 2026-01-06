import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    requirePermission(session.user.role, "settings:write")

    const academyId = (session.user as any).academyId as string
    if (!academyId) {
      return NextResponse.json({ error: "Academy ID requerido" }, { status: 400 })
    }

    // Fetch all exportable data - using raw queries to avoid type issues
    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
    })

    const users = await prisma.user.findMany({
      where: { 
        academyId,
        role: "STUDENT"
      },
    })

    const plans = await prisma.plan.findMany({
      where: { academyId },
    })

    const memberships = await prisma.membership.findMany({
      where: { academyId },
      include: {
        user: { select: { email: true } },
        plan: { select: { name: true } },
      },
    })

    const payments = await prisma.payment.findMany({
      where: { academyId },
      include: {
        user: { select: { email: true } },
      },
    })

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { academyId },
    })

    const branches = await prisma.branch.findMany({
      where: { academyId },
    })

    const expenses = await prisma.clubExpense.findMany({
      where: { academyId },
    })

    const trainingSessions = await prisma.trainingSession.findMany({
      where: { academyId },
    })

    const matches = await prisma.match.findMany({
      where: { academyId },
    })

    const announcements = await prisma.announcement.findMany({
      where: { academyId },
    })

    // Build export object - sanitize sensitive data
    const sanitizedUsers = users.map(u => {
      const { password, ...userData } = u as any
      return {
        ...userData,
        memberships: memberships
          .filter(m => m.user?.email === u.email)
          .map(m => ({
            planName: m.plan?.name,
            startDate: m.startDate,
            endDate: m.endDate,
            status: m.status,
          })),
      }
    })

    const sanitizedAcademy = academy ? {
      name: academy.name,
      slug: academy.slug,
      type: academy.type,
      sport: academy.sport,
      discipline: academy.discipline,
      brandPrimary: academy.brandPrimary,
      brandSecondary: academy.brandSecondary,
      brandAccent: academy.brandAccent,
      brandNeutral: academy.brandNeutral,
      brandBackground: academy.brandBackground,
      brandForeground: academy.brandForeground,
      brandPrimaryForeground: academy.brandPrimaryForeground,
      brandSecondaryForeground: academy.brandSecondaryForeground,
      brandAccentForeground: academy.brandAccentForeground,
      brandCard: academy.brandCard,
      brandCardForeground: academy.brandCardForeground,
      brandPopover: academy.brandPopover,
      brandPopoverForeground: academy.brandPopoverForeground,
      brandMuted: academy.brandMuted,
      brandMutedForeground: academy.brandMutedForeground,
      brandBorder: academy.brandBorder,
      adminPanelTitle: academy.adminPanelTitle,
      studentPortalTitle: academy.studentPortalTitle,
      defaultThemeMode: academy.defaultThemeMode,
      currency: academy.currency,
      timezone: academy.timezone,
      taxRate: academy.taxRate,
    } : null

    const sanitizedPayments = payments.map(p => ({
      userEmail: p.user?.email,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      method: p.method,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    }))

    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      academyId,
      data: {
        academy: sanitizedAcademy,
        users: sanitizedUsers,
        plans,
        payments: sanitizedPayments,
        bankAccounts,
        branches,
        trainingSessions,
        matches,
        expenses,
        announcements,
      },
    }

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${academy?.slug || academyId}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 })
  }
}
