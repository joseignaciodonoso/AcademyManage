import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validación para actualizar gastos
const updateExpenseSchema = z.object({
  concept: z.string().min(1, "El concepto es requerido").optional(),
  category: z.enum([
    "FIELD_RENTAL", 
    "EQUIPMENT", 
    "TRANSPORTATION", 
    "BALLS", 
    "REFEREES", 
    "INSCRIPTIONS",
    "UNIFORMS",
    "MEDICAL",
    "OTHER"
  ]).optional(),
  amount: z.number().positive("El monto debe ser positivo").optional(),
  currency: z.string().optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  receiptUrl: z.string().optional(),
  receiptName: z.string().optional(),
})

// GET /api/club/expenses/[id] - Obtener gasto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const expense = await prisma.clubExpense.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        academy: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    if (!expense) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    }

    // Verificar permisos
    const userRole = session.user.role
    const userAcademyId = (session.user as any).academyId

    if (userRole === "SUPER_ADMIN" || 
        (["ACADEMY_ADMIN", "COACH"].includes(userRole) && userAcademyId === expense.academyId)) {
      return NextResponse.json(expense)
    }

    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  } catch (error) {
    console.error("Error fetching expense:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/club/expenses/[id] - Actualizar gasto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el gasto existe
    const existingExpense = await prisma.clubExpense.findUnique({
      where: { id: params.id }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    }

    // Verificar permisos
    const userRole = session.user.role
    const userAcademyId = (session.user as any).academyId

    if (!(userRole === "SUPER_ADMIN" || 
          (["ACADEMY_ADMIN", "COACH"].includes(userRole) && userAcademyId === existingExpense.academyId))) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await request.json()
    
    // Validar datos
    const validatedData = updateExpenseSchema.parse(body)

    // Actualizar gasto
    const expense = await prisma.clubExpense.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(expense)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating expense:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/club/expenses/[id] - Eliminar gasto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el gasto existe
    const existingExpense = await prisma.clubExpense.findUnique({
      where: { id: params.id }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    }

    // Verificar permisos (solo ADMIN puede eliminar)
    const userRole = session.user.role
    const userAcademyId = (session.user as any).academyId

    if (!(userRole === "SUPER_ADMIN" || 
          (userRole === "ACADEMY_ADMIN" && userAcademyId === existingExpense.academyId))) {
      return NextResponse.json({ error: "Sin permisos para eliminar" }, { status: 403 })
    }

    // Eliminar gasto
    await prisma.clubExpense.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Gasto eliminado exitosamente" })

  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
