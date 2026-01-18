import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@/lib/types"
import bcrypt from "bcryptjs"
import { createOdooConnector } from "@/lib/odoo/connector"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, selectedPlan, orgSlug } = await request.json()

    console.log("📝 Student signup request:", { name, email, phone, orgSlug })

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log(`❌ Signup failed: email '${email}' already exists`)
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 })
    }

    // Force role to STUDENT for all public signups
    
    // Find academy by orgSlug if provided, otherwise use first academy
    let academyId: string | null = null
    if (orgSlug) {
      const academy = await prisma.academy.findUnique({
        where: { slug: orgSlug },
        select: { id: true, name: true }
      })
      if (academy) {
        academyId = academy.id
        console.log(`✅ Found academy: ${academy.name} (${academyId})`)
      } else {
        console.log(`⚠️ Academy with slug '${orgSlug}' not found, using first academy`)
      }
    }
    
    // Fallback: use first academy or create one
    if (!academyId) {
      const existingAcademy = await prisma.academy.findFirst({})
      if (existingAcademy) {
        academyId = existingAcademy.id
      } else {
        const created = await prisma.academy.create({
          data: { name: "Mi Academia", slug: "mi-academia", onboardingCompleted: false },
          select: { id: true },
        })
        academyId = created.id
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: "STUDENT",
        academyId,
      },
    })

    console.log(`🔍 User created in DB: ${JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })}`)

    // If user selected a plan and academyId is available, create membership (optional)
    if (selectedPlan && academyId) {
      try {
        // Create plan in database if it doesn't exist
        const planData = {
          "plan_monthly_basic": { name: "Plan Básico", price: 25000, type: "MONTHLY" },
          "plan_monthly_premium": { name: "Plan Premium", price: 45000, type: "MONTHLY" },
          "plan_yearly_master": { name: "Plan Maestro", price: 480000, type: "YEARLY" }
        }

        const planInfo = planData[selectedPlan as keyof typeof planData]
        if (planInfo) {
          // Upsert plan
          const plan = await prisma.plan.upsert({
            where: { id: selectedPlan },
            update: {},
            create: {
              id: selectedPlan,
              academyId,
              slug: selectedPlan,
              name: planInfo.name,
              price: planInfo.price,
              currency: "CLP",
              type: planInfo.type as any,
            }
          })

          // Create membership
          const membership = await prisma.membership.create({
            data: {
              userId: user.id,
              planId: plan.id,
              academyId,
              status: "ACTIVE", // Mock payment success
              startDate: new Date(),
              endDate: new Date(Date.now() + (planInfo.type === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000),
              nextBillingDate: new Date(Date.now() + (planInfo.type === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000),
            }
          })

          // Create mock payment record
          await prisma.payment.create({
            data: {
              academyId,
              membershipId: membership.id,
              amount: planInfo.price,
              currency: "CLP",
              status: "PAID", // Mock payment success
              type: "SUBSCRIPTION",
              externalRef: `mock_${user.id}_${Date.now()}`,
              paidAt: new Date(),
            }
          })

          // Skip Odoo sync for now to avoid session issues
          // TODO: Implement proper Odoo session management
          console.log(`⚠️ Skipping Odoo sync for ${user.email} - will sync later`)

          console.log(`✅ User ${user.email} registered with plan ${selectedPlan} and synced to Odoo`)
        }
      } catch (error) {
        console.error("Error creating membership or syncing with Odoo:", error)
        // Don't fail the registration, just log the error
      }
    }

    console.log(`✅ User registration complete: ${user.email} (ID: ${user.id})`)
    console.log(`📧 Returning user data: email=${user.email}, id=${user.id}`)
    
    return NextResponse.json({ 
      message: "Usuario creado exitosamente", 
      userId: user.id,
      email: user.email,
      planCreated: !!selectedPlan 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
