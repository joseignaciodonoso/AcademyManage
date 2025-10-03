"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/toaster"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
