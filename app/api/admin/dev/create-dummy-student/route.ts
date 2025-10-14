import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    if (!['SUPER_ADMIN','ACADEMY_ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    // Find or create single academy
    let academy = await prisma.academy.findFirst()
    if (!academy) {
      academy = await prisma.academy.create({ data: { name: "Mi Academia", slug: "mi-academia" } })
    }

    const ts = Date.now()
    const email = `dummy.student+${ts}@example.com`
    const passwordPlain = "Passw0rd!"
    const password = await bcrypt.hash(passwordPlain, 12)

    const user = await prisma.user.create({
      data: {
        academyId: academy.id,
        email,
        name: "Alumno Demo",
        role: "STUDENT",
        password,
        status: "ACTIVE",
      },
    })

    // Ensure there is at least one plan to attach trials
    let plan = await prisma.plan.findFirst({ where: { academyId: academy.id, status: "ACTIVE" } })
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          academyId: academy.id,
          name: "Plan Ilimitado",
          slug: `plan-ilimitado-${ts}`,
          type: "MONTHLY" as any,
          status: "ACTIVE" as any,
          price: 45000,
          currency: "CLP",
          unlimitedClasses: true,
          trialDays: 7,
        },
      })
    }

    // Create trial membership
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    await prisma.membership.create({
      data: {
        academyId: academy.id,
        userId: user.id,
        planId: plan.id,
        status: "TRIAL",
        startDate: now,
        trialEndDate: trialEnd,
      },
    })

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
      credentials: { email, password: passwordPlain },
      academy: { id: academy.id, name: academy.name },
      plan: { id: plan.id, name: plan.name },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 })
  }
}
