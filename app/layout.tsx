import type React from "react"
import type { Metadata } from "next"
import { Providers } from "@/components/providers"
import { Suspense } from "react"
import "./globals.css"

// Ensure root layout is always rendered dynamically on server
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
export const runtime = "nodejs"

export const metadata: Metadata = {
  title: "Academia Management Platform",
  description: "Comprehensive martial arts academy management system",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className="font-sans">
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  )
}
