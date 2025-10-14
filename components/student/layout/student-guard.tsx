"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export function StudentGuard({ hasActivePlan, children }: { hasActivePlan: boolean; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (hasActivePlan) return
    // Rutas permitidas sin plan activo
    const allowed = ["/app/billing", "/app/subscribe"]
    const isAllowed = allowed.some((p) => pathname === p || pathname.startsWith(p + "/"))
    if (!isAllowed) {
      router.replace("/app/billing")
    }
  }, [hasActivePlan, pathname, router])

  return <>{children}</>
}
