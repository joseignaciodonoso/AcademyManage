import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'jose@gmail.com'
  const plain = 'admin123'

  const hash = await bcrypt.hash(plain, 12)

  const user = await prisma.user.update({
    where: { email },
    data: { password: hash },
    select: { id: true, email: true }
  })

  await prisma.session.deleteMany({ where: { userId: user.id } })

  console.log(`Password updated for ${user.email}. All sessions invalidated.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
