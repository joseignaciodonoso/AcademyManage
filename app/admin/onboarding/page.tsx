import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "ACADEMY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized")
  }

  // If SUPER_ADMIN, skip onboarding
  if (session.user.role === "SUPER_ADMIN") {
    redirect("/admin/dashboard")
  }

  // Ensure ACADEMY_ADMIN has an academy; create one if missing
  let academyId = (session.user as any).academyId as string | undefined
  if (!academyId && session.user.role === "ACADEMY_ADMIN") {
    // Generate a unique slug based on user name or email local part
    const base = (session.user.name || session.user.email.split("@")[0] || "mi-academia")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 32)
    let slug = base || "mi-academia"
    let suffix = 0
    // ensure uniqueness
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await prisma.academy.findUnique({ where: { slug } })
      if (!exists) break
      suffix += 1
      slug = `${base}-${suffix}`
    }

    const created = await prisma.academy.create({
      data: {
        name: session.user.name || "Mi Academia",
        slug,
        onboardingCompleted: false,
      },
      select: { id: true },
    })
    academyId = created.id
    await prisma.user.update({
      where: { id: session.user.id },
      data: { academyId },
    })
  }

  // Check if onboarding is already completed
  const academy = academyId
    ? await prisma.academy.findUnique({
    where: { id: academyId },
    select: { onboardingCompleted: true },
  })
    : null

  if (academy?.onboardingCompleted) {
    redirect("/admin/dashboard")
  }

  return (
    <OnboardingWizard academyId={academyId as string} />
  )
}
