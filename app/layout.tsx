import type React from "react"
import type { Metadata } from "next"
import { Providers } from "@/components/providers"
import { Suspense } from "react"
import "./globals.css"

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
