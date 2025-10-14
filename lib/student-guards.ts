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
