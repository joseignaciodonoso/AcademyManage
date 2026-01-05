"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/toaster"
import { BrandingApplier } from "@/components/branding-applier"
import SessionManager from "@/components/auth/SessionManager"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SessionManager />
      <BrandingApplier />
      {children}
      <Toaster />
    </SessionProvider>
  )
}
