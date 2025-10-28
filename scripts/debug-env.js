#!/usr/bin/env node

// Script para debuggear variables de entorno en Netlify
console.log('🔍 Debugging environment variables...')
console.log('')

// Verificar DATABASE_URL
const dbUrl = process.env.DATABASE_URL
console.log('DATABASE_URL exists:', !!dbUrl)
console.log('DATABASE_URL length:', dbUrl ? dbUrl.length : 0)
console.log('DATABASE_URL starts with postgresql://', dbUrl ? dbUrl.startsWith('postgresql://') : false)
console.log('DATABASE_URL starts with postgres://', dbUrl ? dbUrl.startsWith('postgres://') : false)

if (dbUrl) {
  // Mostrar solo los primeros y últimos caracteres por seguridad
  const masked = dbUrl.substring(0, 20) + '...' + dbUrl.substring(dbUrl.length - 20)
  console.log('DATABASE_URL (masked):', masked)
} else {
  console.log('❌ DATABASE_URL is not set!')
}

console.log('')
console.log('Other important env vars:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('NETLIFY:', process.env.NETLIFY)
console.log('NETLIFY_DEV:', process.env.NETLIFY_DEV)

// Verificar si podemos cargar Prisma
try {
  console.log('')
  console.log('🔧 Testing Prisma schema validation...')
  const { execSync } = require('child_process')
  execSync('npx prisma validate', { stdio: 'inherit' })
  console.log('✅ Prisma schema is valid!')
} catch (error) {
  console.log('❌ Prisma schema validation failed:', error.message)
}
