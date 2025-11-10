"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import { OdooConnectionStep } from "./steps/odoo-connection-step"
import { AcademyDataStep } from "./steps/academy-data-step"
import { BrandingStep } from "./steps/branding-step"
import { PlansStep } from "./steps/plans-step"
import { ReviewStep } from "./steps/review-step"

export interface OnboardingData {
  // Odoo Connection
  odooUrl?: string
  odooDb?: string
  odooClientId?: string
  odooClientSecret?: string
  odooUsername?: string
  odooPassword?: string

  // Academy Data
  academyName?: string
  discipline?: string
  mainBranchAddress?: string
  phone?: string
  email?: string
  operatingHours?: {
    [key: string]: { open: string; close: string } | null
  }

  // Branding
  brandPrimary?: string
  brandSecondary?: string
  brandAccent?: string
  brandNeutral?: string
  brandBackground?: string
  brandForeground?: string
  logoUrl?: string
  logoDarkUrl?: string
  faviconUrl?: string
  defaultThemeMode?: "light" | "dark" | "system"

  // Branches
  branches?: Array<{
    name: string
    address: string
    phone?: string
    email?: string
    operatingHours: { [key: string]: { open: string; close: string } | null }
  }>

  // Plans
  plans?: Array<{
    name: string
    price: number
    type?: "MONTHLY" | "YEARLY"
    billingCycle?: "monthly" | "yearly"
    description?: string
    features: string[]
  }>
}

const STEPS = [
  // { id: "odoo", title: "Conectar Odoo", required: false }, // HIDDEN: Odoo integration disabled for now
  { id: "academy", title: "Datos de la Academia", required: true },
  { id: "branding", title: "Branding", required: true },
  { id: "plans", title: "Planes", required: true },
  { id: "review", title: "Revisión Final", required: true },
]

interface OnboardingWizardProps {
  academyId: string
  organizationType?: "ACADEMY" | "CLUB" | "OTHER"
  onComplete?: () => void
}

export function OnboardingWizard({ academyId, organizationType = "ACADEMY", onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const isClub = organizationType === "CLUB"
  const entityLabel = isClub ? "Club" : "Academia"

  const updateData = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }))
  }

  const markStepComplete = (stepIndex: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepIndex]))
  }

  const canProceed = (stepIndex: number): boolean => {
    const step = STEPS[stepIndex]
    if (!step.required) return true
    switch (step.id) {
      case "academy":
        return !!(data.academyName?.trim() && data.discipline?.trim())
      case "branding":
        return true // optional: fallback to platform defaults if empty
      case "plans":
        return !!(data.plans && data.plans.length > 0)
      default:
        return true
    }
  }
  const missingFields = (stepIndex: number): string[] => {
    const step = STEPS[stepIndex]
    if (!step.required) return []
    switch (step.id) {
      case "academy": {
        const m: string[] = []
        if (!data.academyName?.trim()) m.push(isClub ? "Nombre del Club" : "Nombre de la Academia")
        if (!data.discipline?.trim()) m.push(isClub ? "Deporte Principal" : "Disciplina Principal")
        return m
      }
      case "branding": {
        return [] // branding fields are optional in onboarding
      }
      case "plans":
        return (data.plans && data.plans.length > 0) ? [] : ["Al menos 1 plan"]
      default:
        return []
    }
  }
  const handleNext = () => {
    if (canProceed(currentStep)) {
      markStepComplete(currentStep)
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academyId, data }),
      })

      if (!response.ok) {
        throw new Error("Error al completar la configuración")
      }

      onComplete?.()
      router.push("/admin/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    const step = STEPS[currentStep]

    switch (step.id) {
      case "odoo":
        return <OdooConnectionStep data={data} onUpdate={updateData} />
      case "academy":
        return <AcademyDataStep data={data} onUpdate={updateData} organizationType={organizationType} />
      case "branding":
        return <BrandingStep data={data} onUpdate={updateData} academyId={academyId} />
      // removed branches step UI
      // case "branches":
      //   return <BranchesStep data={data} onUpdate={updateData} />
      case "plans":
        return <PlansStep data={data} onUpdate={updateData} />
      case "review":
        return <ReviewStep data={data} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-bg opacity-20 absolute inset-0" />
        <div className="absolute top-10 -left-24 w-72 h-72 bg-[hsl(var(--primary,210_90%_56%))] rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float" />
        <div className="absolute bottom-5 -right-20 w-80 h-80 bg-[hsl(var(--accent,262_83%_58%))] rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--primary))] bg-clip-text text-transparent">Configuración Inicial</h1>
          <p className="text-[hsl(var(--foreground))]/70 mb-6 text-lg">
            Configura tu {entityLabel.toLowerCase()} paso a paso para comenzar a usar la plataforma
          </p>
          <Progress value={(completedSteps.size / STEPS.length) * 100} className="w-full h-3 bg-[hsl(var(--muted))]/50" indicatorClassName="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-effect rounded-2xl border-[hsl(var(--border))]/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/10 border-b border-[hsl(var(--border))]/30">
                <CardTitle className="text-lg font-semibold text-[hsl(var(--foreground))]">Pasos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      index === currentStep
                        ? "bg-gradient-to-r from-[hsl(var(--primary))]/30 to-[hsl(var(--accent))]/30 text-[hsl(var(--foreground))] shadow-lg border border-[hsl(var(--primary))]/40"
                        : completedSteps.has(index)
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30"
                          : "text-[hsl(var(--foreground))]/60 hover:bg-[hsl(var(--muted))]/30"
                    }`}
                  >
                    {completedSteps.has(index) ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : step.required ? (
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-current" />
                    )}
                    <span className="text-sm font-medium">{step.id === 'academy' ? `Datos del ${entityLabel}` : step.title}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="glass-effect rounded-2xl border-[hsl(var(--border))]/50 backdrop-blur-xl shadow-2xl">
              <CardHeader className="bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/10 border-b border-[hsl(var(--border))]/30">
                <CardTitle className="text-2xl font-bold text-[hsl(var(--foreground))]">{STEPS[currentStep].id === 'academy' ? `Datos del ${entityLabel}` : STEPS[currentStep].title}</CardTitle>
                <CardDescription className="text-[hsl(var(--foreground))]/60">
                  Paso {currentStep + 1} de {STEPS.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {renderStep()}

                {!canProceed(currentStep) && (
                  <div className="mt-4 text-sm text-[hsl(var(--foreground))]/70">
                    <span className="font-medium">Faltan campos:</span> {missingFields(currentStep).join(", ")}
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious} 
                    disabled={currentStep === 0}
                    className="border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 hover:border-[hsl(var(--primary))]/40 transition-all duration-200"
                  >
                    Anterior
                  </Button>

                  {currentStep === STEPS.length - 1 ? (
                    <Button 
                      onClick={handleComplete} 
                      disabled={loading}
                      className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                    >
                      {loading ? "Completando..." : "Completar Configuración"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNext} 
                      disabled={!canProceed(currentStep)}
                      className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                    >
                      Siguiente
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
