import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 TEST METRICS - Starting...')
    
    const session = await getServerSession(authOptions)
    console.log('📋 Session:', session ? {
      user: session.user?.email,
      role: session.user?.role,
      academyId: session.user?.academyId
    } : 'NO SESSION')
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }
    
    const academyId = session.user.academyId
    console.log('🏫 Academy ID:', academyId)
    
    if (!academyId) {
      return NextResponse.json({ error: 'No academyId in session' }, { status: 400 })
    }
    
    // Test simple query
    const totalStudents = await prisma.user.count({
      where: { academyId, role: 'STUDENT' }
    })
    console.log('👥 Total students:', totalStudents)
    
    return NextResponse.json({
      success: true,
      session: {
        email: session.user.email,
        role: session.user.role,
        academyId: session.user.academyId
      },
      totalStudents
    })
  } catch (error: any) {
    console.error('❌ TEST METRICS ERROR:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
