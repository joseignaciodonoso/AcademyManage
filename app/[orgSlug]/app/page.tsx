import "server-only"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StudentWelcome } from "@/components/student/welcome/student-welcome"
import { StudentDashboard } from "@/components/student/dashboard/student-dashboard"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
export const runtime = "nodejs"

export default async function StudentPortalPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/${params.orgSlug}/login`)
  }

  if (session.user.role !== "STUDENT") {
    redirect("/unauthorized")
  }

  // Get academy by slug
  const academy = await prisma.academy.findUnique({
    where: { slug: params.orgSlug },
    select: { id: true, name: true, logoUrl: true },
  })

  if (!academy) {
    redirect("/404")
  }

  // Get user data with membership
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { status: { in: ["ACTIVE", "TRIAL"] } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      attendances: {
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        include: { class: true },
        orderBy: { createdAt: "desc" },
      },
      enrollments: {
        include: {
          class: { include: { branch: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  if (!user) {
    redirect(`/${params.orgSlug}/login`)
  }

  const activeMembership = user.memberships[0]
  const hasActivePlan = Boolean(activeMembership)

  // Get available plans for the academy
  const availablePlans = await prisma.plan.findMany({
    where: { academyId: academy.id, status: "ACTIVE" },
    orderBy: { price: "asc" },
    take: 12,
  })

  // Get upcoming classes
  const upcomingClasses = await prisma.class.findMany({
    where: {
      academyId: academy.id,
      startTime: { gte: new Date() },
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
    include: { branch: true },
    orderBy: { startTime: "asc" },
    take: 5,
  })

  // If user doesn't have an active plan, show welcome/onboarding
  if (!hasActivePlan) {
    return (
      <StudentWelcome
        user={{
          id: user.id,
          name: user.name || "",
          email: user.email,
        }}
        academy={{
          id: academy.id,
          name: academy.name,
          logoUrl: academy.logoUrl,
          slug: params.orgSlug,
        }}
        plans={availablePlans.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          currency: p.currency,
          type: p.type,
          classesPerMonth: p.classesPerMonth,
          unlimitedClasses: p.unlimitedClasses,
          description: null,
        }))}
        prefix={`/${params.orgSlug}`}
      />
    )
  }

  // User has active plan - show full dashboard
  return (
    <StudentDashboard
      user={{
        id: user.id,
        name: user.name || "",
        email: user.email,
        beltLevel: user.beltLevel,
        discipline: user.discipline,
      }}
      academy={{
        id: academy.id,
        name: academy.name,
        slug: params.orgSlug,
      }}
      membership={{
        id: activeMembership.id,
        status: activeMembership.status,
        plan: {
          id: activeMembership.plan.id,
          name: activeMembership.plan.name,
          price: activeMembership.plan.price,
          currency: activeMembership.plan.currency,
          classesPerMonth: activeMembership.plan.classesPerMonth,
          unlimitedClasses: activeMembership.plan.unlimitedClasses,
        },
        startDate: activeMembership.startDate,
        endDate: activeMembership.endDate,
      }}
      attendances={user.attendances.map((a) => ({
        id: a.id,
        status: a.status,
        createdAt: a.createdAt,
        className: a.class.title,
      }))}
      upcomingClasses={upcomingClasses.map((c) => ({
        id: c.id,
        title: c.title,
        startTime: c.startTime,
        branchName: c.branch.name,
      }))}
      prefix={`/${params.orgSlug}`}
    />
  )
}
