import * as dotenv from "dotenv"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

dotenv.config()

const neonPrisma = new PrismaClient()
const localPrisma = new PrismaClient({
  datasources: {
    db: { url: "postgresql://webapp_user:webapp_pass@localhost:5432/webapp_academy?schema=public" }
  }
})

async function restoreFromNeon() {
  console.log("🔄 Restaurando datos desde Neon a local...")
  
  try {
    await neonPrisma.$connect()
    await localPrisma.$connect()
    console.log("✅ Conexiones establecidas")
    
    // 1. Get Global Jiu Jitsu academy from Neon
    const academy = await neonPrisma.academy.findUnique({
      where: { slug: "global-jiu-jitsu" },
      include: {
        users: true,
        plans: true,
        memberships: {
          include: { plan: true, payments: true }
        },
        payments: true
      }
    })
    
    if (!academy) {
      console.log("❌ Academia global-jiu-jitsu no encontrada en Neon")
      return
    }
    
    console.log(`✅ Academia encontrada: ${academy.name}`)
    console.log(`   - Usuarios: ${academy.users.length}`)
    console.log(`   - Planes: ${academy.plans.length}`)
    console.log(`   - Membresías: ${academy.memberships.length}`)
    console.log(`   - Pagos: ${academy.payments.length}`)
    
    // 2. Create academy in local (or update)
    const localAcademy = await localPrisma.academy.upsert({
      where: { slug: academy.slug },
      update: { ...academy, id: academy.id },
      create: { ...academy, id: academy.id }
    })
    console.log("✅ Academia sincronizada localmente")
    
    // 3. Sync users
    let usersSynced = 0
    for (const user of academy.users) {
      const userData = { ...user }
      delete userData.academy // Remove relation
      
      await localPrisma.user.upsert({
        where: { id: user.id },
        update: userData,
        create: userData
      })
      usersSynced++
    }
    console.log(`✅ Usuarios sincronizados: ${usersSynced}`)
    
    // 4. Sync plans
    let plansSynced = 0
    for (const plan of academy.plans) {
      const planData = { ...plan, academyId: localAcademy.id }
      delete planData.academy // Remove relation
      
      await localPrisma.plan.upsert({
        where: { id: plan.id },
        update: planData,
        create: planData
      })
      plansSynced++
    }
    console.log(`✅ Planes sincronizados: ${plansSynced}`)
    
    // 5. Sync memberships
    let membershipsSynced = 0
    for (const membership of academy.memberships) {
      const membershipData = {
        ...membership,
        academyId: localAcademy.id
      }
      delete membershipData.academy // Remove relation
      delete membershipData.plan // Remove relation
      delete membershipData.payments // Remove relation
      
      await localPrisma.membership.upsert({
        where: { id: membership.id },
        update: membershipData,
        create: membershipData
      })
      membershipsSynced++
    }
    console.log(`✅ Membresías sincronizadas: ${membershipsSynced}`)
    
    // 6. Sync payments
    let paymentsSynced = 0
    for (const payment of academy.payments) {
      const paymentData = {
        ...payment,
        academyId: localAcademy.id
      }
      delete paymentData.academy // Remove relation
      delete paymentData.membership // Remove relation
      
      await localPrisma.payment.upsert({
        where: { id: payment.id },
        update: paymentData,
        create: paymentData
      })
      paymentsSynced++
    }
    console.log(`✅ Pagos sincronizados: ${paymentsSynced}`)
    
    // 7. Sync membership payments separately
    for (const membership of academy.memberships) {
      for (const payment of membership.payments || []) {
        const paymentData = {
          ...payment,
          academyId: localAcademy.id,
          membershipId: membership.id
        }
        delete paymentData.membership // Remove relation
        
        await localPrisma.payment.upsert({
          where: { id: payment.id },
          update: paymentData,
          create: paymentData
        })
        paymentsSynced++
      }
    }
    
    console.log("\n🎉 Restauración completada!")
    console.log(`   - Usuarios: ${usersSynced}`)
    console.log(`   - Planes: ${plansSynced}`)
    console.log(`   - Membresías: ${membershipsSynced}`)
    console.log(`   - Pagos: ${paymentsSynced}`)
    
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await neonPrisma.$disconnect()
    await localPrisma.$disconnect()
  }
}

restoreFromNeon()
