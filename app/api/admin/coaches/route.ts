import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

function requireAdmin(role?: string) {
  return !!role && ["SUPER_ADMIN", "ACADEMY_ADMIN"].includes(role)
}

const CreateCoachSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
})

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user?.id || !requireAdmin(role) || !(session.user as any).academyId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  const academyId = (session.user as any).academyId as string
  const coaches = await prisma.user.findMany({
    where: { academyId, role: "COACH" as any },
    select: { 
      id: true, 
      name: true, 
      email: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ coaches })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    
    if (!session?.user?.id || !requireAdmin(role) || !(session.user as any).academyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    
    const academyId = (session.user as any).academyId as string
    const body = await request.json()
    
    // Validar datos
    const data = CreateCoachSchema.parse(body)
    
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    // Crear coach
    const coach = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: "COACH",
        academyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      }
    })
    
    return NextResponse.json({ 
      message: "Coach creado exitosamente",
      coach 
    }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error creating coach:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
