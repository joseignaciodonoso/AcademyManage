"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { applyBrandingToDocument } from "@/lib/branding"

interface BrandingResponse {
  name?: string
  brandPrimary: string
  brandSecondary: string
  brandAccent: string
  brandNeutral: string
  brandBackground: string
  brandForeground: string
  defaultThemeMode: "light" | "dark" | "system"
  logoUrl?: string
  logoDarkUrl?: string
  faviconUrl?: string
  configured?: boolean
  original?: {
    brandPrimary: string
    brandSecondary: string
    brandAccent: string
    brandNeutral: string
    brandBackground: string
    brandForeground: string
  }
}

export function BrandingApplier() {
  const { data: session, status } = useSession()
  const academyId = (session?.user as any)?.academyId as string | undefined
  const [branding, setBranding] = useState<BrandingResponse | null>(null)

  const canLoad = useMemo(() => status !== "loading" && !!academyId, [status, academyId])

  useEffect(() => {
    if (!canLoad || !academyId) return
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`/api/admin/branding?academyId=${academyId}`, { cache: "no-store" })
        if (!res.ok) return
        const data: BrandingResponse = await res.json()
        if (cancelled) return
        setBranding(data)
        if (data.configured) {
          applyBrandingToDocument(academyId, {
            primary: data.brandPrimary,
            secondary: data.brandSecondary,
            accent: data.brandAccent,
            neutral: data.brandNeutral,
            background: data.brandBackground,
            foreground: data.brandForeground,
            logoUrl: data.logoUrl,
            logoDarkUrl: data.logoDarkUrl,
            faviconUrl: data.faviconUrl,
            ogImageUrl: undefined,
            defaultThemeMode: data.defaultThemeMode,
          })
        } else if (data.original) {
          // Apply original app palette to preserve classic look & feel until academy config exists
          applyBrandingToDocument(academyId, {
            primary: data.original.brandPrimary,
            secondary: data.original.brandSecondary,
            accent: data.original.brandAccent,
            neutral: data.original.brandNeutral,
            background: data.original.brandBackground,
            foreground: data.original.brandForeground,
            logoUrl: undefined,
            logoDarkUrl: undefined,
            faviconUrl: undefined,
            ogImageUrl: undefined,
            defaultThemeMode: "system",
          })
        }

        // Apply theme mode only if academy configured; otherwise keep default (app original)
        if (data.configured) {
          const root = document.documentElement
          const applyMode = (mode: BrandingResponse["defaultThemeMode"]) => {
            if (mode === "dark") root.classList.add("dark")
            else if (mode === "light") root.classList.remove("dark")
            else {
              const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
              if (prefersDark) root.classList.add("dark")
              else root.classList.remove("dark")
            }
          }

          applyMode(data.defaultThemeMode)

          if (data.defaultThemeMode === "system" && window.matchMedia) {
            const mql = window.matchMedia("(prefers-color-scheme: dark)")
            const handler = (e: MediaQueryListEvent) => {
              if (e.matches) root.classList.add("dark")
              else root.classList.remove("dark")
            }
            mql.addEventListener?.("change", handler)
            if (!cancelled) {
              ;(load as any)._cleanup = () => mql.removeEventListener?.("change", handler)
            }
          }
        }

        // Set favicon only if configured
        if (data.configured && data.faviconUrl) {
          let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
          if (!link) {
            link = document.createElement("link")
            link.rel = "icon"
            document.head.appendChild(link)
          }
          link.href = data.faviconUrl
        }
      } catch (e) {
        // ignore
      }
    }

    load()
    return () => {
      cancelled = true
      if ((load as any)._cleanup) (load as any)._cleanup()
    }
  }, [canLoad, academyId])

  // No UI, only side effects
  return null
}
