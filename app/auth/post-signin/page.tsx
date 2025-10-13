import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function PostSignIn() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const role = session.user.role

  if (role === "SUPER_ADMIN" || role === "ACADEMY_ADMIN") {
    redirect("/admin/dashboard")
  }

  if (role === "COACH") {
    redirect("/coach/schedule")
  }

  redirect("/app")
}
