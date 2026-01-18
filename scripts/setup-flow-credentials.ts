import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupFlowCredentials() {
  try {
    const apiKey = process.env.FLOW_API_KEY
    const secretKey = process.env.FLOW_SECRET_KEY
    
    if (!apiKey || !secretKey) {
      console.error('❌ FLOW_API_KEY and FLOW_SECRET_KEY must be set in environment variables')
      process.exit(1)
    }

    console.log('🔑 Flow credentials from environment:')
    console.log('API Key:', apiKey.substring(0, 10) + '...')
    console.log('Secret Key:', secretKey.substring(0, 10) + '...')
    console.log('Environment:', process.env.FLOW_ENVIRONMENT || 'sandbox')

    // Update all academies to enable Flow and set credentials
    const academies = await prisma.academy.findMany({
      select: { id: true, name: true, slug: true }
    })

    console.log(`\n📚 Found ${academies.length} academies`)

    for (const academy of academies) {
      const updated = await prisma.academy.update({
        where: { id: academy.id },
        data: {
          flowEnabled: true,
          flowApiKey: apiKey,
          flowSecretKey: secretKey,
        }
      })

      console.log(`✅ Updated ${academy.name} (${academy.slug})`)
      console.log(`   - Flow enabled: ${updated.flowEnabled}`)
      console.log(`   - Has API key: ${!!updated.flowApiKey}`)
      console.log(`   - Has secret key: ${!!updated.flowSecretKey}`)
    }

    console.log('\n✨ All academies updated with Flow credentials')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupFlowCredentials()
