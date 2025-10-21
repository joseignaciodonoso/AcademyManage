import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking database users...\n')
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      academyId: true,
      orgId: true,
    },
    take: 10
  })

  if (users.length === 0) {
    console.log('❌ No users found in database!')
    console.log('💡 Run: npm run db:seed')
  } else {
    console.log(`✅ Found ${users.length} users:\n`)
    users.forEach(user => {
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name}`)
      console.log(`Role: ${user.role}`)
      console.log(`Academy ID: ${user.academyId || 'N/A'}`)
      console.log(`Org ID: ${user.orgId || 'N/A'}`)
      console.log('---')
    })
  }

  // Check academies
  const academies = await prisma.academy.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      sport: true,
    }
  })

  console.log(`\n📚 Found ${academies.length} academies/organizations:\n`)
  academies.forEach(academy => {
    console.log(`Name: ${academy.name}`)
    console.log(`Slug: ${academy.slug}`)
    console.log(`Type: ${academy.type || 'N/A'}`)
    console.log(`Sport: ${academy.sport || 'N/A'}`)
    console.log('---')
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
