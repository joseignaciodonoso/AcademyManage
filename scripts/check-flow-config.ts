import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkFlowConfig() {
  console.log("🔍 Verificando configuración de Flow en la base de datos...\n")

  const academies = await prisma.academy.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      flowEnabled: true,
      flowApiKey: true,
      flowSecretKey: true,
    },
  })

  if (academies.length === 0) {
    console.log("❌ No se encontraron academias en la base de datos")
    return
  }

  for (const academy of academies) {
    console.log(`\n📋 Academia: ${academy.name} (${academy.slug})`)
    console.log(`   ID: ${academy.id}`)
    console.log(`   Flow Enabled: ${academy.flowEnabled ? "✅ SÍ" : "❌ NO"}`)
    console.log(`   Flow API Key: ${academy.flowApiKey ? `✅ Configurado (${academy.flowApiKey.substring(0, 10)}...)` : "❌ No configurado"}`)
    console.log(`   Flow Secret Key: ${academy.flowSecretKey ? `✅ Configurado (${academy.flowSecretKey.substring(0, 10)}...)` : "❌ No configurado"}`)
    
    if (academy.flowEnabled && (!academy.flowApiKey || !academy.flowSecretKey)) {
      console.log(`   ⚠️  PROBLEMA: Flow está habilitado pero faltan credenciales`)
    }
  }

  console.log("\n\n🔧 Variables de entorno:")
  console.log(`   FLOW_API_KEY: ${process.env.FLOW_API_KEY ? `✅ ${process.env.FLOW_API_KEY.substring(0, 10)}...` : "❌ No configurado"}`)
  console.log(`   FLOW_SECRET_KEY: ${process.env.FLOW_SECRET_KEY ? `✅ ${process.env.FLOW_SECRET_KEY.substring(0, 10)}...` : "❌ No configurado"}`)
  console.log(`   FLOW_ENVIRONMENT: ${process.env.FLOW_ENVIRONMENT || "sandbox (default)"}`)
}

checkFlowConfig()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
