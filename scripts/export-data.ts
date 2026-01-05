/**
 * Script para exportar datos de la base de datos local a JSON
 * Uso: npx tsx scripts/export-data.ts
 */

import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"

// Load local database env
dotenv.config({ path: ".env.backup" })

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("📦 Exportando datos de la base de datos local...\n")

  const exportData: any = {}

  // Export all tables in order (respecting foreign keys)
  console.log("📋 Exportando academias...")
  exportData.academies = await prisma.academy.findMany()
  console.log(`   ✅ ${exportData.academies.length} academias exportadas`)

  console.log("📋 Exportando usuarios...")
  exportData.users = await prisma.user.findMany()
  console.log(`   ✅ ${exportData.users.length} usuarios exportados`)

  console.log("📋 Exportando planes...")
  exportData.plans = await prisma.plan.findMany()
  console.log(`   ✅ ${exportData.plans.length} planes exportados`)

  console.log("📋 Exportando membresías...")
  exportData.memberships = await prisma.membership.findMany()
  console.log(`   ✅ ${exportData.memberships.length} membresías exportadas`)

  console.log("📋 Exportando pagos...")
  exportData.payments = await prisma.payment.findMany()
  console.log(`   ✅ ${exportData.payments.length} pagos exportados`)

  // Export additional tables if they exist
  try {
    console.log("📋 Exportando organizaciones...")
    exportData.organizations = await prisma.organization.findMany()
    console.log(`   ✅ ${exportData.organizations.length} organizaciones exportadas`)
  } catch (e) {
    console.log(`   ⚠️ Tabla organizations no encontrada, saltando...`)
  }

  try {
    console.log("📋 Exportando eventos...")
    exportData.events = await prisma.event.findMany()
    console.log(`   ✅ ${exportData.events.length} eventos exportados`)
  } catch (e) {
    console.log(`   ⚠️ Tabla events no encontrada, saltando...`)
  }

  // Save to file
  const exportPath = path.join(process.cwd(), "data-export.json")
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2))

  console.log(`\n✅ Datos exportados exitosamente a: ${exportPath}`)
  console.log(`📊 Total de registros: ${Object.values(exportData).reduce((sum: number, arr: any) => sum + arr.length, 0)}`)
}

main()
  .catch((error) => {
    console.error("❌ Error exportando datos:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
