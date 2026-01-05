import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function requireStudentSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  if (session.user.role !== "STUDENT") redirect("/unauthorized")
  return session
}

/**
 * Get membership that grants full access (ACTIVE or TRIAL with valid dates)
 */
export async function getActiveMembership(userId: string) {
  const now = new Date()
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIAL"] },
      AND: [
        { startDate: { lte: now } },
        { OR: [{ endDate: null }, { endDate: { gt: now } }] },
      ],
    },
    include: { plan: true },
  })
  return membership
}

/**
 * Get any membership (including PENDING_PAYMENT) for subscription flow tracking
 */
export async function getAnyMembership(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  })
  return membership
}

/**
 * Get membership pending payment
 */
export async function getPendingMembership(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      status: "PENDING_PAYMENT",
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  })
  return membership
}

/**
 * Check if user has a confirmed payment for their membership
 */
export async function hasConfirmedPayment(membershipId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      membershipId,
      status: "PAID",
    },
  })
  return Boolean(payment)
}

/**
 * Activate membership after payment confirmation
 */
export async function activateMembership(membershipId: string) {
  const membership = await prisma.membership.update({
    where: { id: membershipId },
    data: { status: "ACTIVE" },
    include: { plan: true },
  })
  return membership
}
