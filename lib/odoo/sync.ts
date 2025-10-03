import { prisma } from "@/lib/prisma"
import { createOdooConnector } from "./connector"
import type { Plan, User, Membership } from "@/lib/types"

export class OdooSyncService {
  private academyId: string
  private odooConnector: ReturnType<typeof createOdooConnector>

  constructor(academyId: string) {
    this.academyId = academyId
    this.odooConnector = createOdooConnector(academyId)
  }

  // Sync Plans to Odoo Products
  async syncPlanToOdoo(plan: Plan): Promise<void> {
    try {
      const productId = await this.odooConnector.ensureProduct({
        name: plan.name,
        price: plan.price,
        recurringRuleType: plan.type === "MONTHLY" ? "monthly" : "yearly",
        externalId: plan.id,
      })

      // Update plan with Odoo product ID
      await prisma.plan.update({
        where: { id: plan.id },
        data: { odooProductId: productId },
      })
    } catch (error) {
      console.error(`Error syncing plan ${plan.id} to Odoo:`, error)
      throw error
    }
  }

  // Sync User to Odoo Partner
  async syncUserToOdoo(user: User): Promise<void> {
    try {
      const partnerId = await this.odooConnector.ensurePartner({
        name: user.name || user.email,
        email: user.email,
        phone: user.phone || undefined,
        externalId: user.id,
      })

      // Update user with Odoo partner ID
      await prisma.user.update({
        where: { id: user.id },
        data: { odooPartnerId: partnerId },
      })
    } catch (error) {
      console.error(`Error syncing user ${user.id} to Odoo:`, error)
      throw error
    }
  }

  // Sync Membership to Odoo Subscription
  async syncMembershipToOdoo(membership: Membership & { user: User; plan: Plan }): Promise<void> {
    try {
      // Ensure user exists in Odoo
      if (!membership.user.odooPartnerId) {
        await this.syncUserToOdoo(membership.user)
      }

      // Ensure plan exists in Odoo
      if (!membership.plan.odooProductId) {
        await this.syncPlanToOdoo(membership.plan)
      }

      // Refresh data after sync
      const updatedMembership = await prisma.membership.findUnique({
        where: { id: membership.id },
        include: { user: true, plan: true },
      })

      if (!updatedMembership?.user.odooPartnerId || !updatedMembership?.plan.odooProductId) {
        throw new Error("Failed to sync dependencies to Odoo")
      }

      const subscriptionId = await this.odooConnector.ensureSubscription({
        partnerId: updatedMembership.user.odooPartnerId,
        templateId: updatedMembership.plan.odooProductId,
        externalId: membership.id,
      })

      // Update membership with Odoo subscription ID
      await prisma.membership.update({
        where: { id: membership.id },
        data: { odooSubscriptionId: subscriptionId },
      })
    } catch (error) {
      console.error(`Error syncing membership ${membership.id} to Odoo:`, error)
      throw error
    }
  }

  // Batch sync all plans for academy
  async syncAllPlansToOdoo(): Promise<void> {
    const plans = await prisma.plan.findMany({
      where: { academyId: this.academyId },
    })

    for (const plan of plans) {
      try {
        await this.syncPlanToOdoo(plan)
      } catch (error) {
        console.error(`Failed to sync plan ${plan.id}:`, error)
        // Continue with other plans
      }
    }
  }

  // Batch sync all users for academy
  async syncAllUsersToOdoo(): Promise<void> {
    const users = await prisma.user.findMany({
      where: { academyId: this.academyId },
    })

    for (const user of users) {
      try {
        await this.syncUserToOdoo(user)
      } catch (error) {
        console.error(`Failed to sync user ${user.id}:`, error)
        // Continue with other users
      }
    }
  }
}

// Utility function to create sync service
export function createOdooSyncService(academyId: string): OdooSyncService {
  return new OdooSyncService(academyId)
}
