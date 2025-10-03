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

  if (!session.user.academyId) {
    redirect("/auth/signin")
  }

  // Check if onboarding is already completed
  const academy = await prisma.academy.findUnique({
    where: { id: session.user.academyId },
    select: { onboardingCompleted: true },
  })

  if (academy?.onboardingCompleted) {
    redirect("/admin/dashboard")
  }

  return (
    <OnboardingWizard
      academyId={session.user.academyId}
      onComplete={() => {
        // This will be handled by the component
      }}
    />
  )
}
