import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@/lib/types"
import bcrypt from "bcryptjs"
import { createOdooConnector } from "@/lib/odoo/connector"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, selectedPlan } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 })
    }

    // Force role to STUDENT for all public signups
    const forcedRole: UserRole = "STUDENT"
    // Students created via public signup are not attached to an academy by default
    // If you want to attach to a demo academy, set its ID here; otherwise leave null
    const academyId: string | null = null

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: forcedRole as UserRole,
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
              name: planInfo.name,
              description: `${planInfo.name} - Entrenamiento completo`,
              price: planInfo.price,
              currency: "CLP",
              type: planInfo.type as any,
              isActive: true,
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
