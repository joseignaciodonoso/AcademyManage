// This page should render the STUDENT signup, not the academy signup
// For now, we redirect to the main signup which is for academies
// TODO: Create a proper student signup page for tenants
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TenantSignupPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Temporarily redirect to signin
    // Students should be added by academy admins, not self-register
    router.push("../auth/signin?message=Contacta al administrador para registrarte")
  }, [router])
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirigiendo...</p>
    </div>
  )
}
