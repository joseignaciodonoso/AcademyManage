/**
 * Script para sincronizar datos de base local a Neon
 * Maneja conflictos de forma más robusta
 * 
 * Uso: npx tsx scripts/sync-local-to-neon.ts
 */

import * as dotenv from "dotenv"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

// Cargar .env para conexión a Neon (producción)
dotenv.config()

const neonPrisma = new PrismaClient()

// Conexión a base local
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://webapp_user:webapp_pass@localhost:5432/webapp_academy?schema=public"
    }
  }
})

async function syncData() {
  console.log("📦 Sincronizando datos de base local a Neon...\n")
  
  let totalSynced = 0
  let skipped = 0
  
  try {
    // Test local connection
    await localPrisma.$connect()
    console.log("✅ Conectado a base de datos local\n")
  } catch (error) {
    console.log("❌ No se pudo conectar a la base de datos local")
    console.log("   Asegúrate de que PostgreSQL esté corriendo en localhost:5432\n")
    return
  }
  
  try {
    // 1. Sincronizar Academias
    console.log("📋 Sincronizando academias...")
    const localAcademies = await localPrisma.academy.findMany()
    for (const academy of localAcademies) {
      const existing = await neonPrisma.academy.findUnique({ where: { id: academy.id } })
      if (!existing) {
        // Check by slug to avoid conflicts
        const existingBySlug = await neonPrisma.academy.findUnique({ where: { slug: academy.slug } })
        if (!existingBySlug) {
          await neonPrisma.academy.create({ data: academy })
          totalSynced++
          console.log(`   ✅ Creada: ${academy.name}`)
        } else {
          skipped++
          console.log(`   ⏭️ Ya existe (por slug): ${academy.name}`)
        }
      } else {
        skipped++
      }
    }
    console.log(`   Total: ${localAcademies.length} (${totalSynced} nuevas, ${skipped} existentes)\n`)
    
    // 2. Sincronizar Usuarios
    console.log("📋 Sincronizando usuarios...")
    const localUsers = await localPrisma.user.findMany()
    let usersSynced = 0
    let usersSkipped = 0
    for (const user of localUsers) {
      const existing = await neonPrisma.user.findUnique({ where: { id: user.id } })
      if (!existing) {
        // Check by email to avoid conflicts
        const existingByEmail = await neonPrisma.user.findUnique({ where: { email: user.email } })
        if (!existingByEmail) {
          await neonPrisma.user.create({ data: user })
          usersSynced++
          console.log(`   ✅ Creado: ${user.email}`)
        } else {
          usersSkipped++
        }
      } else {
        usersSkipped++
      }
    }
    totalSynced += usersSynced
    skipped += usersSkipped
    console.log(`   Total: ${localUsers.length} (${usersSynced} nuevos, ${usersSkipped} existentes)\n`)
    
    // 3. Sincronizar Planes
    console.log("📋 Sincronizando planes...")
    const localPlans = await localPrisma.plan.findMany()
    let plansSynced = 0
    let plansSkipped = 0
    for (const plan of localPlans) {
      const existing = await neonPrisma.plan.findUnique({ where: { id: plan.id } })
      if (!existing) {
        try {
          await neonPrisma.plan.create({ data: plan })
          plansSynced++
          console.log(`   ✅ Creado: ${plan.name}`)
        } catch (e: any) {
          if (e.code === 'P2002') {
            plansSkipped++
          } else {
            throw e
          }
        }
      } else {
        plansSkipped++
      }
    }
    totalSynced += plansSynced
    skipped += plansSkipped
    console.log(`   Total: ${localPlans.length} (${plansSynced} nuevos, ${plansSkipped} existentes)\n`)
    
    // 4. Sincronizar Membresías
    console.log("📋 Sincronizando membresías...")
    const localMemberships = await localPrisma.membership.findMany()
    let membershipsSynced = 0
    for (const membership of localMemberships) {
      const existing = await neonPrisma.membership.findUnique({ where: { id: membership.id } })
      if (!existing) {
        try {
          await neonPrisma.membership.create({ data: membership })
          membershipsSynced++
        } catch (e: any) {
          if (e.code !== 'P2002') throw e
        }
      }
    }
    totalSynced += membershipsSynced
    console.log(`   Total: ${localMemberships.length} (${membershipsSynced} nuevas)\n`)
    
    // 5. Sincronizar Pagos
    console.log("📋 Sincronizando pagos...")
    const localPayments = await localPrisma.payment.findMany()
    let paymentsSynced = 0
    for (const payment of localPayments) {
      const existing = await neonPrisma.payment.findUnique({ where: { id: payment.id } })
      if (!existing) {
        try {
          await neonPrisma.payment.create({ data: payment })
          paymentsSynced++
        } catch (e: any) {
          if (e.code !== 'P2002') throw e
        }
      }
    }
    totalSynced += paymentsSynced
    console.log(`   Total: ${localPayments.length} (${paymentsSynced} nuevos)\n`)
    
  } catch (error: any) {
    console.error("❌ Error durante sincronización:", error.message)
  }
  
  console.log("=" .repeat(50))
  console.log(`📊 Sincronización completada`)
  console.log(`   - Registros sincronizados: ${totalSynced}`)
  console.log(`   - Registros omitidos (ya existían): ${skipped}`)
  console.log("=" .repeat(50))
}

async function main() {
  console.log("=" .repeat(50))
  console.log("🔄 Sincronización Local → Neon")
  console.log("=" .repeat(50) + "\n")
  
  await syncData()
}

main()
  .catch((error) => {
    console.error("❌ Error:", error.message)
    process.exit(1)
  })
  .finally(async () => {
    await neonPrisma.$disconnect()
    await localPrisma.$disconnect()
  })
