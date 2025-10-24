import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/club/seed/club-demo
// Carga datos demo: partidos, entrenamientos y pagos para la academia del usuario
export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.academyId) return NextResponse.json({ error: "No academy found" }, { status: 404 })

    const academyId = user.academyId

    // Idempotencia simple por marca DEMO en notas/títulos
    const existingMatches = await (prisma as any).match.count({ where: { academyId, notes: { contains: "DEMO" } } })
    const existingSessions = await (prisma as any).trainingSession.count({ where: { academyId, notes: { contains: "DEMO" } } })
    const existingPayments = await prisma.payment.count({ where: { academyId, externalRef: { contains: "DEMO" } } })

    // Partidos DEMO (BASKETBALL)
    if (existingMatches === 0) {
      await (prisma as any).match.createMany({
        data: [
          {
            academyId,
            sport: "BASKETBALL",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            opponent: "Ryonan",
            location: "Gimnasio Shohoku",
            homeAway: "HOME",
            pointsFor: 78,
            pointsAgainst: 74,
            result: "WIN",
            status: "FINISHED",
            notes: "DEMO: Partido amistoso contra Ryonan",
          },
          {
            academyId,
            sport: "BASKETBALL",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            opponent: "Kainan",
            location: "Gimnasio Kainan",
            homeAway: "AWAY",
            pointsFor: 69,
            pointsAgainst: 75,
            result: "LOSS",
            status: "FINISHED",
            notes: "DEMO: Partido de práctica contra Kainan",
          },
          {
            academyId,
            sport: "BASKETBALL",
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            opponent: "Shoyo",
            location: "Gimnasio Municipal",
            homeAway: "HOME",
            status: "SCHEDULED",
            notes: "DEMO: Próximo encuentro vs Shoyo",
          },
        ],
      })
    }

    // Sesiones de entrenamiento DEMO
    if (existingSessions === 0) {
      await (prisma as any).trainingSession.createMany({
        data: [
          {
            academyId,
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            startTime: "18:00",
            endTime: "19:30",
            duration: 90,
            location: "Cancha 1",
            focus: "Táctica",
            notes: "DEMO: sistemas ofensivos",
            status: "COMPLETED",
          },
          {
            academyId,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            startTime: "18:00",
            endTime: "19:30",
            duration: 90,
            location: "Cancha 2",
            focus: "Físico",
            notes: "DEMO: acondicionamiento",
            status: "COMPLETED",
          },
          {
            academyId,
            date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            startTime: "18:00",
            endTime: "19:30",
            duration: 90,
            location: "Cancha 1",
            focus: "Técnica",
            notes: "DEMO: tiro y manejo de balón",
            status: "SCHEDULED",
          },
        ],
      })
    }

    // Pagos DEMO
    if (existingPayments === 0) {
      await prisma.payment.createMany({
        data: [
          {
            academyId,
            amount: 35000,
            currency: "CLP",
            status: "PAID",
            type: "SUBSCRIPTION",
            method: "TRANSFER",
            paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            externalRef: "DEMO-PAY-001",
          },
          {
            academyId,
            amount: 35000,
            currency: "CLP",
            status: "PAID",
            type: "SUBSCRIPTION",
            method: "CASH",
            paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            externalRef: "DEMO-PAY-002",
          },
          {
            academyId,
            amount: 35000,
            currency: "CLP",
            status: "PENDING",
            type: "SUBSCRIPTION",
            method: null,
            externalRef: "DEMO-PAY-003",
          },
        ],
      })
    }

    return NextResponse.json({
      matchesSeeded: existingMatches === 0,
      sessionsSeeded: existingSessions === 0,
      paymentsSeeded: existingPayments === 0,
    }, { status: 201 })
  } catch (err) {
    console.error("Error seeding club-demo:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
