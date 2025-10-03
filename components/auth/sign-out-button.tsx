"use client"

import { useRouter } from "next/navigation"
import { signOut as nextAuthSignOut } from "next-auth/react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  const router = useRouter()
  
  const handleSignOut = async () => {
    try {
      // First call our custom API to clear server-side cookies
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })
      
      if (res.ok) {
        // Then use NextAuth's client-side signOut without redirect
        // This clears client-side session state
        await nextAuthSignOut({ redirect: false })
        
        // Finally redirect manually to avoid CSRF token issues
        window.location.href = '/auth/signin'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: force redirect to signin page even if there was an error
      window.location.href = '/auth/signin'
    }
  }

  return (
    <DropdownMenuItem 
      onClick={handleSignOut} 
      className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 focus:text-red-600"
    >
      <LogOut className="mr-3 h-4 w-4" />
      <span>Cerrar Sesión</span>
    </DropdownMenuItem>
  )
}
