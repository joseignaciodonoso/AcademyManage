import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-simple"
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

    // Transform data for frontend
    const transformedStudents = students.map((student: any) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      createdAt: student.createdAt.toISOString(),
      membership: student.memberships[0] ? {
        id: student.memberships[0].id,
        status: student.memberships[0].status,
        startDate: student.memberships[0].startDate.toISOString(),
        endDate: student.memberships[0].endDate?.toISOString(),
        nextBillingDate: student.memberships[0].nextBillingDate?.toISOString(),
        plan: {
          name: student.memberships[0].plan.name,
          price: student.memberships[0].plan.price,
          currency: student.memberships[0].plan.currency,
          type: student.memberships[0].plan.type
        }
      } : null,
      payments: student.memberships[0]?.payments.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt?.toISOString()
      })) || []
    }))

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

    // Resolve academyId: from session for admins; for SUPER_ADMIN allow override via body
    let academyId = session.user.academyId as string | undefined
    if (!academyId && session.user.role === "SUPER_ADMIN") {
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
