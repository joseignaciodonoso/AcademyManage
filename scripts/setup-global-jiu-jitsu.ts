import { PrismaClient, PlanType, MembershipStatus, UserRole, OrganizationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const slug = 'global-jiu-jitsu'
  const academyName = 'Global Jiu Jitsu'
  const adminEmail = 'jidonoso@resit.cl'
  const adminPasswordPlain = 'ctaptc1pn'

  console.log('🏁 Setting up Global Jiu Jitsu...')

  // 1) Create or reuse Organization
  const organization = await prisma.organization.upsert({
    where: { slug },
    update: {},
    create: {
      name: academyName,
      slug,
      type: OrganizationType.ACADEMY,
      settings: {
        create: { currency: 'CLP', timezone: 'America/Santiago', taxRate: 0.19, themeMode: 'system' },
      },
    },
  })

  // 2) Create or reuse Academy
  const academy = await prisma.academy.upsert({
    where: { slug },
    update: {},
    create: {
      name: academyName,
      slug,
      type: OrganizationType.ACADEMY,
      discipline: 'Jiu-Jitsu',
      currency: 'CLP',
      timezone: 'America/Santiago',
      onboardingCompleted: true,
    },
  })

  // 3) Create monthly plan CLP 50,000
  const plan = await prisma.plan.upsert({
    where: { academyId_slug: { academyId: academy.id, slug: 'plan-mensual' } },
    update: {},
    create: {
      academyId: academy.id,
      name: 'Plan Mensual',
      slug: 'plan-mensual',
      type: PlanType.MONTHLY,
      price: 50000,
      currency: 'CLP',
      classesPerMonth: 999, // unlimited
      unlimitedClasses: true,
      accessToContent: true,
    },
  })

  // 4) Create admin user
  const passwordHash = await bcrypt.hash(adminPasswordPlain, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.ACADEMY_ADMIN,
      academyId: academy.id,
    },
    create: {
      email: adminEmail,
      name: 'Admin Global JJ',
      role: UserRole.ACADEMY_ADMIN,
      password: passwordHash,
      academyId: academy.id,
      orgId: organization.id,
    },
  })

  // 5) Ensure membership mapping between user and organization (RBAC)
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: adminUser.id } },
    update: { role: UserRole.ACADEMY_ADMIN },
    create: { organizationId: organization.id, userId: adminUser.id, role: UserRole.ACADEMY_ADMIN },
  })

  console.log('\n✅ Setup complete:')
  console.log('Organization:', { id: organization.id, slug: organization.slug })
  console.log('Academy:', { id: academy.id, slug: academy.slug })
  console.log('Plan:', { id: plan.id, name: plan.name })
  console.log('Admin User:', { id: adminUser.id, email: adminUser.email })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
