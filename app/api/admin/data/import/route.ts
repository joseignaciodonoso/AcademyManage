import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import bcrypt from "bcryptjs"

interface ImportData {
  version: string
  exportedAt: string
  academyId: string
  data: {
    academy: any
    users: any[]
    plans: any[]
    payments: any[]
    bankAccounts: any[]
    branches: any[]
    classes: any[]
    classSchedules: any[]
    trainingSessions: any[]
    matches: any[]
    expenses: any[]
    announcements: any[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    requirePermission(session.user.role, "settings:write")

    const academyId = (session.user as any).academyId as string
    if (!academyId) {
      return NextResponse.json({ error: "Academy ID requerido" }, { status: 400 })
    }

    const importData: ImportData = await request.json()

    if (!importData.version || !importData.data) {
      return NextResponse.json({ error: "Formato de archivo inválido" }, { status: 400 })
    }

    const { data } = importData
    const stats = {
      users: 0,
      plans: 0,
      payments: 0,
      bankAccounts: 0,
      branches: 0,
      classes: 0,
      expenses: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Start transaction for data import
    await prisma.$transaction(async (tx) => {
      // 1. Update academy branding settings (if provided)
      if (data.academy) {
        await tx.academy.update({
          where: { id: academyId },
          data: {
            // Only update branding and non-critical settings
            brandPrimary: data.academy.brandPrimary,
            brandSecondary: data.academy.brandSecondary,
            brandAccent: data.academy.brandAccent,
            brandNeutral: data.academy.brandNeutral,
            brandBackground: data.academy.brandBackground,
            brandForeground: data.academy.brandForeground,
            brandPrimaryForeground: data.academy.brandPrimaryForeground,
            brandSecondaryForeground: data.academy.brandSecondaryForeground,
            brandAccentForeground: data.academy.brandAccentForeground,
            brandCard: data.academy.brandCard,
            brandCardForeground: data.academy.brandCardForeground,
            brandPopover: data.academy.brandPopover,
            brandPopoverForeground: data.academy.brandPopoverForeground,
            brandMuted: data.academy.brandMuted,
            brandMutedForeground: data.academy.brandMutedForeground,
            brandBorder: data.academy.brandBorder,
            adminPanelTitle: data.academy.adminPanelTitle,
            studentPortalTitle: data.academy.studentPortalTitle,
            defaultThemeMode: data.academy.defaultThemeMode,
            currency: data.academy.currency,
            timezone: data.academy.timezone,
            dateFormat: data.academy.dateFormat,
            taxRate: data.academy.taxRate,
          },
        })
      }

      // 2. Import Plans (upsert by name)
      for (const plan of data.plans || []) {
        try {
          await tx.plan.upsert({
            where: {
              academyId_name: { academyId, name: plan.name },
            },
            update: {
              description: plan.description,
              price: plan.price,
              currency: plan.currency || "CLP",
              billingPeriod: plan.billingPeriod || "MONTHLY",
              classesPerWeek: plan.classesPerWeek,
              features: plan.features,
              isActive: plan.isActive ?? true,
            },
            create: {
              academyId,
              name: plan.name,
              description: plan.description,
              price: plan.price,
              currency: plan.currency || "CLP",
              billingPeriod: plan.billingPeriod || "MONTHLY",
              classesPerWeek: plan.classesPerWeek,
              features: plan.features,
              isActive: plan.isActive ?? true,
            },
          })
          stats.plans++
        } catch (e: any) {
          stats.errors.push(`Plan ${plan.name}: ${e.message}`)
        }
      }

      // 3. Import Branches (upsert by name)
      for (const branch of data.branches || []) {
        try {
          await tx.branch.upsert({
            where: {
              academyId_name: { academyId, name: branch.name },
            },
            update: {
              address: branch.address,
              city: branch.city,
              phone: branch.phone,
              email: branch.email,
              isActive: branch.isActive ?? true,
            },
            create: {
              academyId,
              name: branch.name,
              address: branch.address,
              city: branch.city,
              phone: branch.phone,
              email: branch.email,
              isActive: branch.isActive ?? true,
            },
          })
          stats.branches++
        } catch (e: any) {
          stats.errors.push(`Branch ${branch.name}: ${e.message}`)
        }
      }

      // 4. Import Bank Accounts (upsert by account number)
      for (const account of data.bankAccounts || []) {
        try {
          const existing = await tx.bankAccount.findFirst({
            where: { academyId, accountNumber: account.accountNumber },
          })
          if (existing) {
            await tx.bankAccount.update({
              where: { id: existing.id },
              data: {
                bankName: account.bankName,
                accountType: account.accountType,
                accountHolder: account.accountHolder,
                rut: account.rut,
                email: account.email,
                isDefault: account.isDefault,
              },
            })
          } else {
            await tx.bankAccount.create({
              data: {
                academyId,
                bankName: account.bankName,
                accountType: account.accountType,
                accountNumber: account.accountNumber,
                accountHolder: account.accountHolder,
                rut: account.rut,
                email: account.email,
                isDefault: account.isDefault,
              },
            })
          }
          stats.bankAccounts++
        } catch (e: any) {
          stats.errors.push(`Bank Account ${account.accountNumber}: ${e.message}`)
        }
      }

      // 5. Import Classes (upsert by name)
      for (const cls of data.classes || []) {
        try {
          await tx.class.upsert({
            where: {
              academyId_name: { academyId, name: cls.name },
            },
            update: {
              description: cls.description,
              maxCapacity: cls.maxCapacity,
              isActive: cls.isActive ?? true,
            },
            create: {
              academyId,
              name: cls.name,
              description: cls.description,
              maxCapacity: cls.maxCapacity || 20,
              isActive: cls.isActive ?? true,
            },
          })
          stats.classes++
        } catch (e: any) {
          stats.errors.push(`Class ${cls.name}: ${e.message}`)
        }
      }

      // 6. Import Users/Students (upsert by email, skip admins)
      for (const user of data.users || []) {
        try {
          // Skip if user is admin or already exists as admin
          const existingUser = await tx.user.findUnique({
            where: { email: user.email },
          })
          
          if (existingUser && existingUser.role !== "STUDENT") {
            stats.skipped++
            continue
          }

          // Generate a temporary password for new users
          const tempPassword = await bcrypt.hash("cambiar123", 10)

          await tx.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              phone: user.phone,
              rut: user.rut,
              birthDate: user.birthDate ? new Date(user.birthDate) : null,
              emergencyContact: user.emergencyContact,
              emergencyPhone: user.emergencyPhone,
              medicalInfo: user.medicalInfo,
              address: user.address,
              status: user.status || "ACTIVE",
            },
            create: {
              academyId,
              email: user.email,
              name: user.name,
              phone: user.phone,
              rut: user.rut,
              birthDate: user.birthDate ? new Date(user.birthDate) : null,
              emergencyContact: user.emergencyContact,
              emergencyPhone: user.emergencyPhone,
              medicalInfo: user.medicalInfo,
              address: user.address,
              role: "STUDENT",
              status: user.status || "ACTIVE",
              password: tempPassword,
            },
          })
          stats.users++

          // Import user's memberships if available
          if (user.memberships && Array.isArray(user.memberships)) {
            for (const membership of user.memberships) {
              try {
                const plan = await tx.plan.findFirst({
                  where: { academyId, name: membership.planName },
                })
                const userRecord = await tx.user.findUnique({
                  where: { email: user.email },
                })
                
                if (plan && userRecord) {
                  await tx.membership.upsert({
                    where: {
                      academyId_planId_userId: {
                        academyId,
                        planId: plan.id,
                        userId: userRecord.id,
                      },
                    },
                    update: {
                      startDate: membership.startDate ? new Date(membership.startDate) : new Date(),
                      endDate: membership.endDate ? new Date(membership.endDate) : null,
                      status: membership.status || "ACTIVE",
                    },
                    create: {
                      academyId,
                      planId: plan.id,
                      userId: userRecord.id,
                      startDate: membership.startDate ? new Date(membership.startDate) : new Date(),
                      endDate: membership.endDate ? new Date(membership.endDate) : null,
                      status: membership.status || "ACTIVE",
                    },
                  })
                }
              } catch (e: any) {
                // Silent fail for membership import
              }
            }
          }
        } catch (e: any) {
          stats.errors.push(`User ${user.email}: ${e.message}`)
        }
      }

      // 7. Import Club Expenses
      for (const expense of data.expenses || []) {
        try {
          await tx.clubExpense.create({
            data: {
              academyId,
              description: expense.description,
              amount: expense.amount,
              currency: expense.currency || "CLP",
              category: expense.category || "OTHER",
              date: expense.date ? new Date(expense.date) : new Date(),
              notes: expense.notes,
            },
          })
          stats.expenses++
        } catch (e: any) {
          stats.errors.push(`Expense: ${e.message}`)
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Datos importados exitosamente",
      stats,
    })
  } catch (error: any) {
    console.error("Error importing data:", error)
    return NextResponse.json({ 
      error: "Error al importar datos",
      details: error.message 
    }, { status: 500 })
  }
}
