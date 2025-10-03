import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Clear all auth cookies
    const cookieStore = cookies()
    const cookieNames = ["next-auth.session-token", "next-auth.csrf-token", "next-auth.callback-url", "__Secure-next-auth.callback-url", "__Host-next-auth.csrf-token"]
    
    cookieNames.forEach(name => {
      cookieStore.delete(name)
      cookieStore.delete(`__Secure-${name}`)
      cookieStore.delete(`__Host-${name}`)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Signout error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
