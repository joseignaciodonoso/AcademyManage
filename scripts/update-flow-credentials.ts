/**
 * Script para actualizar credenciales de Flow en la academia
 * Uso: npx tsx scripts/update-flow-credentials.ts
 */

import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔧 Actualizando credenciales de Flow en Neon...\n")

  const flowApiKey = process.env.FLOW_API_KEY
  const flowSecretKey = process.env.FLOW_SECRET_KEY

  if (!flowApiKey || !flowSecretKey) {
    throw new Error("FLOW_API_KEY y FLOW_SECRET_KEY deben estar en .env")
  }

  // Update Global Jiu Jitsu academy
  const academy = await prisma.academy.findFirst({
    where: { slug: "global-jiu-jitsu" },
  })

  if (!academy) {
    throw new Error("Academia 'global-jiu-jitsu' no encontrada")
  }

  await prisma.academy.update({
    where: { id: academy.id },
    data: {
      flowEnabled: true,
      flowApiKey: flowApiKey,
      flowSecretKey: flowSecretKey,
    },
  })

  console.log(`✅ Credenciales de Flow actualizadas para: ${academy.name}`)
  console.log(`   - Flow habilitado: ✅`)
  console.log(`   - API Key: ${flowApiKey.substring(0, 10)}...`)
  console.log(`   - Secret Key: ${flowSecretKey.substring(0, 10)}...\n`)

  console.log("🌐 La academia está lista para procesar pagos con Flow en producción")
}

main()
  .catch((error) => {
    console.error("❌ Error:", error.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
