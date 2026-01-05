/**
 * Script para:
 * 1. Crear usuario administrador jidonoso@rest.cl
 * 2. Migrar datos de base local a Neon
 * 
 * Uso: npx tsx scripts/create-admin-and-migrate.ts
 */

import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

// Cargar .env para conexión a Neon (producción)
dotenv.config()

const neonPrisma = new PrismaClient()

// Conexión a base local
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://webapp_user:webapp_pass@localhost:5432/webapp_academy?schema=public"
    }
  }
})

async function createAdminUser() {
  console.log("\n👤 Creando usuario administrador...\n")
  
  const email = "jidonoso@rest.cl"
  const password = "ctaptc1pn"
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Buscar la academia Global Jiu Jitsu
  const academy = await neonPrisma.academy.findFirst({
    where: { 
      OR: [
        { slug: "global-jiu-jitsu" },
        { name: { contains: "Global", mode: "insensitive" } }
      ]
    }
  })
  
  if (!academy) {
    console.log("   ⚠️ Academia Global JJ no encontrada, se creará usuario sin academia asociada")
  } else {
    console.log(`   📍 Academia encontrada: ${academy.name} (${academy.slug})`)
  }
  
  // Verificar si el usuario ya existe
  const existingUser = await neonPrisma.user.findUnique({
    where: { email }
  })
  
  if (existingUser) {
    console.log(`   ⚠️ Usuario ${email} ya existe, actualizando...`)
    await neonPrisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: "ACADEMY_ADMIN",
        academyId: academy?.id,
        name: "José Ignacio Donoso"
      }
    })
    console.log(`   ✅ Usuario actualizado`)
  } else {
    await neonPrisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "José Ignacio Donoso",
        role: "ACADEMY_ADMIN",
        academyId: academy?.id
      }
    })
    console.log(`   ✅ Usuario creado: ${email}`)
  }
  
  console.log(`   📧 Email: ${email}`)
  console.log(`   🔑 Contraseña: ${password}`)
  console.log(`   👔 Rol: ACADEMY_ADMIN`)
  if (academy) {
    console.log(`   🏫 Academia: ${academy.name}`)
  }
}

async function migrateData() {
  console.log("\n📦 Migrando datos de base local a Neon...\n")
  
  let totalMigrated = 0
  
  try {
    // 1. Migrar Academias
    console.log("📋 Migrando academias...")
    const academies = await localPrisma.academy.findMany()
    for (const academy of academies) {
      await neonPrisma.academy.upsert({
        where: { id: academy.id },
        update: academy,
        create: academy,
      })
    }
    console.log(`   ✅ ${academies.length} academias migradas`)
    totalMigrated += academies.length
    
    // 2. Migrar Usuarios
    console.log("📋 Migrando usuarios...")
    const users = await localPrisma.user.findMany()
    for (const user of users) {
      await neonPrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      })
    }
    console.log(`   ✅ ${users.length} usuarios migrados`)
    totalMigrated += users.length
    
    // 3. Migrar Planes
    console.log("📋 Migrando planes...")
    const plans = await localPrisma.plan.findMany()
    for (const plan of plans) {
      await neonPrisma.plan.upsert({
        where: { id: plan.id },
        update: plan,
        create: plan,
      })
    }
    console.log(`   ✅ ${plans.length} planes migrados`)
    totalMigrated += plans.length
    
    // 4. Migrar Membresías
    console.log("📋 Migrando membresías...")
    const memberships = await localPrisma.membership.findMany()
    for (const membership of memberships) {
      await neonPrisma.membership.upsert({
        where: { id: membership.id },
        update: membership,
        create: membership,
      })
    }
    console.log(`   ✅ ${memberships.length} membresías migradas`)
    totalMigrated += memberships.length
    
    // 5. Migrar Pagos
    console.log("📋 Migrando pagos...")
    const payments = await localPrisma.payment.findMany()
    for (const payment of payments) {
      await neonPrisma.payment.upsert({
        where: { id: payment.id },
        update: payment,
        create: payment,
      })
    }
    console.log(`   ✅ ${payments.length} pagos migrados`)
    totalMigrated += payments.length
    
    // 6. Migrar Organizations (si existe)
    try {
      console.log("📋 Migrando organizaciones...")
      const orgs = await localPrisma.organization.findMany()
      for (const org of orgs) {
        await neonPrisma.organization.upsert({
          where: { id: org.id },
          update: org,
          create: org,
        })
      }
      console.log(`   ✅ ${orgs.length} organizaciones migradas`)
      totalMigrated += orgs.length
    } catch (e) {
      console.log("   ⚠️ Tabla organizations no existe, saltando...")
    }
    
    // 7. Migrar Events (si existe)
    try {
      console.log("📋 Migrando eventos...")
      const events = await localPrisma.event.findMany()
      for (const event of events) {
        await neonPrisma.event.upsert({
          where: { id: event.id },
          update: event,
          create: event,
        })
      }
      console.log(`   ✅ ${events.length} eventos migrados`)
      totalMigrated += events.length
    } catch (e) {
      console.log("   ⚠️ Tabla events no existe, saltando...")
    }
    
  } catch (error: any) {
    if (error.message?.includes("connect")) {
      console.log("   ⚠️ No se pudo conectar a la base de datos local")
      console.log("   ℹ️ Continuando solo con la creación del usuario admin...")
      return
    }
    throw error
  }
  
  console.log(`\n📊 Total de registros migrados: ${totalMigrated}`)
}

async function main() {
  console.log("=" .repeat(50))
  console.log("🚀 Script de configuración para producción")
  console.log("=" .repeat(50))
  
  // 1. Crear usuario administrador
  await createAdminUser()
  
  // 2. Migrar datos
  await migrateData()
  
  console.log("\n" + "=" .repeat(50))
  console.log("✅ Configuración completada")
  console.log("=" .repeat(50))
  console.log("\n📝 Puedes iniciar sesión en producción con:")
  console.log("   Email: jidonoso@rest.cl")
  console.log("   Contraseña: ctaptc1pn\n")
}

main()
  .catch((error) => {
    console.error("❌ Error:", error.message)
    process.exit(1)
  })
  .finally(async () => {
    await neonPrisma.$disconnect()
    await localPrisma.$disconnect()
  })
