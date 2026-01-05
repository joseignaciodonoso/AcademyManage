"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  CreditCard, 
  Calendar, 
  BookOpen, 
  Trophy,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  Shield
} from "lucide-react"

type Plan = {
  id: string
  name: string
  price: number
  currency: string
  type: string
  classesPerMonth: number | null
  unlimitedClasses: boolean | null
  description: string | null
}

type Props = {
  user: {
    id: string
    name: string
    email: string
  }
  academy: {
    id: string
    name: string
    logoUrl: string | null
    slug: string
  }
  plans: Plan[]
  prefix: string
}

export function StudentWelcome({ user, academy, plans, prefix }: Props) {
  const router = useRouter()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const formatCurrency = (amount: number, currency = "CLP") => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getRecommendedPlanId = () => {
    const unlimited = plans.find((p) => p.unlimitedClasses)
    if (unlimited) return unlimited.id
    const sorted = [...plans].sort((a, b) => b.price - a.price)
    return sorted[0]?.id
  }

  const recommendedPlanId = getRecommendedPlanId()

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId)
  }

  const handleContinue = () => {
    if (selectedPlanId) {
      router.push(`${prefix}/app/subscribe?planId=${selectedPlanId}`)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/20 via-[hsl(var(--accent))]/10 to-transparent" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-[hsl(var(--primary))] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-[hsl(var(--accent))] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        
        <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-8 text-center">
          {/* Academy Logo */}
          {academy.logoUrl && (
            <div className="mb-6 flex justify-center">
              <img 
                src={academy.logoUrl} 
                alt={academy.name} 
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          
          {/* Welcome Message */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 mb-6">
            <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span className="text-sm font-medium text-[hsl(var(--primary))]">Bienvenido a {academy.name}</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--foreground))]/70 bg-clip-text text-transparent">
              ¡Hola, {user.name || "Estudiante"}!
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-[hsl(var(--foreground))]/70 max-w-2xl mx-auto mb-8">
            Estás a un paso de acceder a todas las clases y contenido de la academia.
            Elige tu plan para comenzar tu entrenamiento.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[hsl(var(--background))]/50 backdrop-blur-sm border border-border/50">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm font-medium">Reserva Clases</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[hsl(var(--background))]/50 backdrop-blur-sm border border-border/50">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BookOpen className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-sm font-medium">Contenido</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[hsl(var(--background))]/50 backdrop-blur-sm border border-border/50">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Trophy className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm font-medium">Progreso</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[hsl(var(--background))]/50 backdrop-blur-sm border border-border/50">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Shield className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm font-medium">Certificados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Elige tu Plan</h2>
            <p className="text-[hsl(var(--foreground))]/60">
              Selecciona el plan que mejor se adapte a tus necesidades
            </p>
          </div>

          {plans.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <div className="p-4 rounded-full bg-[hsl(var(--muted))]/50 w-fit mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-[hsl(var(--foreground))]/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay planes disponibles</h3>
                <p className="text-[hsl(var(--foreground))]/60 max-w-md mx-auto">
                  Contacta a la academia para obtener información sobre los planes disponibles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id
                  const isRecommended = plan.id === recommendedPlanId

                  return (
                    <Card
                      key={plan.id}
                      className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl ${
                        isSelected
                          ? "border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/20 shadow-lg shadow-[hsl(var(--primary))]/10"
                          : "border-border hover:border-[hsl(var(--primary))]/50"
                      }`}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {isRecommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white border-0 shadow-lg">
                            <Star className="h-3 w-3 mr-1" />
                            Recomendado
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {plan.unlimitedClasses
                                ? "Acceso ilimitado"
                                : plan.classesPerMonth
                                ? `${plan.classesPerMonth} clases/mes`
                                : "Acceso básico"}
                            </CardDescription>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                              : "border-[hsl(var(--muted))]"
                          }`}>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">
                            {formatCurrency(plan.price, plan.currency)}
                          </span>
                          <span className="text-[hsl(var(--foreground))]/60 text-sm">
                            /{plan.type === "MONTHLY" ? "mes" : plan.type === "QUARTERLY" ? "trimestre" : "año"}
                          </span>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Acceso a todas las sedes</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Reserva de clases online</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Contenido exclusivo</span>
                          </div>
                          {plan.unlimitedClasses && (
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium text-yellow-600">Clases ilimitadas</span>
                            </div>
                          )}
                        </div>

                        {plan.description && (
                          <p className="text-xs text-[hsl(var(--foreground))]/50 pt-2 border-t border-border">
                            {plan.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px] bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] hover:opacity-90 transition-opacity"
                  disabled={!selectedPlanId}
                  onClick={handleContinue}
                >
                  Continuar con el pago
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-[hsl(var(--foreground))]/50">
                  Pago seguro · Cancela cuando quieras
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Methods Footer */}
      <div className="border-t border-border bg-[hsl(var(--muted))]/30 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-[hsl(var(--foreground))]/60 mb-4">Métodos de pago disponibles</p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--background))] border border-border">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">MercadoPago</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--background))] border border-border">
              <CreditCard className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Khipu</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--background))] border border-border">
              <CreditCard className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Flow</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--background))] border border-border">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">Transferencia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
