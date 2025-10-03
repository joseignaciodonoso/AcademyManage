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
    if (!hasPermission(session.user.role, "plan:read")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    // Fetch plans from database
    const plans = await prisma.plan.findMany({
      where: {
        academyId: academyId,
        status: 'ACTIVE'
      },
      orderBy: {
        price: 'asc'
      },
      include: {
        _count: { select: { memberships: true } }
      }
    })

    return NextResponse.json({
      plans: plans,
      total: plans.length
    })

  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const { name, slug, price, currency = "CLP", type, classesPerMonth, unlimitedClasses, accessToContent, personalTraining, competitionAccess } = await request.json()

    // Validate required fields
    if (!name || !slug || !price || !type) {
      return NextResponse.json({ error: "Campos requeridos: name, slug, price, type" }, { status: 400 })
    }

    // Create plan in database
    const plan = await prisma.plan.create({
      data: {
        academyId,
        name,
        slug,
        price,
        currency,
        type,
        classesPerMonth,
        unlimitedClasses: unlimitedClasses || false,
        accessToContent: accessToContent || false,
        personalTraining: personalTraining || false,
        competitionAccess: competitionAccess || false,
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({
      message: "Plan creado exitosamente",
      plan: plan
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating plan:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
