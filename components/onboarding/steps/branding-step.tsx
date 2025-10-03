"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertTriangle, CheckCircle } from "lucide-react"
import { checkContrastRatio, getContrastRecommendation, applyBrandingToDocument } from "@/lib/branding"
import type { OnboardingData } from "../onboarding-wizard"

interface BrandingStepProps {
  data: OnboardingData
  onUpdate: (data: Partial<OnboardingData>) => void
  academyId: string
}

const DEFAULT_COLORS = {
  primary: "#0066cc",
  secondary: "#666666",
  accent: "#ff6b35",
  neutral: "#f5f5f5",
  background: "#ffffff",
  foreground: "#000000",
}

export function BrandingStep({ data, onUpdate, academyId }: BrandingStepProps) {
  const [uploading, setUploading] = useState(false)
  const [contrastCheck, setContrastCheck] = useState<{
    ratio: number
    level: "fail" | "aa" | "aaa"
    message: string
    suggestion?: string
  } | null>(null)

  const colors = {
    primary: data.brandPrimary || DEFAULT_COLORS.primary,
    secondary: data.brandSecondary || DEFAULT_COLORS.secondary,
    accent: data.brandAccent || DEFAULT_COLORS.accent,
    neutral: data.brandNeutral || DEFAULT_COLORS.neutral,
    background: data.brandBackground || DEFAULT_COLORS.background,
    foreground: data.brandForeground || DEFAULT_COLORS.foreground,
  }

  // Check contrast when colors change
  useEffect(() => {
    const ratio = checkContrastRatio(colors.foreground, colors.background)
    const recommendation = getContrastRecommendation(ratio)
    setContrastCheck({ ratio, ...recommendation })
  }, [colors.foreground, colors.background])

  // Apply live preview
  useEffect(() => {
    applyBrandingToDocument(academyId, {
      brandPrimary: data.brandPrimary || DEFAULT_COLORS.primary,
      brandSecondary: data.brandSecondary || DEFAULT_COLORS.secondary,
      brandAccent: data.brandAccent || DEFAULT_COLORS.accent,
      brandNeutral: data.brandNeutral || DEFAULT_COLORS.neutral,
      brandBackground: data.brandBackground || DEFAULT_COLORS.background,
      brandForeground: data.brandForeground || DEFAULT_COLORS.foreground,
      logoUrl: data.logoUrl,
      logoDarkUrl: data.logoDarkUrl,
      faviconUrl: data.faviconUrl,
      defaultThemeMode: data.defaultThemeMode || "system",
    })
  }, [
    academyId,
    data.brandPrimary,
    data.brandSecondary,
    data.brandAccent,
    data.brandNeutral,
    data.brandBackground,
    data.brandForeground,
    data.logoUrl,
    data.logoDarkUrl,
    data.faviconUrl,
    data.defaultThemeMode,
  ])

  const handleColorChange = (colorKey: keyof typeof colors, value: string) => {
    const updateKey = `brand${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}` as keyof OnboardingData
    onUpdate({ [updateKey]: value })
  }

  const handleFileUpload = async (file: File, type: "logo" | "logoDark" | "favicon") => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)
      formData.append("academyId", academyId)

      const response = await fetch("/api/upload/branding", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Error al subir archivo")

      const { url } = await response.json()

      const updateKey = type === "logo" ? "logoUrl" : type === "logoDark" ? "logoDarkUrl" : "faviconUrl"
      onUpdate({ [updateKey]: url })
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          El branding es obligatorio antes de continuar. Define al menos el color primario y sube un logo.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Colores de Marca</CardTitle>
            <CardDescription>Define la paleta de colores de tu academia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary">Color Primario *</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary"
                    type="color"
                    value={colors.primary}
                    onChange={(e) => handleColorChange("primary", e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={colors.primary}
                    onChange={(e) => handleColorChange("primary", e.target.value)}
                    placeholder="#0066cc"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary">Color Secundario</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary"
                    type="color"
                    value={colors.secondary}
                    onChange={(e) => handleColorChange("secondary", e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={colors.secondary}
                    onChange={(e) => handleColorChange("secondary", e.target.value)}
                    placeholder="#666666"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent">Color de Acento</Label>
                <div className="flex gap-2">
                  <Input
                    id="accent"
                    type="color"
                    value={colors.accent}
                    onChange={(e) => handleColorChange("accent", e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={colors.accent}
                    onChange={(e) => handleColorChange("accent", e.target.value)}
                    placeholder="#ff6b35"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neutral">Color Neutral</Label>
                <div className="flex gap-2">
                  <Input
                    id="neutral"
                    type="color"
                    value={colors.neutral}
                    onChange={(e) => handleColorChange("neutral", e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={colors.neutral}
                    onChange={(e) => handleColorChange("neutral", e.target.value)}
                    placeholder="#f5f5f5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">Fondo</Label>
                <div className="flex gap-2">
                  <Input
                    id="background"
                    type="color"
                    value={colors.background}
                    onChange={(e) => handleColorChange("background", e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={colors.background}
                    onChange={(e) => handleColorChange("background", e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="foreground">Texto</Label>
                <div className="flex gap-2">
                  <Input
                    id="foreground"
                    type="color"
                    value={colors.foreground}
                    onChange={(e) => handleColorChange("foreground", e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={colors.foreground}
                    onChange={(e) => handleColorChange("foreground", e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            {/* Contrast Check */}
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
                value={data.defaultThemeMode || "system"}
                onValueChange={(value) => onUpdate({ defaultThemeMode: value as "light" | "dark" | "system" })}
              >
                <SelectTrigger>
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

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Logos y Recursos</CardTitle>
            <CardDescription>Sube los logos y recursos visuales de tu academia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo Principal *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {data.logoUrl ? (
                  <div className="flex items-center gap-4">
                    <img src={data.logoUrl || "/placeholder.svg"} alt="Logo" className="h-12 w-auto" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      disabled={uploading}
                    >
                      Cambiar Logo
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Subiendo..." : "Subir Logo"}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">SVG, PNG recomendado. Máximo 2MB.</p>
                  </div>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "logo")
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo Oscuro (Opcional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {data.logoDarkUrl ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={data.logoDarkUrl || "/placeholder.svg"}
                      alt="Logo Oscuro"
                      className="h-12 w-auto bg-gray-900 p-2 rounded"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-dark-upload")?.click()}
                      disabled={uploading}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-dark-upload")?.click()}
                      disabled={uploading}
                    >
                      Subir Logo Oscuro
                    </Button>
                  </div>
                )}
                <input
                  id="logo-dark-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "logoDark")
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favicon (Opcional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {data.faviconUrl ? (
                  <div className="flex items-center gap-4">
                    <img src={data.faviconUrl || "/placeholder.svg"} alt="Favicon" className="h-8 w-8" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("favicon-upload")?.click()}
                      disabled={uploading}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("favicon-upload")?.click()}
                      disabled={uploading}
                    >
                      Subir Favicon
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">ICO, PNG 32x32px recomendado</p>
                  </div>
                )}
                <input
                  id="favicon-upload"
                  type="file"
                  accept="image/*,.ico"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, "favicon")
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
          <CardDescription>Así se verá tu academia con el branding aplicado</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="space-y-4 p-4 rounded-lg border"
            style={{
              backgroundColor: colors.background,
              color: colors.foreground,
              borderColor: colors.neutral,
            }}
          >
            {/* Header Preview */}
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              {data.logoUrl && <img src={data.logoUrl || "/placeholder.svg"} alt="Logo" className="h-8 w-auto" />}
              <div className="flex gap-2">
                <Button size="sm" style={{ backgroundColor: colors.accent, color: colors.background }}>
                  Botón de Acento
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    borderColor: colors.background,
                    color: colors.background,
                  }}
                >
                  Botón Secundario
                </Button>
              </div>
            </div>

            {/* Content Preview */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold" style={{ color: colors.primary }}>
                {data.academyName || "Tu Academia de Artes Marciales"}
              </h3>
              <p style={{ color: colors.foreground }}>
                Este es un ejemplo de cómo se verá el contenido con tu branding aplicado.
              </p>
              <div className="p-3 rounded" style={{ backgroundColor: colors.neutral }}>
                <p className="text-sm" style={{ color: colors.foreground }}>
                  Tarjeta de ejemplo con fondo neutral
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
