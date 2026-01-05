"use client"

import { redirect } from "next/navigation"
import { useParams, useSearchParams } from "next/navigation"

export default function TenantAppCheckoutPage() {
  const params = useParams<{ orgSlug: string }>()
  const searchParams = useSearchParams()
  
  // Redirect to the new subscribe flow
  const planId = searchParams.get("planId")
  const redirectUrl = planId 
    ? `/${params.orgSlug}/app/subscribe?planId=${planId}`
    : `/${params.orgSlug}/app/subscribe`
  
  if (typeof window !== "undefined") {
    window.location.href = redirectUrl
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">Redirigiendo...</div>
    </div>
  )
}
