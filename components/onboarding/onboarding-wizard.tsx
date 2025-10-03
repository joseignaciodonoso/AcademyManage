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
import { BranchesStep } from "./steps/branches-step"
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
    type: "MONTHLY" | "YEARLY"
    description?: string
    features: string[]
  }>
}

const STEPS = [
  { id: "odoo", title: "Conectar Odoo", required: false },
  { id: "academy", title: "Datos de la Academia", required: true },
  { id: "branding", title: "Branding", required: true },
  { id: "branches", title: "Sedes", required: true },
  { id: "plans", title: "Planes", required: true },
  { id: "review", title: "Revisión Final", required: true },
]

interface OnboardingWizardProps {
  academyId: string
  onComplete: () => void
}

export function OnboardingWizard({ academyId, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

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
        return !!(data.academyName && data.discipline)
      case "branding":
        return !!(data.brandPrimary && data.logoUrl)
      case "branches":
        return !!(data.branches && data.branches.length > 0)
      case "plans":
        return !!(data.plans && data.plans.length > 0)
      default:
        return true
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

      onComplete()
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
        return <AcademyDataStep data={data} onUpdate={updateData} />
      case "branding":
        return <BrandingStep data={data} onUpdate={updateData} academyId={academyId} />
      case "branches":
        return <BranchesStep data={data} onUpdate={updateData} />
      case "plans":
        return <PlansStep data={data} onUpdate={updateData} />
      case "review":
        return <ReviewStep data={data} onUpdate={updateData} />
      default:
        return null
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuración Inicial</h1>
          <p className="text-muted-foreground mb-4">
            Configura tu academia paso a paso para comenzar a usar la plataforma
          </p>
          <Progress value={progress} className="w-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pasos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      index === currentStep
                        ? "bg-primary text-primary-foreground"
                        : completedSteps.has(index)
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "text-muted-foreground"
                    }`}
                  >
                    {completedSteps.has(index) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : step.required ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-current" />
                    )}
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{STEPS[currentStep].title}</CardTitle>
                <CardDescription>
                  Paso {currentStep + 1} de {STEPS.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {renderStep()}

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                    Anterior
                  </Button>

                  {currentStep === STEPS.length - 1 ? (
                    <Button onClick={handleComplete} disabled={loading}>
                      {loading ? "Completando..." : "Completar Configuración"}
                    </Button>
                  ) : (
                    <Button onClick={handleNext} disabled={!canProceed(currentStep)}>
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
