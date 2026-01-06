"use client"

import { useState, useEffect } from "react"
import { applyBrandingToDocument } from "@/lib/branding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Save, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { checkContrastRatio, getContrastRecommendation } from "@/lib/branding"
import { useToast } from "@/hooks/use-toast"

interface BrandingData {
  name?: string
  // Custom titles
  adminPanelTitle: string
  studentPortalTitle: string
  // Core colors
  brandPrimary: string
  brandSecondary: string
  brandAccent: string
  brandNeutral: string
  brandBackground: string
  brandForeground: string
  // Text colors for buttons/elements
  brandPrimaryForeground: string
  brandSecondaryForeground: string
  brandAccentForeground: string
  // UI Element colors
  brandCard: string
  brandCardForeground: string
  brandPopover: string
  brandPopoverForeground: string
  brandMuted: string
  brandMutedForeground: string
  brandBorder: string
  // Assets
  logoUrl?: string
  logoDarkUrl?: string
  faviconUrl?: string
  defaultThemeMode: "light" | "dark" | "system"
}

export function BrandingSettings({ academy }: { academy: { id: string; name?: string } }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "colors" | "logos" | "preview">("general")
  const [data, setData] = useState<BrandingData>({
    name: academy?.name || "",
    // Custom titles
    adminPanelTitle: "Panel de Administración",
    studentPortalTitle: "Portal del Estudiante",
    // Core colors
    brandPrimary: "#3b82f6",
    brandSecondary: "#64748b",
    brandAccent: "#8b5cf6",
    brandNeutral: "#f5f5f5",
    brandBackground: "#ffffff",
    brandForeground: "#1f2937",
    // Text colors for buttons
    brandPrimaryForeground: "#ffffff",
    brandSecondaryForeground: "#ffffff",
    brandAccentForeground: "#ffffff",
    // UI Element colors
    brandCard: "#ffffff",
    brandCardForeground: "#1f2937",
    brandPopover: "#ffffff",
    brandPopoverForeground: "#1f2937",
    brandMuted: "#f5f5f5",
    brandMutedForeground: "#737373",
    brandBorder: "#e5e5e5",
    defaultThemeMode: "light",
  })

  const [contrastCheck, setContrastCheck] = useState<{
    ratio: number
    level: "fail" | "aa" | "aaa"
    message: string
    suggestion?: string
  } | null>(null)

  // --- Guardrails helpers (simple 3-color mode) ---
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '')
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
    const bigint = Number.parseInt(full, 16)
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
  }
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(Math.max(0, Math.min(255, Math.round(g))))}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`
  }
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }
  const hslToRgb = (h: number, s: number, l: number) => {
    s /= 100; l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return {
      r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4))
    }
  }
  const hslToHex = (h: number, s: number, l: number) => {
    const { r, g, b } = hslToRgb(h, s, l)
    return rgbToHex(r, g, b)
  }
  const shiftHue = (hex: string, delta: number) => {
    const { r, g, b } = hexToRgb(hex)
    const { h, s, l } = rgbToHsl(r, g, b)
    const nh = (h + delta + 360) % 360
    return hslToHex(nh, s, l)
  }
  const bestForegroundFor = (bgHex: string) => {
    const whiteRatio = checkContrastRatio('#FFFFFF', bgHex)
    const blackRatio = checkContrastRatio('#000000', bgHex)
    return whiteRatio >= blackRatio ? '#FFFFFF' : '#000000'
  }
  const deriveFromSimple = () => {
    const primary = data.brandPrimary
    const accent = data.brandAccent
    const neutral = data.brandNeutral
    const secondary = shiftHue(primary, 12)
    const { r, g, b } = hexToRgb(neutral)
    const { h } = rgbToHsl(r, g, b)
    const background = data.defaultThemeMode === 'dark'
      ? hslToHex(h, 14, 12)
      : hslToHex(h, 12, 98)
    const foreground = bestForegroundFor(background)
    setData(prev => ({
      ...prev,
      brandPrimary: primary,
      brandAccent: accent,
      brandSecondary: secondary,
      brandNeutral: neutral,
      brandBackground: background,
      brandForeground: foreground,
    }))
  }

  // Load current branding settings
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await fetch(`/api/admin/branding?academyId=${academy.id}`)
        if (response.ok) {
          const branding = await response.json()
          setData((prev) => ({
            ...prev,
            name: branding.name || prev.name,
            // Custom titles
            adminPanelTitle: branding.adminPanelTitle || prev.adminPanelTitle,
            studentPortalTitle: branding.studentPortalTitle || prev.studentPortalTitle,
            // Core colors
            brandPrimary: branding.brandPrimary || prev.brandPrimary,
            brandSecondary: branding.brandSecondary || prev.brandSecondary,
            brandAccent: branding.brandAccent || prev.brandAccent,
            brandNeutral: branding.brandNeutral || prev.brandNeutral,
            brandBackground: branding.brandBackground || prev.brandBackground,
            brandForeground: branding.brandForeground || prev.brandForeground,
            // Text colors for buttons
            brandPrimaryForeground: branding.brandPrimaryForeground || prev.brandPrimaryForeground,
            brandSecondaryForeground: branding.brandSecondaryForeground || prev.brandSecondaryForeground,
            brandAccentForeground: branding.brandAccentForeground || prev.brandAccentForeground,
            // UI Element colors
            brandCard: branding.brandCard || prev.brandCard,
            brandCardForeground: branding.brandCardForeground || prev.brandCardForeground,
            brandPopover: branding.brandPopover || prev.brandPopover,
            brandPopoverForeground: branding.brandPopoverForeground || prev.brandPopoverForeground,
            brandMuted: branding.brandMuted || prev.brandMuted,
            brandMutedForeground: branding.brandMutedForeground || prev.brandMutedForeground,
            brandBorder: branding.brandBorder || prev.brandBorder,
            // Settings & Assets
            defaultThemeMode: branding.defaultThemeMode || prev.defaultThemeMode,
            logoUrl: branding.logoUrl,
            logoDarkUrl: branding.logoDarkUrl,
            faviconUrl: branding.faviconUrl,
          }))
        }
      } catch (error) {
        console.error("Error loading branding:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBranding()
  }, [academy.id])

  // Check contrast when colors change
  useEffect(() => {
    const ratio = checkContrastRatio(data.brandForeground, data.brandBackground)
    const recommendation = getContrastRecommendation(ratio)
    setContrastCheck({ ratio, ...recommendation })
  }, [data.brandForeground, data.brandBackground])

  // Do not apply branding globally here; global applier handles tokens after save

  const handleColorChange = (field: keyof BrandingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (file: File, type: "logo" | "logoDark" | "favicon") => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)
      formData.append("academyId", academy.id)

      const response = await fetch("/api/upload/branding", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Error al subir archivo")

      const { url } = await response.json()
      const field = type === "logo" ? "logoUrl" : type === "logoDark" ? "logoDarkUrl" : "faviconUrl"
      setData((prev) => ({ ...prev, [field]: url }))

      toast({
        title: "Archivo subido",
        description: "El archivo se ha subido correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al subir el archivo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Build payload with only fields relevant to the current tab
      const basePayload: any = { academyId: academy.id }
      let payload: any = { ...basePayload }

      if (activeTab === "general") {
        payload = {
          ...basePayload,
          name: data.name,
          adminPanelTitle: data.adminPanelTitle,
          studentPortalTitle: data.studentPortalTitle,
          defaultThemeMode: data.defaultThemeMode,
        }
      } else if (activeTab === "colors") {
        payload = {
          ...basePayload,
          // Core colors
          brandPrimary: data.brandPrimary,
          brandSecondary: data.brandSecondary,
          brandAccent: data.brandAccent,
          brandNeutral: data.brandNeutral,
          brandBackground: data.brandBackground,
          brandForeground: data.brandForeground,
          // Text colors for buttons
          brandPrimaryForeground: data.brandPrimaryForeground,
          brandSecondaryForeground: data.brandSecondaryForeground,
          brandAccentForeground: data.brandAccentForeground,
          // UI Element colors
          brandCard: data.brandCard,
          brandCardForeground: data.brandCardForeground,
          brandPopover: data.brandPopover,
          brandPopoverForeground: data.brandPopoverForeground,
          brandMuted: data.brandMuted,
          brandMutedForeground: data.brandMutedForeground,
          brandBorder: data.brandBorder,
          defaultThemeMode: data.defaultThemeMode,
        }
      } else if (activeTab === "logos") {
        payload = {
          ...basePayload,
          logoUrl: data.logoUrl ?? null,
          logoDarkUrl: data.logoDarkUrl ?? null,
          faviconUrl: data.faviconUrl ?? null,
        }
      } else {
        // Preview tab: nothing specific to save
        toast({ title: "Nada que guardar", description: "La pestaña Vista Previa no tiene campos de configuración." })
        setSaving(false)
        return
      }

      const response = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Error al guardar")

      // Re-aplicar inmediatamente el branding en el documento para que todas las vistas lo reflejen
      try {
        const res = await fetch(`/api/admin/branding?academyId=${academy.id}`, { cache: "no-store" })
        if (res.ok) {
          const b = await res.json()
          applyBrandingToDocument(academy.id, {
            primary: b.brandPrimary,
            secondary: b.brandSecondary,
            accent: b.brandAccent,
            neutral: b.brandNeutral,
            background: b.brandBackground,
            foreground: b.brandForeground,
            primaryForeground: b.brandPrimaryForeground || '#ffffff',
            secondaryForeground: b.brandSecondaryForeground || '#ffffff',
            accentForeground: b.brandAccentForeground || '#ffffff',
            card: b.brandCard || b.brandBackground,
            cardForeground: b.brandCardForeground || b.brandForeground,
            popover: b.brandPopover || b.brandBackground,
            popoverForeground: b.brandPopoverForeground || b.brandForeground,
            muted: b.brandMuted || b.brandNeutral,
            mutedForeground: b.brandMutedForeground || '#737373',
            border: b.brandBorder || '#e5e5e5',
            logoUrl: b.logoUrl,
            logoDarkUrl: b.logoDarkUrl,
            faviconUrl: b.faviconUrl,
            ogImageUrl: undefined,
            defaultThemeMode: b.defaultThemeMode,
          })
          try {
            window.dispatchEvent(new CustomEvent("branding:updated", { detail: { name: b.name } }))
          } catch {}
        }
      } catch {}

      toast({
        title: "Configuración guardada",
        description: activeTab === "general"
          ? "Se guardaron los datos de la academia."
          : activeTab === "colors"
            ? "Se guardaron los colores de la marca."
            : "Se guardaron los logos y favicon.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    setSaving(true)
    try {
      // Build per-tab reset payload
      const base: any = { academyId: academy.id }
      let payload: any = { ...base }

      if (activeTab === "general") {
        // Reset only general fields
        payload = { ...base, defaultThemeMode: "system" }
      } else if (activeTab === "colors") {
        // Reset to ORIGINAL app colors (light theme)
        payload = {
          ...base,
          brandPrimary: "#3b82f6",
          brandSecondary: "#64748b",
          brandAccent: "#8b5cf6",
          brandNeutral: "#f5f5f5",
          brandBackground: "#ffffff",
          brandForeground: "#1f2937",
          brandPrimaryForeground: "#ffffff",
          brandSecondaryForeground: "#ffffff",
          brandAccentForeground: "#ffffff",
          brandCard: "#ffffff",
          brandCardForeground: "#1f2937",
          brandPopover: "#ffffff",
          brandPopoverForeground: "#1f2937",
          brandMuted: "#f5f5f5",
          brandMutedForeground: "#737373",
          brandBorder: "#e5e5e5",
          defaultThemeMode: "light",
        }
      } else if (activeTab === "logos") {
        // Reset only logos
        payload = { ...base, logoUrl: null, logoDarkUrl: null, faviconUrl: null }
      } else {
        setSaving(false)
        return
      }

      console.log("Enviando payload de reset:", payload)
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      console.log("Respuesta del servidor:", res.status, res.ok)
      if (!res.ok) {
        const errorData = await res.json()
        console.error("Error del servidor:", errorData)
        throw new Error("Error al restablecer")
      }

      // Reload branding and apply
      const response = await fetch(`/api/admin/branding?academyId=${academy.id}`)
      if (response.ok) {
        const branding = await response.json()
        console.log("Branding recargado desde API:", branding)
        setData((prev) => ({
          ...prev,
          name: branding.name || prev.name,
          brandPrimary: branding.brandPrimary || prev.brandPrimary,
          brandSecondary: branding.brandSecondary || prev.brandSecondary,
          brandAccent: branding.brandAccent || prev.brandAccent,
          brandNeutral: branding.brandNeutral || prev.brandNeutral,
          brandBackground: branding.brandBackground || prev.brandBackground,
          brandForeground: branding.brandForeground || prev.brandForeground,
          brandPrimaryForeground: branding.brandPrimaryForeground || prev.brandPrimaryForeground,
          brandSecondaryForeground: branding.brandSecondaryForeground || prev.brandSecondaryForeground,
          brandAccentForeground: branding.brandAccentForeground || prev.brandAccentForeground,
          brandCard: branding.brandCard || prev.brandCard,
          brandCardForeground: branding.brandCardForeground || prev.brandCardForeground,
          brandPopover: branding.brandPopover || prev.brandPopover,
          brandPopoverForeground: branding.brandPopoverForeground || prev.brandPopoverForeground,
          brandMuted: branding.brandMuted || prev.brandMuted,
          brandMutedForeground: branding.brandMutedForeground || prev.brandMutedForeground,
          brandBorder: branding.brandBorder || prev.brandBorder,
          defaultThemeMode: branding.defaultThemeMode || prev.defaultThemeMode,
          logoUrl: branding.logoUrl,
          logoDarkUrl: branding.logoDarkUrl,
          faviconUrl: branding.faviconUrl,
        }))
        try {
          applyBrandingToDocument(academy.id, {
            primary: branding.brandPrimary,
            secondary: branding.brandSecondary,
            accent: branding.brandAccent,
            neutral: branding.brandNeutral,
            background: branding.brandBackground,
            foreground: branding.brandForeground,
            primaryForeground: branding.brandPrimaryForeground || '#ffffff',
            secondaryForeground: branding.brandSecondaryForeground || '#ffffff',
            accentForeground: branding.brandAccentForeground || '#ffffff',
            card: branding.brandCard || branding.brandBackground,
            cardForeground: branding.brandCardForeground || branding.brandForeground,
            popover: branding.brandPopover || branding.brandBackground,
            popoverForeground: branding.brandPopoverForeground || branding.brandForeground,
            muted: branding.brandMuted || branding.brandNeutral,
            mutedForeground: branding.brandMutedForeground || '#737373',
            border: branding.brandBorder || '#e5e5e5',
            logoUrl: branding.logoUrl,
            logoDarkUrl: branding.logoDarkUrl,
            faviconUrl: branding.faviconUrl,
            ogImageUrl: undefined,
            defaultThemeMode: branding.defaultThemeMode,
          })
          const root = document.documentElement
          if (branding.defaultThemeMode === "dark") root.classList.add("dark")
          else if (branding.defaultThemeMode === "light") root.classList.remove("dark")
          else {
            const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            if (prefersDark) root.classList.add("dark")
            else root.classList.remove("dark")
          }
          try {
            window.dispatchEvent(new CustomEvent("branding:updated", { detail: { name: branding.name } }))
          } catch {}
        } catch {}
      }

      toast({
        title: "Restablecido",
        description: activeTab === "general"
          ? "Se restablecieron los datos generales."
          : activeTab === "colors"
            ? "Se restablecieron los colores de la marca."
            : "Se restablecieron los logos.",
      })
    } catch (e) {
      toast({ title: "Error", description: "No se pudo restablecer.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Typed list of color fields for safer indexing
  const coreColorOptions: { key: keyof BrandingData; label: string; placeholder: string }[] = [
    { key: "brandPrimary", label: "Primario", placeholder: "#0066cc" },
    { key: "brandSecondary", label: "Secundario", placeholder: "#666666" },
    { key: "brandAccent", label: "Acento", placeholder: "#ff6b35" },
    { key: "brandNeutral", label: "Neutral", placeholder: "#f5f5f5" },
    { key: "brandBackground", label: "Fondo", placeholder: "#ffffff" },
    { key: "brandForeground", label: "Texto General", placeholder: "#000000" },
  ]
  
  const buttonTextOptions: { key: keyof BrandingData; label: string; placeholder: string }[] = [
    { key: "brandPrimaryForeground", label: "Texto Botón Primario", placeholder: "#ffffff" },
    { key: "brandSecondaryForeground", label: "Texto Botón Secundario", placeholder: "#ffffff" },
    { key: "brandAccentForeground", label: "Texto Botón Acento", placeholder: "#ffffff" },
  ]
  
  const uiElementOptions: { key: keyof BrandingData; label: string; placeholder: string }[] = [
    { key: "brandCard", label: "Fondo Tarjetas", placeholder: "#ffffff" },
    { key: "brandCardForeground", label: "Texto Tarjetas", placeholder: "#000000" },
    { key: "brandPopover", label: "Fondo Menús", placeholder: "#ffffff" },
    { key: "brandPopoverForeground", label: "Texto Menús", placeholder: "#000000" },
    { key: "brandMuted", label: "Fondo Secundario", placeholder: "#f5f5f5" },
    { key: "brandMutedForeground", label: "Texto Secundario", placeholder: "#737373" },
    { key: "brandBorder", label: "Bordes", placeholder: "#e5e5e5" },
  ]

  const logoOptions: Array<{
    key: keyof Pick<BrandingData, "logoUrl" | "logoDarkUrl" | "faviconUrl">
    label: string
    type: "logo" | "logoDark" | "favicon"
  }> = [
    { key: "logoUrl", label: "Logo Principal", type: "logo" },
    { key: "logoDarkUrl", label: "Logo Oscuro", type: "logoDark" },
    { key: "faviconUrl", label: "Favicon", type: "favicon" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personalización de Marca</h1>
          <p className="text-muted-foreground">Define la identidad visual de tu academia</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={saving} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Restablecer
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v)=>setActiveTab(v as typeof activeTab)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="colors">Colores</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Academia</CardTitle>
              <CardDescription>Nombre y configuración básica de tu organización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="academy-name">Nombre de la academia</Label>
                <Input
                  id="academy-name"
                  value={data.name || ""}
                  onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Academia Jiu-Jitsu Santiago"
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">Este nombre aparecerá en el sidebar, header y emails</p>
              </div>

              {/* Custom Titles Section */}
              <div className="rounded-xl border border-border p-5 space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">🏷️ Títulos Personalizados</h4>
                  <p className="text-sm text-muted-foreground">Personaliza los títulos que aparecen en el header de cada sección</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-panel-title">Título Panel Admin</Label>
                    <Input
                      id="admin-panel-title"
                      value={data.adminPanelTitle}
                      onChange={(e) => setData((prev) => ({ ...prev, adminPanelTitle: e.target.value }))}
                      placeholder="Panel de Administración"
                    />
                    <p className="text-xs text-muted-foreground">Aparece en el header del panel de administración</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-portal-title">Título Portal Estudiante</Label>
                    <Input
                      id="student-portal-title"
                      value={data.studentPortalTitle}
                      onChange={(e) => setData((prev) => ({ ...prev, studentPortalTitle: e.target.value }))}
                      placeholder="Portal del Estudiante"
                    />
                    <p className="text-xs text-muted-foreground">Aparece en el header del portal de estudiantes</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tema por defecto</Label>
                <div className="flex gap-3">
                  {[{value: 'light', label: '☀️ Claro'}, {value: 'dark', label: '🌙 Oscuro'}, {value: 'system', label: '💻 Automático'}].map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => handleColorChange('defaultThemeMode', theme.value)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        data.defaultThemeMode === theme.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">El tema que verán tus usuarios por defecto</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colores de Marca</CardTitle>
              <CardDescription>Personaliza los colores principales de tu academia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Modo Simple - Recomendado */}
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">✨ Modo Recomendado</h4>
                    <p className="text-sm text-muted-foreground">Elige 3 colores y generaremos el resto automáticamente</p>
                  </div>
                  <Button variant="default" size="sm" onClick={deriveFromSimple}>Generar paleta</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[{key:'brandPrimary',label:'Color Principal', desc:'Botones y elementos destacados'},{key:'brandAccent',label:'Color de Acento', desc:'Detalles y llamadas a la acción'},{key:'brandNeutral',label:'Color Neutral', desc:'Fondos y bordes'}].map(({key,label,desc}: any) => (
                    <div key={key} className="space-y-2">
                      <Label className="font-medium">{label}</Label>
                      <div className="flex gap-2">
                        <div className="relative">
                          <input 
                            type="color" 
                            value={(data as any)[key]} 
                            onChange={(e)=>handleColorChange(key as any, e.target.value)} 
                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                          />
                        </div>
                        <Input value={(data as any)[key]} onChange={(e)=>handleColorChange(key as any, e.target.value)} className="font-mono text-sm" />
                      </div>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colores de Texto para Botones */}
              <div className="rounded-xl border border-border p-5">
                <h4 className="font-semibold mb-1">🎨 Texto de Botones</h4>
                <p className="text-sm text-muted-foreground mb-4">Color del texto dentro de botones (ej: blanco para botones oscuros)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {buttonTextOptions.map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm">{label}</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={data[key] as string}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border border-border"
                        />
                        <Input
                          value={data[key] as string}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          placeholder={placeholder}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colores de Elementos UI */}
              <div className="rounded-xl border border-border p-5">
                <h4 className="font-semibold mb-1">📦 Elementos de Interfaz</h4>
                <p className="text-sm text-muted-foreground mb-4">Fondos y textos de tarjetas, menús desplegables y otros elementos</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {uiElementOptions.map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm">{label}</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={data[key] as string}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border border-border"
                        />
                        <Input
                          value={data[key] as string}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          placeholder={placeholder}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colores Base - Colapsable */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Ver todos los colores base</summary>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {coreColorOptions.map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm">{label}</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={data[key] as string}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border border-border"
                        />
                        <Input
                          value={data[key] as string}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          placeholder={placeholder}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              {contrastCheck && (
                <Alert variant={contrastCheck.level === "fail" ? "destructive" : "default"}>
                  {contrastCheck.level === "fail" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div>
                      <strong>Contraste: {contrastCheck.ratio.toFixed(2)}:1</strong> - {contrastCheck.message}
                    </div>
                    {contrastCheck.suggestion && <div className="mt-1 text-sm">{contrastCheck.suggestion}</div>}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Tema por Defecto</Label>
                <Select
                  value={data.defaultThemeMode}
                  onValueChange={(value) => handleColorChange("defaultThemeMode", value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identidad Visual</CardTitle>
              <CardDescription>Sube tu logo y favicon para personalizar la experiencia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Principal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Logo Principal</Label>
                    <p className="text-xs text-muted-foreground">Aparece en el sidebar y encabezados (fondo claro)</p>
                  </div>
                </div>
                <div 
                  className="relative border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer bg-card"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {data.logoUrl ? (
                    <div className="flex items-center gap-4">
                      <div className="bg-muted rounded-lg p-4">
                        <img src={data.logoUrl} alt="Logo" className="h-16 w-auto max-w-[200px] object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Logo cargado</p>
                        <p className="text-xs text-muted-foreground">Haz clic para cambiar</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setData(prev => ({...prev, logoUrl: undefined})) }}>
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="font-medium">Arrastra tu logo aquí</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, SVG o JPG (max. 2MB)</p>
                    </div>
                  )}
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, 'logo') }} />
                </div>
              </div>

              {/* Logo Oscuro */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">Logo para Modo Oscuro</Label>
                  <p className="text-xs text-muted-foreground">Opcional - versión del logo para fondos oscuros</p>
                </div>
                <div 
                  className="relative border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer bg-sidebar"
                  onClick={() => document.getElementById('logoDark-upload')?.click()}
                >
                  {data.logoDarkUrl ? (
                    <div className="flex items-center gap-4">
                      <div className="bg-black/20 rounded-lg p-4">
                        <img src={data.logoDarkUrl} alt="Logo Oscuro" className="h-16 w-auto max-w-[200px] object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-sidebar-foreground">Logo oscuro cargado</p>
                        <p className="text-xs text-sidebar-foreground/60">Haz clic para cambiar</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setData(prev => ({...prev, logoDarkUrl: undefined})) }}>
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload className="h-10 w-10 mx-auto mb-3 text-sidebar-foreground/50" />
                      <p className="font-medium text-sidebar-foreground">Sube logo para modo oscuro</p>
                      <p className="text-xs text-sidebar-foreground/60 mt-1">Opcional - se usará el logo principal si no se sube</p>
                    </div>
                  )}
                  <input id="logoDark-upload" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, 'logoDark') }} />
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">Favicon</Label>
                  <p className="text-xs text-muted-foreground">Icono que aparece en la pestaña del navegador</p>
                </div>
                <div 
                  className="relative border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('favicon-upload')?.click()}
                >
                  {data.faviconUrl ? (
                    <div className="flex items-center gap-4">
                      <div className="bg-muted rounded-lg p-3">
                        <img src={data.faviconUrl} alt="Favicon" className="h-8 w-8 object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Favicon cargado</p>
                        <p className="text-xs text-muted-foreground">Haz clic para cambiar</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setData(prev => ({...prev, faviconUrl: undefined})) }}>
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="font-medium">Sube tu favicon</p>
                      <p className="text-xs text-muted-foreground mt-1">ICO, PNG o SVG (32x32 recomendado)</p>
                    </div>
                  )}
                  <input id="favicon-upload" type="file" accept="image/*,.ico" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, 'favicon') }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
              <CardDescription>Así se verá tu academia con la configuración actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Header Preview */}
                <div className="rounded-xl overflow-hidden border">
                  <div
                    className="flex items-center justify-between p-4"
                    style={{ backgroundColor: data.brandPrimary }}
                  >
                    <div className="flex items-center gap-3">
                      {data.logoUrl ? (
                        <img src={data.logoUrl} alt="Logo" className="h-8 w-auto" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-white/20" />
                      )}
                      <span className="font-semibold text-white">{data.name || 'Tu Academia'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        style={{ backgroundColor: data.brandAccent, color: '#fff' }}
                      >
                        Acción Principal
                      </button>
                    </div>
                  </div>
                  
                  <div
                    className="p-6 space-y-4"
                    style={{ backgroundColor: data.brandBackground, color: data.brandForeground }}
                  >
                    <h3 className="text-xl font-bold" style={{ color: data.brandPrimary }}>
                      Bienvenido a {data.name || 'Tu Academia'}
                    </h3>
                    <p className="text-sm" style={{ color: data.brandForeground, opacity: 0.8 }}>
                      Este es un ejemplo de cómo se verá el contenido de tu portal con los colores seleccionados.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-lg text-center" style={{ backgroundColor: data.brandPrimary + '15' }}>
                        <div className="text-2xl font-bold" style={{ color: data.brandPrimary }}>24</div>
                        <div className="text-xs" style={{ color: data.brandForeground, opacity: 0.7 }}>Alumnos</div>
                      </div>
                      <div className="p-4 rounded-lg text-center" style={{ backgroundColor: data.brandAccent + '15' }}>
                        <div className="text-2xl font-bold" style={{ color: data.brandAccent }}>8</div>
                        <div className="text-xs" style={{ color: data.brandForeground, opacity: 0.7 }}>Clases</div>
                      </div>
                      <div className="p-4 rounded-lg text-center" style={{ backgroundColor: data.brandNeutral + '30' }}>
                        <div className="text-2xl font-bold" style={{ color: data.brandForeground }}>3</div>
                        <div className="text-xs" style={{ color: data.brandForeground, opacity: 0.7 }}>Planes</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Color Palette Summary */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.brandPrimary }} />
                    Principal
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.brandAccent }} />
                    Acento
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.brandNeutral }} />
                    Neutral
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: data.brandBackground }} />
                    Fondo
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
