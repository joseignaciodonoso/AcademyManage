import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

// GET /api/admin/students/[id]/payments - Get student payment history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!hasPermission(session.user.role, "payment:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const studentId = params.id
    const userAcademyId = (session.user as any).academyId

    // Verify student exists
    const student = await prisma.user.findFirst({
      where: { 
        id: studentId,
        role: "STUDENT",
        ...(session.user.role !== "SUPER_ADMIN" ? { academyId: userAcademyId } : {})
      },
      select: { id: true }
    })

    if (!student) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
    }

    // Get student's memberships
    const memberships = await prisma.membership.findMany({
      where: { userId: studentId },
      select: { id: true }
    })

    const membershipIds = memberships.map(m => m.id)

    // Get payments for those memberships
    const payments = await prisma.payment.findMany({
      where: {
        membershipId: { in: membershipIds }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    return NextResponse.json({
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        method: (p as any).method || null,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
        transactionId: p.externalRef || p.odooTransactionId || null
      }))
    })
  } catch (error: any) {
    console.error("Error fetching student payments:", error)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}
