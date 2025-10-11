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
  brandPrimary: string
  brandSecondary: string
  brandAccent: string
  brandNeutral: string
  brandBackground: string
  brandForeground: string
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
    brandPrimary: "#0066cc",
    brandSecondary: "#666666",
    brandAccent: "#ff6b35",
    brandNeutral: "#f5f5f5",
    brandBackground: "#ffffff",
    brandForeground: "#000000",
    defaultThemeMode: "system",
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
            brandPrimary: branding.brandPrimary,
            brandSecondary: branding.brandSecondary,
            brandAccent: branding.brandAccent,
            brandNeutral: branding.brandNeutral,
            brandBackground: branding.brandBackground,
            brandForeground: branding.brandForeground,
            defaultThemeMode: branding.defaultThemeMode,
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
          defaultThemeMode: data.defaultThemeMode,
        }
      } else if (activeTab === "colors") {
        payload = {
          ...basePayload,
          brandPrimary: data.brandPrimary,
          brandSecondary: data.brandSecondary,
          brandAccent: data.brandAccent,
          brandNeutral: data.brandNeutral,
          brandBackground: data.brandBackground,
          brandForeground: data.brandForeground,
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
        // Reset only color fields to Prisma defaults (same used in API GET comments)
        payload = {
          ...base,
          brandPrimary: "#000000",
          brandSecondary: "#666666",
          brandAccent: "#0066cc",
          brandNeutral: "#f5f5f5",
          brandBackground: "#ffffff",
          brandForeground: "#000000",
          defaultThemeMode: "system",
        }
      } else if (activeTab === "logos") {
        // Reset only logos
        payload = { ...base, logoUrl: null, logoDarkUrl: null, faviconUrl: null }
      } else {
        setSaving(false)
        return
      }

      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Error al restablecer")

      // Reload branding and apply
      const response = await fetch(`/api/admin/branding?academyId=${academy.id}`)
      if (response.ok) {
        const branding = await response.json()
        setData((prev) => ({
          ...prev,
          name: branding.name || prev.name,
          brandPrimary: branding.brandPrimary,
          brandSecondary: branding.brandSecondary,
          brandAccent: branding.brandAccent,
          brandNeutral: branding.brandNeutral,
          brandBackground: branding.brandBackground,
          brandForeground: branding.brandForeground,
          defaultThemeMode: branding.defaultThemeMode,
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
  const colorOptions: { key: keyof BrandingData; label: string; placeholder: string }[] = [
    { key: "brandPrimary", label: "Color Primario", placeholder: "#0066cc" },
    { key: "brandSecondary", label: "Color Secundario", placeholder: "#666666" },
    { key: "brandAccent", label: "Color de Acento", placeholder: "#ff6b35" },
    { key: "brandNeutral", label: "Color Neutral", placeholder: "#f5f5f5" },
    { key: "brandBackground", label: "Fondo", placeholder: "#ffffff" },
    { key: "brandForeground", label: "Texto", placeholder: "#000000" },
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
    return <div className="flex items-center justify-center p-8">Cargando configuración...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuración de Branding</h2>
          <p className="text-muted-foreground">Personaliza la apariencia visual de tu academia</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Restablecer configuración
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v)=>setActiveTab(v as typeof activeTab)} className="space-y-4">
        <TabsList className="bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))]/70 border border-border">
          <TabsTrigger value="general" className="data-[state=active]:bg-[hsl(var(--background))] data-[state=active]:text-[hsl(var(--foreground))]">
            General
          </TabsTrigger>
          <TabsTrigger value="colors" className="data-[state=active]:bg-[hsl(var(--background))] data-[state=active]:text-[hsl(var(--foreground))]">
            Colores
          </TabsTrigger>
          <TabsTrigger value="logos" className="data-[state=active]:bg-[hsl(var(--background))] data-[state=active]:text-[hsl(var(--foreground))]">
            Logos
          </TabsTrigger>
          <TabsTrigger value="preview" className="data-[state=active]:bg-[hsl(var(--background))] data-[state=active]:text-[hsl(var(--foreground))]">
            Vista Previa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="glass-effect border-gray-700/50">
            <CardHeader>
              <CardTitle>Datos de la Academia</CardTitle>
              <CardDescription>Nombre y preferencias generales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la academia</Label>
                <Input
                  value={data.name || ""}
                  onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Tu Academia"
                />
              </div>
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

        <TabsContent value="colors" className="space-y-4">
          <Card className="glass-effect border-gray-700/50">
            <CardHeader>
              <CardTitle>Paleta de Colores</CardTitle>
              <CardDescription>Define los colores principales de tu marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Modo simple recomendado */}
              <div className="rounded-lg border border-border p-4 bg-[hsl(var(--background))]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Modo Simple (3 colores)</h4>
                    <p className="text-sm text-[hsl(var(--foreground))]/70">Elige Primario, Acento y Neutral. Derivaremos fondo y texto automáticamente según el modo del tema.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={deriveFromSimple}>Aplicar reglas recomendadas</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[{key:'brandPrimary',label:'Primario'},{key:'brandAccent',label:'Acento'},{key:'brandNeutral',label:'Neutral'}].map(({key,label}: any) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={(data as any)[key]} onChange={(e)=>handleColorChange(key as any, e.target.value)} className="w-16 h-10 p-1"/>
                        <Input value={(data as any)[key]} onChange={(e)=>handleColorChange(key as any, e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {colorOptions.map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={data[key] as string}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={data[key] as string}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        placeholder={placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>

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

        <TabsContent value="logos" className="space-y-4">
          <div className="grid gap-4">
            {logoOptions.map(({ key, label, type }) => (
              <Card key={key} className="glass-effect border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                    {data[key] ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={(data[key] as string) || "/placeholder.svg"}
                          alt={label}
                          className={`h-12 w-auto ${type === "logoDark" ? "bg-gray-900 p-2 rounded" : ""}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`${type}-upload`)?.click()}
                          disabled={uploading}
                        >
                          Cambiar
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById(`${type}-upload`)?.click()}
                          disabled={uploading}
                        >
                          {uploading ? "Subiendo..." : `Subir ${label}`}
                        </Button>
                      </div>
                    )}
                    <input
                      id={`${type}-upload`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, type)
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card className="glass-effect border-gray-700/50">
            <CardHeader>
              <CardTitle>Vista Previa del Branding</CardTitle>
              <CardDescription>Así se verá tu academia con la configuración actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="space-y-4 p-4 rounded-lg border"
                style={{
                  backgroundColor: data.brandBackground,
                  color: data.brandForeground,
                  borderColor: data.brandNeutral,
                }}
              >
                <div
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: data.brandPrimary }}
                >
                  {data.logoUrl && <img src={data.logoUrl || "/placeholder.svg"} alt="Logo" className="h-8 w-auto" />}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      style={{
                        backgroundColor: data.brandAccent,
                        color: data.brandBackground,
                      }}
                    >
                      Botón de Acento
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        borderColor: data.brandBackground,
                        color: data.brandBackground,
                      }}
                    >
                      Botón Secundario
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold" style={{ color: data.brandPrimary }}>
                    Tu Academia de Artes Marciales
                  </h3>
                  <p style={{ color: data.brandForeground }}>
                    Este es un ejemplo de cómo se verá el contenido con tu branding aplicado.
                  </p>
                  <div className="p-3 rounded" style={{ backgroundColor: data.brandNeutral }}>
                    <p className="text-sm" style={{ color: data.brandForeground }}>
                      Tarjeta de ejemplo con fondo neutral
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
