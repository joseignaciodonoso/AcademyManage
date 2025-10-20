import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { 
      type,
      sport,
      academyName, 
      slug, 
      adminName, 
      email, 
      password, 
      phone,
      discipline 
    } = await request.json()

    // Validations
    if (!academyName || !slug || !adminName || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben ser completados" }, 
        { status: 400 }
      )
    }

    // Validate type
    if (type && !["ACADEMY", "CLUB"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de organización inválido" }, 
        { status: 400 }
      )
    }

    // Validate sport for clubs
    if (type === "CLUB" && sport && !["FOOTBALL", "BASKETBALL"].includes(sport)) {
      return NextResponse.json(
        { error: "Deporte inválido" }, 
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" }, 
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingAcademy = await prisma.academy.findUnique({
      where: { slug },
    })

    if (existingAcademy) {
      return NextResponse.json(
        { error: "El identificador de la academia ya está en uso. Por favor elige otro." }, 
        { status: 400 }
      )
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "El identificador debe contener solo letras minúsculas, números y guiones" }, 
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create academy and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the academy
      const academy = await tx.academy.create({
        data: {
          name: academyName,
          slug: slug.toLowerCase(),
          type: (type as "ACADEMY" | "CLUB") || "ACADEMY",
          sport: type === "CLUB" ? (sport as "FOOTBALL" | "BASKETBALL") : null,
          discipline: discipline || (type === "CLUB" ? "Deportes" : "Artes Marciales"),
          onboardingCompleted: false, // Will complete onboarding wizard
        },
      })

      // 2. Create the admin user
      const adminUser = await tx.user.create({
        data: {
          name: adminName,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone: phone || null,
          role: "ACADEMY_ADMIN",
          academyId: academy.id,
        },
      })

      return { academy, adminUser }
    })

    console.log(`✅ Academy created: ${result.academy.name} (${result.academy.slug})`)
    console.log(`✅ Admin user created: ${result.adminUser.email} (ID: ${result.adminUser.id})`)

    return NextResponse.json(
      {
        message: "Academia creada exitosamente",
        academyId: result.academy.id,
        academySlug: result.academy.slug,
        userId: result.adminUser.id,
        email: result.adminUser.email,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating academy:", error)
    return NextResponse.json(
      { error: "Error interno del servidor al crear la academia" },
      { status: 500 }
    )
  }
}
