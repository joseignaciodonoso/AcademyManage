import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function PostSignIn({ searchParams }: { searchParams: { org?: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const role = session.user.role
  const academyId = (session.user as any).academyId as string | undefined
  let org = searchParams?.org

  // If no org provided in query, try to resolve from user's academy
  if (!org && academyId) {
    const academy = await prisma.academy.findUnique({ where: { id: academyId }, select: { slug: true } })
    org = academy?.slug
  }

  if (role === "SUPER_ADMIN" || role === "ACADEMY_ADMIN") {
    if (org) {
      // Check if this is a CLUB type organization to redirect appropriately
      const academy = await prisma.academy.findUnique({ 
        where: { id: academyId }, 
        select: { type: true } 
      })
      
      if (academy?.type === "CLUB") {
        redirect(`/${org}/club/dashboard`)
      } else {
        redirect(`/${org}/admin/dashboard`)
      }
    }
    redirect("/admin/dashboard")
  }

  if (role === "COACH") {
    if (org) redirect(`/${org}/coach/schedule`)
    redirect("/coach/schedule")
  }

  if (org) redirect(`/${org}/app`)
  redirect("/app")
}
