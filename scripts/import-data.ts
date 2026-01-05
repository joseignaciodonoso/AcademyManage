/**
 * Script para importar datos desde JSON a la base de datos Neon
 * Uso: npx tsx scripts/import-data.ts
 */

import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"

// Load Neon database env (current .env already points to Neon)
dotenv.config()

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("📥 Importando datos a la base de datos Neon...\n")

  // Read exported data
  const exportPath = path.join(process.cwd(), "data-export.json")
  if (!fs.existsSync(exportPath)) {
    throw new Error(`Archivo de exportación no encontrado: ${exportPath}`)
  }

  const exportData = JSON.parse(fs.readFileSync(exportPath, "utf-8"))

  let totalImported = 0

  // Import in order (respecting foreign keys)
  
  // 1. Organizations first (no dependencies)
  if (exportData.organizations?.length > 0) {
    console.log(`📋 Importando ${exportData.organizations.length} organizaciones...`)
    for (const org of exportData.organizations) {
      await prisma.organization.upsert({
        where: { id: org.id },
        update: org,
        create: org,
      })
    }
    totalImported += exportData.organizations.length
    console.log(`   ✅ ${exportData.organizations.length} organizaciones importadas`)
  }

  // 2. Academies
  if (exportData.academies?.length > 0) {
    console.log(`📋 Importando ${exportData.academies.length} academias...`)
    for (const academy of exportData.academies) {
      await prisma.academy.upsert({
        where: { id: academy.id },
        update: academy,
        create: academy,
      })
    }
    totalImported += exportData.academies.length
    console.log(`   ✅ ${exportData.academies.length} academias importadas`)
  }

  // 3. Users
  if (exportData.users?.length > 0) {
    console.log(`📋 Importando ${exportData.users.length} usuarios...`)
    for (const user of exportData.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      })
    }
    totalImported += exportData.users.length
    console.log(`   ✅ ${exportData.users.length} usuarios importados`)
  }

  // 4. Plans
  if (exportData.plans?.length > 0) {
    console.log(`📋 Importando ${exportData.plans.length} planes...`)
    for (const plan of exportData.plans) {
      await prisma.plan.upsert({
        where: { id: plan.id },
        update: plan,
        create: plan,
      })
    }
    totalImported += exportData.plans.length
    console.log(`   ✅ ${exportData.plans.length} planes importados`)
  }

  // 5. Memberships
  if (exportData.memberships?.length > 0) {
    console.log(`📋 Importando ${exportData.memberships.length} membresías...`)
    for (const membership of exportData.memberships) {
      await prisma.membership.upsert({
        where: { id: membership.id },
        update: membership,
        create: membership,
      })
    }
    totalImported += exportData.memberships.length
    console.log(`   ✅ ${exportData.memberships.length} membresías importadas`)
  }

  // 6. Payments
  if (exportData.payments?.length > 0) {
    console.log(`📋 Importando ${exportData.payments.length} pagos...`)
    for (const payment of exportData.payments) {
      await prisma.payment.upsert({
        where: { id: payment.id },
        update: payment,
        create: payment,
      })
    }
    totalImported += exportData.payments.length
    console.log(`   ✅ ${exportData.payments.length} pagos importados`)
  }

  // 7. Events
  if (exportData.events?.length > 0) {
    console.log(`📋 Importando ${exportData.events.length} eventos...`)
    for (const event of exportData.events) {
      await prisma.event.upsert({
        where: { id: event.id },
        update: event,
        create: event,
      })
    }
    totalImported += exportData.events.length
    console.log(`   ✅ ${exportData.events.length} eventos importados`)
  }

  console.log(`\n${"=".repeat(50)}`)
  console.log(`✅ Importación completada exitosamente`)
  console.log(`📊 Total de registros importados: ${totalImported}`)
  console.log(`${"=".repeat(50)}\n`)
}

main()
  .catch((error) => {
    console.error("❌ Error importando datos:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
