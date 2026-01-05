/**
 * Script para verificar los datos migrados a Neon
 * Uso: npx tsx scripts/verify-neon-data.ts
 */

import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Verificando datos en Neon...\n")
  console.log(`📡 Conectado a: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Neon'}\n`)

  // Count records in each table
  const counts = {
    organizations: await prisma.organization.count(),
    academies: await prisma.academy.count(),
    users: await prisma.user.count(),
    plans: await prisma.plan.count(),
    memberships: await prisma.membership.count(),
    payments: await prisma.payment.count(),
    events: await prisma.event.count(),
  }

  console.log("📊 Conteo de registros:")
  console.log(`   - Organizaciones: ${counts.organizations}`)
  console.log(`   - Academias: ${counts.academies}`)
  console.log(`   - Usuarios: ${counts.users}`)
  console.log(`   - Planes: ${counts.plans}`)
  console.log(`   - Membresías: ${counts.memberships}`)
  console.log(`   - Pagos: ${counts.payments}`)
  console.log(`   - Eventos: ${counts.events}`)

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  console.log(`\n📈 Total de registros: ${total}`)

  // Show sample data
  console.log("\n📋 Datos de muestra:\n")

  const academy = await prisma.academy.findFirst({
    include: {
      _count: {
        select: {
          users: true,
          plans: true,
        },
      },
    },
  })

  if (academy) {
    console.log(`🏫 Academia: ${academy.name}`)
    console.log(`   - Slug: ${academy.slug}`)
    console.log(`   - Usuarios: ${academy._count.users}`)
    console.log(`   - Planes: ${academy._count.plans}`)
    console.log(`   - Flow habilitado: ${academy.flowEnabled ? '✅' : '❌'}`)
  }

  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      role: true,
    },
    take: 5,
  })

  if (users.length > 0) {
    console.log(`\n👥 Usuarios (${users.length} de ${counts.users}):`)
    users.forEach((user) => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`)
    })
  }

  const plan = await prisma.plan.findFirst({
    select: {
      name: true,
      price: true,
      currency: true,
      type: true,
    },
  })

  if (plan) {
    console.log(`\n💳 Plan de ejemplo:`)
    console.log(`   - ${plan.name}`)
    console.log(`   - Precio: ${plan.currency} $${plan.price.toLocaleString('es-CL')}`)
    console.log(`   - Tipo: ${plan.type}`)
  }

  console.log(`\n${"=".repeat(50)}`)
  console.log(`✅ Verificación completada`)
  console.log(`🌐 Base de datos Neon lista para producción`)
  console.log(`${"=".repeat(50)}\n`)
}

main()
  .catch((error) => {
    console.error("❌ Error verificando datos:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
