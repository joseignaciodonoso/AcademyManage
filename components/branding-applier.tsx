"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { applyBrandingToDocument } from "@/lib/branding"

interface BrandingResponse {
  name?: string
  // Core colors
  brandPrimary: string
  brandSecondary: string
  brandAccent: string
  brandNeutral: string
  brandBackground: string
  brandForeground: string
  // Button/element text colors
  brandPrimaryForeground?: string
  brandSecondaryForeground?: string
  brandAccentForeground?: string
  // UI element colors
  brandCard?: string
  brandCardForeground?: string
  brandPopover?: string
  brandPopoverForeground?: string
  brandMuted?: string
  brandMutedForeground?: string
  brandBorder?: string
  // Theme & Assets
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

  // Ensure base tokens are present even without an academy (e.g., SUPER_ADMIN with no selection)
  useEffect(() => {
    if (status === "loading") return
    if (academyId) return
    const root = document.documentElement
    const DEFAULT_ID = "default"
    applyBrandingToDocument(DEFAULT_ID, {
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#8b5cf6",
      neutral: "#374151",
      background: "#ffffff",
      foreground: "#1f2937",
      primaryForeground: "#ffffff",
      secondaryForeground: "#ffffff",
      accentForeground: "#ffffff",
      card: "#ffffff",
      cardForeground: "#1f2937",
      popover: "#ffffff",
      popoverForeground: "#1f2937",
      muted: "#f1f5f9",
      mutedForeground: "#64748b",
      border: "#e2e8f0",
      logoUrl: undefined,
      logoDarkUrl: undefined,
      faviconUrl: undefined,
      ogImageUrl: undefined,
      defaultThemeMode: "light",
    })
    root.classList.remove("dark")
  }, [status, academyId])

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
            // Core colors
            primary: data.brandPrimary,
            secondary: data.brandSecondary,
            accent: data.brandAccent,
            neutral: data.brandNeutral,
            background: data.brandBackground,
            foreground: data.brandForeground,
            // Button/element text colors - with safe defaults for light backgrounds
            primaryForeground: data.brandPrimaryForeground || '#ffffff',
            secondaryForeground: data.brandSecondaryForeground || '#ffffff',
            accentForeground: data.brandAccentForeground || '#ffffff',
            // UI element colors - with safe defaults
            card: data.brandCard || data.brandBackground,
            cardForeground: data.brandCardForeground || data.brandForeground,
            popover: data.brandPopover || data.brandBackground,
            popoverForeground: data.brandPopoverForeground || data.brandForeground,
            muted: data.brandMuted || '#f1f5f9',
            mutedForeground: data.brandMutedForeground || '#64748b',
            border: data.brandBorder || '#e2e8f0',
            // Assets
            logoUrl: data.logoUrl,
            logoDarkUrl: data.logoDarkUrl,
            faviconUrl: data.faviconUrl,
            ogImageUrl: undefined,
            defaultThemeMode: data.defaultThemeMode,
          })
        } else {
          const root = document.documentElement
          if (data.original) {
            // Apply the app's ORIGINAL palette to match pre-branding UI
            applyBrandingToDocument(academyId, {
              primary: data.original.brandPrimary,
              secondary: data.original.brandSecondary,
              accent: data.original.brandAccent,
              neutral: data.original.brandNeutral,
              background: data.original.brandBackground,
              foreground: data.original.brandForeground,
              primaryForeground: "#ffffff",
              secondaryForeground: "#ffffff",
              accentForeground: "#ffffff",
              card: data.original.brandBackground,
              cardForeground: data.original.brandForeground,
              popover: data.original.brandBackground,
              popoverForeground: data.original.brandForeground,
              muted: "#374151",
              mutedForeground: "#9ca3af",
              border: "#374151",
              logoUrl: undefined,
              logoDarkUrl: undefined,
              faviconUrl: undefined,
              ogImageUrl: undefined,
              defaultThemeMode: "light",
            })
            root.classList.remove("dark")
          } else {
            // No branding info at all: clean tokens and force original light baseline
            root.removeAttribute("data-academy-id")
            const styleId = `branding-${academyId}`
            const styleEl = document.getElementById(styleId)
            if (styleEl) styleEl.remove()
            root.classList.remove("dark")
          }
        }

        // Apply theme mode only if academy configured; otherwise force original dark baseline
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
