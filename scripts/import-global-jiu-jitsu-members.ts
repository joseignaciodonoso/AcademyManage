import { PrismaClient, MembershipStatus, PaymentStatus, PaymentType, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

function parseDMY(d: string) {
  // expects DD-MM-YYYY
  const [dd, mm, yyyy] = d.split('-').map(Number)
  return new Date(yyyy, (mm - 1), dd)
}

function slugifyName(name: string) {
  return name.trim().toLowerCase().normalize('NFD').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

async function main() {
  const academySlug = 'global-jiu-jitsu'
  const planSlug = 'plan-mensual'
  const monthlyAmount = 50000

  const academy = await prisma.academy.findUnique({ where: { slug: academySlug } })
  if (!academy) throw new Error(`Academy not found: ${academySlug}`)

  const plan = await prisma.plan.findUnique({ where: { academyId_slug: { academyId: academy.id, slug: planSlug } } })
  if (!plan) throw new Error(`Plan not found: ${planSlug}`)

  // Data transcribed from image (emails generic)
  const students: Array<{
    name: string
    status: 'ACTIVE' | 'PAST_DUE'
    nextBillingDate: string // DD-MM-YYYY
    registeredAt: string // DD-MM-YYYY
    note?: 'PAGA_ESTE_MES' | 'NINGUNA'
  }> = [
    { name: 'Arturo Gabarro', status: 'ACTIVE', nextBillingDate: '14-11-2025', registeredAt: '15-10-2025' },
    { name: 'Cristobal Bown', status: 'ACTIVE', nextBillingDate: '15-11-2025', registeredAt: '15-10-2025' },
    { name: 'Manuel Rozas', status: 'ACTIVE', nextBillingDate: '02-11-2025', registeredAt: '10-10-2025' },
    { name: 'Martín Erguayzarre', status: 'ACTIVE', nextBillingDate: '09-11-2025', registeredAt: '09-10-2025' },
    { name: 'Lalo Bown', status: 'ACTIVE', nextBillingDate: '07-11-2025', registeredAt: '09-10-2025' },
    { name: 'Hans', status: 'ACTIVE', nextBillingDate: '04-11-2025', registeredAt: '09-10-2025' },
    { name: 'Felipe Rozas', status: 'ACTIVE', nextBillingDate: '20-10-2025', registeredAt: '09-10-2025', note: 'PAGA_ESTE_MES' },
    { name: 'Rafael Gonzalez', status: 'ACTIVE', nextBillingDate: '20-10-2025', registeredAt: '09-10-2025', note: 'PAGA_ESTE_MES' },
    { name: 'Agustin', status: 'PAST_DUE', nextBillingDate: '14-10-2025', registeredAt: '09-10-2025', note: 'PAGA_ESTE_MES' },
    { name: 'Nicolás Conejero', status: 'ACTIVE', nextBillingDate: '09-11-2025', registeredAt: '09-10-2025' },
    { name: 'Claudio Gonzalez', status: 'PAST_DUE', nextBillingDate: '04-10-2025', registeredAt: '09-10-2025', note: 'PAGA_ESTE_MES' },
    { name: 'Cristian Niño', status: 'ACTIVE', nextBillingDate: '01-11-2025', registeredAt: '09-10-2025' },
    { name: 'Gerardo Leiva', status: 'ACTIVE', nextBillingDate: '01-11-2025', registeredAt: '09-10-2025' },
    { name: 'Jose Tomas Ovalle', status: 'ACTIVE', nextBillingDate: '09-11-2025', registeredAt: '09-10-2025' },
    { name: 'Tomas', status: 'ACTIVE', nextBillingDate: '09-11-2025', registeredAt: '09-10-2025' },
    { name: 'Max Bottiger', status: 'ACTIVE', nextBillingDate: '09-11-2025', registeredAt: '09-10-2025' },
    { name: 'Sofia Villar', status: 'ACTIVE', nextBillingDate: '03-11-2025', registeredAt: '09-10-2025' },
    { name: 'Isamar', status: 'ACTIVE', nextBillingDate: '09-11-2025', registeredAt: '09-10-2025' },
    { name: 'Ramiro Jarufe', status: 'ACTIVE', nextBillingDate: '09-11-2025', registeredAt: '09-10-2025' },
  ]

  for (const s of students) {
    const email = `${slugifyName(s.name)}+globaljj@example.local`

    // Create or find user
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: s.name, academyId: academy.id, role: UserRole.STUDENT },
      create: {
        email,
        name: s.name,
        role: UserRole.STUDENT,
        academyId: academy.id,
      },
    })

    // Create or update membership matched by (userId, academyId)
    const existingMembership = await prisma.membership.findFirst({
      where: { userId: user.id, academyId: academy.id },
    })

    const membership = existingMembership
      ? await prisma.membership.update({
          where: { id: existingMembership.id },
          data: {
            planId: plan.id,
            status: s.status as MembershipStatus,
            startDate: parseDMY(s.registeredAt),
            nextBillingDate: parseDMY(s.nextBillingDate),
          },
        })
      : await prisma.membership.create({
          data: {
            academyId: academy.id,
            userId: user.id,
            planId: plan.id,
            status: s.status as MembershipStatus,
            startDate: parseDMY(s.registeredAt),
            nextBillingDate: parseDMY(s.nextBillingDate),
          },
        })

    // Create payment only for explicit "Paga este mes" entries (ignore past-due auto creation)
    const needsPendingPayment = s.note === 'PAGA_ESTE_MES'
    if (needsPendingPayment) {
      // one pending payment for current cycle
      await prisma.payment.create({
        data: {
          academyId: academy.id,
          membershipId: membership.id,
          amount: monthlyAmount,
          currency: 'CLP',
          status: PaymentStatus.PENDING,
          type: PaymentType.SUBSCRIPTION,
          userId: user.id,
        },
      })
    }

    console.log(`Imported: ${s.name} (${email})`) // email is generic
  }

  console.log('\n✅ Import finished.')
}

main().catch(async (e) => {
  console.error('❌ Error:', e)
  await prisma.$disconnect()
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
