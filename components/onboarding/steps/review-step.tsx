"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, MapPin, CreditCard, Palette, Building } from "lucide-react"
import type { OnboardingData } from "../onboarding-wizard"

interface ReviewStepProps {
  data: OnboardingData
}

export function ReviewStep({ data }: ReviewStepProps) {
  const isComplete = (section: keyof OnboardingData, required: (keyof OnboardingData)[]) => {
    return required.every((field) => data[field])
  }

  const sections = [
    {
      title: "Datos de la Academia",
      icon: Building,
      complete: isComplete("academyName", ["academyName", "discipline"]),
      data: {
        Nombre: data.academyName,
        Disciplina: data.discipline,
        Teléfono: data.phone || "No especificado",
        Email: data.email || "No especificado",
        Dirección: data.mainBranchAddress || "No especificada",
      },
    },
    {
      title: "Branding",
      icon: Palette,
      complete: isComplete("brandPrimary", ["brandPrimary", "logoUrl"]),
      data: {
        "Color Primario": data.brandPrimary,
        "Logo Principal": data.logoUrl ? "Configurado" : "No configurado",
        "Logo Oscuro": data.logoDarkUrl ? "Configurado" : "No configurado",
        Favicon: data.faviconUrl ? "Configurado" : "No configurado",
        Tema: data.defaultThemeMode || "Sistema",
      },
    },
    {
      title: "Planes de Suscripción",
      icon: CreditCard,
      complete: (data.plans?.length || 0) > 0,
      data: {
        "Número de Planes": data.plans?.length || 0,
        "Planes Activos": data.plans?.filter((p) => p.isActive).length || 0,
        "Planes Configurados": data.plans?.map((p) => `${p.name} (${p.price} ${p.currency})`).join(", ") || "Ninguno",
      },
    },
  ]

  const completedSections = sections.filter((s) => s.complete).length
  const totalSections = sections.length
  const isAllComplete = completedSections === totalSections

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Revisión Final</h3>
        <p className="text-muted-foreground">Revisa la configuración antes de completar el proceso de onboarding</p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant={isAllComplete ? "default" : "secondary"}>
            {completedSections} de {totalSections} secciones completadas
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {sections.map((section, index) => {
          const Icon = section.icon
          return (
            <Card
              key={index}
              className={section.complete ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </div>
                  {section.complete ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Object.entries(section.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium text-muted-foreground">{key}:</span>
                      <span className="text-right">{value || "No configurado"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!isAllComplete && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Configuración Incompleta
            </CardTitle>
            <CardDescription>
              Algunas secciones requieren configuración adicional antes de completar el onboarding. Puedes volver a los
              pasos anteriores para completar la información faltante.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isAllComplete && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              ¡Configuración Completa!
            </CardTitle>
            <CardDescription>
              Tu academia está lista para comenzar. Al completar el onboarding, tendrás acceso completo a todas las
              funcionalidades de la plataforma.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
