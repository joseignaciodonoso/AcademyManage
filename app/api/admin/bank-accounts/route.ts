import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validación para crear/actualizar cuentas bancarias
const bankAccountSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  bank: z.string().min(1, "El banco es requerido"),
  accountType: z.enum(["CHECKING", "SAVINGS", "CREDIT", "OTHER"]),
  accountNumber: z.string().min(1, "El número de cuenta es requerido"),
  currency: z.string().default("CLP"),
  isActive: z.boolean().default(true),
})

// GET /api/admin/bank-accounts - Listar cuentas bancarias
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("activeOnly") === "true"

    const academyId = (session.user as any).academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academy ID no encontrado" }, { status: 400 })
    }

    // Verificar permisos
    const userRole = session.user.role
    if (!["SUPER_ADMIN", "ACADEMY_ADMIN", "FINANCE"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    // Obtener cuentas bancarias
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        academyId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ bankAccounts })
  } catch (error) {
    console.error("Error fetching bank accounts:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/admin/bank-accounts - Crear cuenta bancaria
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = bankAccountSchema.parse(body)

    // Crear cuenta bancaria
    const bankAccount = await prisma.bankAccount.create({
      data: {
        ...validatedData,
        academyId,
      },
    })

    return NextResponse.json(bankAccount, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating bank account:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
