import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function PostSignIn() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const role = session.user.role
  const academyId = (session.user as any).academyId as string | undefined

  if (role === "SUPER_ADMIN" || role === "ACADEMY_ADMIN") {
    if (role === "ACADEMY_ADMIN" && !academyId) {
      redirect("/admin/onboarding")
    }
    redirect("/admin/dashboard")
  }

  if (role === "COACH") {
    redirect("/coach/schedule")
  }

  redirect("/app")
}
