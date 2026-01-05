import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"

/**
 * POST /api/admin/memberships/fix-unpaid
 * Fixes memberships that are ACTIVE but have no confirmed payment
 * Changes them to PENDING_PAYMENT status
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!hasPermission(session.user.role, "membership:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    // Find all ACTIVE memberships in this academy
    const activeMemberships = await prisma.membership.findMany({
      where: {
        academyId,
        status: "ACTIVE",
      },
      include: {
        payments: {
          where: { status: "PAID" },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        plan: {
          select: { id: true, name: true },
        },
      },
    })

    // Filter memberships without confirmed payments
    const unpaidMemberships = activeMemberships.filter(
      (m) => m.payments.length === 0
    )

    // Update them to PENDING_PAYMENT
    const updatedIds: string[] = []
    for (const membership of unpaidMemberships) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { status: "PENDING_PAYMENT" },
      })
      updatedIds.push(membership.id)
    }

    // Create audit log
    if (updatedIds.length > 0) {
      await prisma.auditLog.create({
        data: {
          academyId,
          userId: session.user.id,
          action: "UPDATE",
          resource: "memberships",
          resourceId: updatedIds.join(","),
          newValues: {
            action: "fix_unpaid_memberships",
            count: updatedIds.length,
            membershipIds: updatedIds,
          } as any,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      fixed: updatedIds.length,
      memberships: unpaidMemberships.map((m) => ({
        id: m.id,
        userId: m.user.id,
        userName: m.user.name,
        userEmail: m.user.email,
        planName: m.plan.name,
        previousStatus: "ACTIVE",
        newStatus: "PENDING_PAYMENT",
      })),
    })
  } catch (error) {
    console.error("Error fixing unpaid memberships:", error)
    return NextResponse.json(
      { error: "Error al corregir membresías" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/memberships/fix-unpaid
 * Preview memberships that would be fixed (dry run)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!hasPermission(session.user.role, "membership:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    // Find all ACTIVE memberships in this academy
    const activeMemberships = await prisma.membership.findMany({
      where: {
        academyId,
        status: "ACTIVE",
      },
      include: {
        payments: {
          where: { status: "PAID" },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        plan: {
          select: { id: true, name: true },
        },
      },
    })

    // Filter memberships without confirmed payments
    const unpaidMemberships = activeMemberships.filter(
      (m) => m.payments.length === 0
    )

    return NextResponse.json({
      ok: true,
      totalActive: activeMemberships.length,
      unpaidCount: unpaidMemberships.length,
      memberships: unpaidMemberships.map((m) => ({
        id: m.id,
        userId: m.user.id,
        userName: m.user.name,
        userEmail: m.user.email,
        planName: m.plan.name,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Error checking unpaid memberships:", error)
    return NextResponse.json(
      { error: "Error al verificar membresías" },
      { status: 500 }
    )
  }
}
