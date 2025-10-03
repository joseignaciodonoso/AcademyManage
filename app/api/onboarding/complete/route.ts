import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requirePermission } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"
import { createOdooSyncService } from "@/lib/odoo/sync"
import type { OnboardingData } from "@/components/onboarding/onboarding-wizard"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    requirePermission(session.user.role, "academy:write")

    const { academyId, data }: { academyId: string; data: OnboardingData } = await request.json()

    if (session.user.academyId !== academyId) {
      return NextResponse.json({ error: "Academia no autorizada" }, { status: 403 })
    }

    // Update academy with onboarding data
    await prisma.academy.update({
      where: { id: academyId },
      data: {
        name: data.academyName || undefined,
        // Odoo connection
        odooUrl: data.odooUrl || undefined,
        odooDb: data.odooDb || undefined,
        odooClientId: data.odooClientId || undefined,
        // Branding
        brandPrimary: data.brandPrimary || "#0066cc",
        brandSecondary: data.brandSecondary || "#666666",
        brandAccent: data.brandAccent || "#ff6b35",
        brandNeutral: data.brandNeutral || "#f5f5f5",
        brandBackground: data.brandBackground || "#ffffff",
        brandForeground: data.brandForeground || "#000000",
        logoUrl: data.logoUrl || undefined,
        logoDarkUrl: data.logoDarkUrl || undefined,
        faviconUrl: data.faviconUrl || undefined,
        defaultThemeMode: data.defaultThemeMode || "system",
        // Mark onboarding as complete
        onboardingCompleted: true,
      },
    })

    // Create branches
    if (data.branches && data.branches.length > 0) {
      await prisma.branch.createMany({
        data: data.branches.map((branch) => ({
          academyId,
          name: branch.name,
          address: branch.address,
          phone: branch.phone || null,
          email: branch.email || null,
          // Operating hours
          mondayOpen: branch.operatingHours.monday?.open || null,
          mondayClose: branch.operatingHours.monday?.close || null,
          tuesdayOpen: branch.operatingHours.tuesday?.open || null,
          tuesdayClose: branch.operatingHours.tuesday?.close || null,
          wednesdayOpen: branch.operatingHours.wednesday?.open || null,
          wednesdayClose: branch.operatingHours.wednesday?.close || null,
          thursdayOpen: branch.operatingHours.thursday?.open || null,
          thursdayClose: branch.operatingHours.thursday?.close || null,
          fridayOpen: branch.operatingHours.friday?.open || null,
          fridayClose: branch.operatingHours.friday?.close || null,
          saturdayOpen: branch.operatingHours.saturday?.open || null,
          saturdayClose: branch.operatingHours.saturday?.close || null,
          sundayOpen: branch.operatingHours.sunday?.open || null,
          sundayClose: branch.operatingHours.sunday?.close || null,
        })),
      })
    }

    // Create plans
    if (data.plans && data.plans.length > 0) {
      const createdPlans = await Promise.all(
        data.plans.map((plan) =>
          prisma.plan.create({
            data: {
              academyId,
              name: plan.name,
              slug: plan.name.toLowerCase().replace(/\s+/g, "-"),
              type: plan.type,
              price: plan.price,
              status: "ACTIVE",
            },
          }),
        ),
      )

      // Sync plans to Odoo if configured
      if (data.odooUrl && data.odooDb) {
        try {
          const syncService = createOdooSyncService(academyId)
          for (const plan of createdPlans) {
            await syncService.syncPlanToOdoo(plan)
          }
        } catch (error) {
          console.error("Error syncing plans to Odoo:", error)
          // Don't fail the onboarding if Odoo sync fails
        }
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        academyId,
        userId: session.user.id,
        action: "UPDATE",
        resource: "academy",
        resourceId: academyId,
        newValues: {
          onboardingCompleted: true,
          branchesCreated: data.branches?.length || 0,
          plansCreated: data.plans?.length || 0,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error completing onboarding:", error)
    return NextResponse.json({ error: "Error al completar la configuración" }, { status: 500 })
  }
}
