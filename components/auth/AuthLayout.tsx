"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  Icon?: React.ComponentType<{ className?: string }>
  backHref?: string
  footer?: ReactNode
  className?: string
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  Icon,
  backHref = "/",
  footer,
  className,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-20" />
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-[hsl(var(--accent))] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-[hsl(var(--primary))] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[hsl(var(--secondary))] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
      </div>

      <nav className="relative z-10 flex items-center justify-between p-4 lg:px-8 backdrop-blur-md bg-[hsl(var(--foreground))]/10 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🥋</span>
          <span className="text-xl font-bold">AcademyPro</span>
        </div>
        {backHref && (
          <div className="flex items-center space-x-4">
            <Link href={backHref} className="px-3 py-2 rounded-md hover:bg-[hsl(var(--muted))]/40 transition-colors">
              Volver al inicio
            </Link>
          </div>
        )}
      </nav>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className={cn("w-full max-w-md", className)}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] rounded-2xl shadow-lg">
                {Icon ? <Icon className="h-8 w-8 text-white" /> : <span className="h-8 w-8 block" />}
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {subtitle && (
              <p className="text-[hsl(var(--foreground))]/70">{subtitle}</p>
            )}
          </div>

          {children}

          {footer && (
            <div className="text-center mt-8">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
