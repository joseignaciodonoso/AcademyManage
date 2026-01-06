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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <nav className="flex items-center justify-between p-4 lg:px-8 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🏆</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">ApexLeap</span>
        </div>
        {backHref && (
          <Link href={backHref} className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            Volver al inicio
          </Link>
        )}
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className={cn("w-full max-w-md", className)}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                {Icon ? <Icon className="h-7 w-7 text-white" /> : <span className="h-7 w-7 block" />}
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h1>
            {subtitle && (
              <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
            {children}
          </div>

          {footer && (
            <div className="text-center mt-6 text-slate-600 dark:text-slate-400">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
