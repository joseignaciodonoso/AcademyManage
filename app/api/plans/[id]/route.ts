import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    
    if (!hasPermission(session.user.role, "plan:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const planId = params.id
    const body = await request.json()

    // Verify plan belongs to user's academy
    const existingPlan = await prisma.plan.findFirst({
      where: {
        id: planId,
        academyId: academyId
      }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    // Update plan
    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        name: body.name,
        slug: body.slug,
        price: body.price,
        currency: body.currency,
        type: body.type,
        classesPerMonth: body.classesPerMonth,
        unlimitedClasses: body.unlimitedClasses,
        accessToContent: body.accessToContent,
        personalTraining: body.personalTraining,
        competitionAccess: body.competitionAccess
      }
    })

    return NextResponse.json({
      message: "Plan actualizado exitosamente",
      plan: updatedPlan
    })

  } catch (error) {
    console.error("Error updating plan:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    
    if (!hasPermission(session.user.role, "plan:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const planId = params.id

    // Verify plan belongs to user's academy
    const existingPlan = await prisma.plan.findFirst({
      where: {
        id: planId,
        academyId: academyId
      }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    // Check if plan has active memberships
    const activeMemberships = await prisma.membership.count({
      where: {
        planId: planId,
        status: "ACTIVE"
      }
    })

    if (activeMemberships > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar el plan porque tiene ${activeMemberships} suscripción(es) activa(s)` 
      }, { status: 400 })
    }

    // Soft delete by setting status to INACTIVE
    await prisma.plan.update({
      where: { id: planId },
      data: { status: "INACTIVE" }
    })

    return NextResponse.json({
      message: "Plan eliminado exitosamente"
    })

  } catch (error) {
    console.error("Error deleting plan:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
