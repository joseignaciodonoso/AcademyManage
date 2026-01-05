import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function enableFlowForAllAcademies() {
  console.log("🔧 Habilitando Flow para todas las academias...\n")

  const flowApiKey = process.env.FLOW_API_KEY
  const flowSecretKey = process.env.FLOW_SECRET_KEY

  if (!flowApiKey || !flowSecretKey) {
    console.error("❌ Error: FLOW_API_KEY y FLOW_SECRET_KEY deben estar en .env")
    process.exit(1)
  }

  const academies = await prisma.academy.findMany({
    select: { id: true, name: true, slug: true, flowEnabled: true },
  })

  console.log(`📊 Total de academias encontradas: ${academies.length}\n`)

  for (const academy of academies) {
    console.log(`🔄 Actualizando: ${academy.name} (${academy.slug})`)
    
    await prisma.academy.update({
      where: { id: academy.id },
      data: {
        flowEnabled: true,
        flowApiKey,
        flowSecretKey,
      },
    })

    console.log(`   ✅ Flow habilitado y credenciales configuradas\n`)
  }

  console.log(`\n✅ ${academies.length} academias actualizadas con Flow habilitado`)
  console.log(`\n🔑 Credenciales configuradas:`)
  console.log(`   API Key: ${flowApiKey.substring(0, 10)}...`)
  console.log(`   Secret Key: ${flowSecretKey.substring(0, 10)}...`)
}

enableFlowForAllAcademies()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
