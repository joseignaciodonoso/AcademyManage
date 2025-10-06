"use client"

import { useState, useEffect } from "react"
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
      const response = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, academyId: academy.id }),
      })

      if (!response.ok) throw new Error("Error al guardar")

      toast({
        title: "Configuración guardada",
        description: "Los cambios de branding se han aplicado correctamente",
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
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToOriginal: true, academyId: academy.id }),
      })
      if (!res.ok) throw new Error("Error al restablecer")
      // Reload branding from server to reflect defaults
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
      toast({ title: "Restablecido", description: "Se restauró el look & feel original de la app." })
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

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-gray-800/50 text-gray-300 border border-gray-700/50">
          <TabsTrigger value="general" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">General</TabsTrigger>
          <TabsTrigger value="colors" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">Colores</TabsTrigger>
          <TabsTrigger value="logos" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">Logos</TabsTrigger>
          <TabsTrigger value="preview" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">Vista Previa</TabsTrigger>
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
