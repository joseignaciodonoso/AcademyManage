import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function fixUnpaidMemberships() {
  console.log("🔍 Buscando membresías ACTIVE sin pago confirmado...")

  // Find all ACTIVE memberships
  const activeMemberships = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      payments: {
        where: { status: "PAID" },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
      plan: {
        select: { id: true, name: true },
      },
    },
  })

  console.log(`📊 Total membresías ACTIVE encontradas: ${activeMemberships.length}`)

  // Filter memberships without confirmed payments
  const unpaidMemberships = activeMemberships.filter(
    (m) => m.payments.length === 0
  )

  console.log(`⚠️  Membresías sin pago confirmado: ${unpaidMemberships.length}`)

  if (unpaidMemberships.length === 0) {
    console.log("✅ No hay membresías que corregir")
    return
  }

  console.log("\n📋 Membresías a corregir:")
  for (const m of unpaidMemberships) {
    console.log(`   - ${m.user.email} (${m.user.name}) - Plan: ${m.plan.name}`)
  }

  console.log("\n🔧 Actualizando membresías a PENDING_PAYMENT...")

  // Update them to PENDING_PAYMENT
  for (const membership of unpaidMemberships) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { status: "PENDING_PAYMENT" },
    })
    console.log(`   ✓ Actualizado: ${membership.user.email}`)
  }

  console.log(`\n✅ ${unpaidMemberships.length} membresías corregidas a PENDING_PAYMENT`)
}

fixUnpaidMemberships()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
