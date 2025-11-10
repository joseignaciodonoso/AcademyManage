import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateBankAccountSchema = z.object({
  name: z.string().min(1).optional(),
  bank: z.string().min(1).optional(),
  accountType: z.enum(["CHECKING", "SAVINGS", "CREDIT", "OTHER"]).optional(),
  accountNumber: z.string().min(1).optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
})

// PUT /api/admin/bank-accounts/[id] - Actualizar cuenta bancaria
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = (session.user as any).academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academy ID no encontrado" }, { status: 400 })
    }

    // Verificar permisos
    const userRole = session.user.role
    if (!["SUPER_ADMIN", "ACADEMY_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    // Verificar que la cuenta existe y pertenece a la academia
    const existingAccount = await prisma.bankAccount.findUnique({
      where: { id: params.id },
    })

    if (!existingAccount) {
      return NextResponse.json({ error: "Cuenta bancaria no encontrada" }, { status: 404 })
    }

    if (existingAccount.academyId !== academyId && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sin permisos para esta cuenta" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateBankAccountSchema.parse(body)

    // Actualizar cuenta bancaria
    const bankAccount = await prisma.bankAccount.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(bankAccount)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating bank account:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/bank-accounts/[id] - Eliminar cuenta bancaria
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const academyId = (session.user as any).academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academy ID no encontrado" }, { status: 400 })
    }

    // Verificar permisos (solo ADMIN puede eliminar)
    const userRole = session.user.role
    if (!["SUPER_ADMIN", "ACADEMY_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos para eliminar" }, { status: 403 })
    }

    // Verificar que la cuenta existe
    const existingAccount = await prisma.bankAccount.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    })

    if (!existingAccount) {
      return NextResponse.json({ error: "Cuenta bancaria no encontrada" }, { status: 404 })
    }

    if (existingAccount.academyId !== academyId && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sin permisos para esta cuenta" }, { status: 403 })
    }

    // Verificar si tiene pagos asociados
    if (existingAccount._count.payments > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una cuenta con pagos asociados. Desactívala en su lugar." },
        { status: 400 }
      )
    }

    // Eliminar cuenta bancaria
    await prisma.bankAccount.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Cuenta bancaria eliminada exitosamente" })
  } catch (error) {
    console.error("Error deleting bank account:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
