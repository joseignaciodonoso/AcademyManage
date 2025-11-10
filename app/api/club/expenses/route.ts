import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validación para crear/actualizar gastos
const expenseSchema = z.object({
  concept: z.string().min(1, "El concepto es requerido"),
  category: z.enum([
    // Categorías de Clubes
    "FIELD_RENTAL", 
    "EQUIPMENT", 
    "TRANSPORTATION", 
    "BALLS", 
    "REFEREES", 
    "INSCRIPTIONS",
    "UNIFORMS",
    "MEDICAL",
    // Categorías de Academias
    "FACILITY_RENTAL",    // Arriendo de dojo/gimnasio
    "BELTS_UNIFORMS",     // Cinturones y uniformes
    "COMPETITION_FEES",   // Inscripciones a competencias
    "MARKETING",          // Marketing y publicidad
    "UTILITIES",          // Servicios básicos (agua, luz, internet)
    "INSURANCE",          // Seguros
    "MAINTENANCE",        // Mantenimiento de instalaciones
    "TRAINING_MATERIALS", // Materiales de entrenamiento
    "SOFTWARE",           // Software y sistemas
    "MEDICAL_SUPPLIES",   // Botiquín y suministros médicos
    "CERTIFICATION",      // Certificaciones y licencias
    "OTHER"
  ]),
  amount: z.number().positive("El monto debe ser positivo"),
  currency: z.string().default("CLP"),
  date: z.string().transform((str) => new Date(str)),
  receiptUrl: z.string().optional(),
  receiptName: z.string().optional(),
})

// GET /api/club/expenses - Listar gastos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const academyId = searchParams.get("academyId")
    const category = searchParams.get("category")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!academyId) {
      return NextResponse.json({ error: "academyId es requerido" }, { status: 400 })
    }

    // Verificar permisos
    const userRole = session.user.role
    if (!["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    // Construir filtros
    const where: any = { academyId }
    
    if (category && category !== "ALL") {
      where.category = category
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    // Obtener gastos con paginación
    const [expenses, total] = await Promise.all([
      prisma.clubExpense.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.clubExpense.count({ where })
    ])

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/club/expenses - Crear nuevo gasto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar permisos
    const userRole = session.user.role
    if (!["SUPER_ADMIN", "ACADEMY_ADMIN", "COACH"].includes(userRole)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await request.json()
    const { academyId, ...expenseData } = body

    if (!academyId) {
      return NextResponse.json({ error: "academyId es requerido" }, { status: 400 })
    }

    // Validar datos
    const validatedData = expenseSchema.parse(expenseData)

    // Crear gasto
    const expense = await prisma.clubExpense.create({
      data: {
        ...validatedData,
        academyId,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(expense, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
