import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT SET'
  
  // Mask sensitive data
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@')
  
  return NextResponse.json({
    DATABASE_URL: maskedUrl,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET ✅' : 'NOT SET ❌',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    dbUrlContainsHost: dbUrl.includes('@HOST:'),
    dbUrlContainsLocalhost: dbUrl.includes('@localhost:'),
  })
}
