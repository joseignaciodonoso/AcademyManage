import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 401 })
    }

    const body = await request.json()
    const { confirm } = body

    if (confirm !== "DELETE_SHOHOKU_AND_USER") {
      return NextResponse.json({ 
        error: "Confirmation required. Send: { confirm: 'DELETE_SHOHOKU_AND_USER' }" 
      }, { status: 400 })
    }

    console.log("🧹 Starting cleanup process...")

    // 1. Buscar la academia
    const academy = await prisma.academy.findFirst({
      where: { 
        OR: [
          { slug: 'shohoku' },
          { name: { contains: 'shohoku', mode: 'insensitive' } }
        ]
      }
    })

    if (!academy) {
      return NextResponse.json({ error: "Academy 'shohoku' not found" }, { status: 404 })
    }

    console.log(`📋 Found academy: ${academy.name} (${academy.id})`)

    // 2. Buscar el usuario
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'jisantander@resit.cl' },
          { email: { contains: 'jisantander', mode: 'insensitive' } },
          { email: { contains: 'resit', mode: 'insensitive' } }
        ]
      }
    })

    if (!user) {
      console.log("⚠️ User not found, continuing with academy cleanup...")
    } else {
      console.log(`👤 Found user: ${user.name} (${user.email}, ID: ${user.id})`)
    }

    // 3. Eliminar datos en orden correcto (para evitar foreign key constraints)
    console.log("🗑️  Deleting related data...")

    // Datos de auditoría y caché
    await prisma.auditLog.deleteMany({ where: { academyId: academy.id } })
    await prisma.kpiCache.deleteMany({ where: { academyId: academy.id } })

    // Contenido y canales
    await prisma.contentPermission.deleteMany({ where: { academyId: academy.id } })
    await prisma.channel.deleteMany({ where: { academyId: academy.id } })
    await prisma.content.deleteMany({ where: { academyId: academy.id } })

    // Clases y horarios
    await prisma.attendance.deleteMany({ 
      where: { class: { academyId: academy.id } } 
    })
    await prisma.enrollment.deleteMany({ 
      where: { class: { academyId: academy.id } } 
    })
    await prisma.classSchedule.deleteMany({ where: { academyId: academy.id } })
    await prisma.class.deleteMany({ where: { academyId: academy.id } })

    // Eventos y registros
    await prisma.eventRegistration.deleteMany({ where: { academyId: academy.id } })
    await prisma.event.deleteMany({ where: { academyId: academy.id } })

    // Pagos y membresías
    await prisma.payment.deleteMany({ where: { academyId: academy.id } })
    await prisma.membership.deleteMany({ where: { academyId: academy.id } })
    await prisma.plan.deleteMany({ where: { academyId: academy.id } })

    // Sedes y currícula
    await prisma.branch.deleteMany({ where: { academyId: academy.id } })
    await prisma.curriculum.deleteMany({ where: { academyId: academy.id } })

    // Datos específicos de CLUB
    await prisma.clubExpense.deleteMany({ where: { academyId: academy.id } })
    await prisma.announcement.deleteMany({ where: { academyId: academy.id } })
    
    // Entrenamientos
    await prisma.trainingAttendance.deleteMany({ 
      where: { session: { academyId: academy.id } } 
    })
    await prisma.trainingSession.deleteMany({ where: { academyId: academy.id } })
    await prisma.trainingSchedule.deleteMany({ where: { academyId: academy.id } })
    await prisma.trainingInstance.deleteMany({ where: { academyId: academy.id } })

    // Partidos y torneos
    await prisma.matchPlayerStat.deleteMany({ 
      where: { match: { academyId: academy.id } } 
    })
    await prisma.matchCallupPlayer.deleteMany({ 
      where: { callup: { match: { academyId: academy.id } } } 
    })
    await prisma.matchCallup.deleteMany({ 
      where: { match: { academyId: academy.id } } 
    })
    await prisma.playerEvaluation.deleteMany({ 
      where: { match: { academyId: academy.id } } 
    })
    await prisma.match.deleteMany({ where: { academyId: academy.id } })
    await prisma.tournamentStanding.deleteMany({ 
      where: { tournament: { academyId: academy.id } } 
    })
    await prisma.tournament.deleteMany({ where: { academyId: academy.id } })

    // 4. Eliminar la academia
    await prisma.academy.delete({ where: { id: academy.id } })
    console.log("✅ Academy deleted successfully")

    // 5. Eliminar el usuario si existe
    if (user) {
      // Datos del usuario
      await prisma.playerGoal.deleteMany({ where: { userId: user.id } })
      await prisma.userBadge.deleteMany({ where: { userId: user.id } })
      await prisma.playerDocument.deleteMany({ where: { userId: user.id } })
      await prisma.playerProfile.deleteMany({ where: { userId: user.id } })
      
      // Sesiones y cuentas
      await prisma.account.deleteMany({ where: { userId: user.id } })
      await prisma.session.deleteMany({ where: { userId: user.id } })
      
      // Finalmente el usuario
      await prisma.user.delete({ where: { id: user.id } })
      console.log("✅ User deleted successfully")
    }

    console.log("🎉 Cleanup completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Cleanup completed successfully",
      deleted: {
        academy: { id: academy.id, name: academy.name, slug: academy.slug },
        user: user ? { id: user.id, name: user.name, email: user.email } : null
      }
    })

  } catch (error) {
    console.error("❌ Cleanup error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET endpoint para verificar qué se eliminará
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN required" }, { status: 401 })
    }

    // Buscar qué se eliminará
    const academy = await prisma.academy.findFirst({
      where: { 
        OR: [
          { slug: 'shohoku' },
          { name: { contains: 'shohoku', mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: {
            users: true,
            plans: true,
            payments: true,
            matches: true,
            trainings: true
          }
        }
      }
    })

    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'jisantander@resit.cl' },
          { email: { contains: 'jisantander', mode: 'insensitive' } },
          { email: { contains: 'resit', mode: 'insensitive' } }
        ]
      }
    })

    return NextResponse.json({
      willDelete: {
        academy: academy ? {
          id: academy.id,
          name: academy.name,
          slug: academy.slug,
          type: academy.type,
          relatedData: academy._count
        } : null,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        } : null
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
