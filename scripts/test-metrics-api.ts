import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMetrics() {
  try {
    // Get Shohoku academy
    const academy = await prisma.academy.findFirst({
      where: { name: 'Shohoku' }
    })
    
    if (!academy) {
      console.log('Academy not found')
      return
    }
    
    console.log('Academy:', academy.name, academy.id)
    console.log('Sport:', academy.sport)
    
    // Calculate date range (30 days)
    const now = new Date()
    const fromDate = new Date()
    fromDate.setDate(now.getDate() - 30)
    
    console.log('\nDate range:')
    console.log('From:', fromDate.toISOString())
    console.log('To:', now.toISOString())
    
    // Get matches
    const matches = await prisma.match.findMany({
      where: {
        academyId: academy.id,
        sport: academy.sport || undefined,
        date: {
          gte: fromDate,
          lte: now,
        },
        status: {
          in: ["FINISHED", "COMPLETED"]
        },
      },
      include: {
        stats: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })
    
    console.log(`\nFound ${matches.length} matches`)
    
    if (matches.length > 0) {
      const match = matches[0]
      console.log('\nFirst match:')
      console.log('  Opponent:', match.opponent)
      console.log('  Date:', match.date)
      console.log('  Status:', match.status)
      console.log('  Result:', match.result)
      console.log('  Score:', match.pointsFor, '-', match.pointsAgainst)
      console.log('  Stats:', match.stats.length)
      
      // Calculate metrics
      const wins = matches.filter(m => m.result === "WIN").length
      const losses = matches.filter(m => m.result === "LOSS").length
      const winRate = (wins / matches.length) * 100
      
      console.log('\nMetrics:')
      console.log('  Matches:', matches.length)
      console.log('  Wins:', wins)
      console.log('  Losses:', losses)
      console.log('  Win Rate:', winRate.toFixed(1) + '%')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMetrics()
