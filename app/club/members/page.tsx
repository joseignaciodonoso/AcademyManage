import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function ClubMembersRedirect() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  const academyId = (session.user as any).academyId as string | undefined
  if (!academyId) redirect("/unauthorized")
  const academy = await prisma.academy.findUnique({ where: { id: academyId }, select: { slug: true } })
  const slug = academy?.slug || ""
  if (!slug) redirect("/unauthorized")
  redirect(`/${slug}/club/members`)
}
