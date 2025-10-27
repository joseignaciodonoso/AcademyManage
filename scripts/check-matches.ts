import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMatches() {
  try {
    console.log('=== Checking Matches ===\n')
    
    const matches = await prisma.match.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        academy: {
          select: {
            id: true,
            name: true,
            type: true,
            sport: true,
          }
        },
        stats: true,
      }
    })
    
    console.log(`Total matches found: ${matches.length}\n`)
    
    matches.forEach((match, index) => {
      console.log(`Match ${index + 1}:`)
      console.log(`  ID: ${match.id}`)
      console.log(`  Academy: ${match.academy?.name} (${match.academy?.type})`)
      console.log(`  Academy Sport: ${match.academy?.sport}`)
      console.log(`  Match Sport: ${match.sport}`)
      console.log(`  Opponent: ${match.opponent}`)
      console.log(`  Date: ${match.date}`)
      console.log(`  Status: ${match.status}`)
      console.log(`  Result: ${match.result}`)
      console.log(`  Score: ${match.goalsFor || match.pointsFor || 0} - ${match.goalsAgainst || match.pointsAgainst || 0}`)
      console.log(`  Stats count: ${match.stats.length}`)
      console.log('')
    })
    
    // Check academies
    console.log('\n=== Checking Academies ===\n')
    const academies = await prisma.academy.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        sport: true,
        _count: {
          select: {
            matches: true,
          }
        }
      }
    })
    
    academies.forEach(academy => {
      console.log(`Academy: ${academy.name}`)
      console.log(`  Type: ${academy.type}`)
      console.log(`  Sport: ${academy.sport}`)
      console.log(`  Matches: ${academy._count.matches}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMatches()
