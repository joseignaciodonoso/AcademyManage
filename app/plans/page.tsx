"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Crown } from "lucide-react"

const fetchPlansFromOdoo = async () => {
  try {
    // Primero intentamos obtener planes desde la API local
    let response = await fetch("/api/plans")
    
    if (response.ok) {
      const data = await response.json()
      if (data.plans && data.plans.length > 0) {
        return data.plans
      }
    }
    
    // Si no hay planes locales, intentamos con la API de Odoo
    response = await fetch("/api/odoo/plans")
    if (response.ok) {
      const data = await response.json()
      return data.plans || []
    } else {
      // Fallback to static plans if both APIs fail
      return [
        {
          id: "plan_monthly_basic",
          name: "Plan Básico",
          description: "Perfecto para comenzar tu entrenamiento",
          price: 25000,
          currency: "CLP",
          type: "MONTHLY",
          features: [
            "2 clases por semana",
            "Acceso a contenido básico",
            "Soporte por email"
          ],
          icon: "⚡",
          popular: false,
          source: "local"
        },
        {
          id: "plan_monthly_premium", 
          name: "Plan Premium",
          description: "La opción más popular para entrenar",
          price: 45000,
          currency: "CLP", 
          type: "MONTHLY",
          features: [
            "Clases ilimitadas",
            "Acceso a todo el contenido",
            "Soporte prioritario",
            "Clases personalizadas"
          ],
          icon: "🚀",
          popular: true,
          source: "local"
        },
        {
          id: "plan_yearly_master",
          name: "Plan Maestro",
          description: "Para los más dedicados al entrenamiento",
          price: 480000,
          currency: "CLP",
          type: "YEARLY", 
          features: [
            "Todo del Plan Premium",
            "Descuento anual",
            "Sesiones 1:1 mensuales",
            "Acceso a seminarios exclusivos"
          ],
          icon: "👑",
          popular: false,
          source: "local"
        }
      ]
    }
  } catch (error) {
    console.error("Error fetching plans:", error)
    // Use fallback plans
    return []
  }
}

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadPlans = async () => {
      const plansData = await fetchPlansFromOdoo()
      setPlans(plansData)
      setLoading(false)
    }
    loadPlans()
  }, [])

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId)
    setLoading(true)

    try {
      // Redirigir a registro con el plan seleccionado
      router.push(`/auth/signup?plan=${planId}`)
    } catch (error) {
      console.error("Error selecting plan:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Elige tu Plan de Entrenamiento
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Selecciona el plan que mejor se adapte a tus objetivos y comienza tu viaje en las artes marciales
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-slate-300">Cargando planes disponibles...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-xl text-slate-300">No hay planes disponibles en este momento.</p>
              <Button variant="outline" className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          ) : plans.map((plan) => {
            const getIcon = (iconName: string) => {
              switch (iconName) {
                case "⚡":
                  return Zap
                case "🚀":
                  return Star
                case "👑":
                  return Crown
                default:
                  return Zap
              }
            }
            
            const IconComponent = getIcon(plan.icon || "⚡")
            
            return (
              <Card 
                key={plan.id}
                className={`relative bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-blue-500/50 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    Más Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-300">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center pb-6">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      ${plan.price.toLocaleString()}
                    </span>
                    <span className="text-slate-400 ml-2">/ {plan.type === "MONTHLY" ? "mes" : "año"}</span>
                  </div>

                  <ul className="space-y-3 text-left">
                    {plan.features ? (
                      plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center text-slate-300">
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))
                    ) : (
                      // Características predeterminadas basadas en el tipo de plan
                      <>
                        <li className="flex items-center text-slate-300">
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          {plan.type === "MONTHLY" ? "Acceso mensual" : "Acceso anual"}
                        </li>
                        {plan.unlimitedClasses && (
                          <li className="flex items-center text-slate-300">
                            <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                            Clases ilimitadas
                          </li>
                        )}
                        {plan.classesPerMonth && (
                          <li className="flex items-center text-slate-300">
                            <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                            {plan.classesPerMonth} clases por mes
                          </li>
                        )}
                        {plan.accessToContent && (
                          <li className="flex items-center text-slate-300">
                            <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                            Acceso a contenido exclusivo
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading && selectedPlan === plan.id}
                    className={`w-full transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {loading && selectedPlan === plan.id ? 'Procesando...' : 'Seleccionar Plan'}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <p className="text-slate-400 mb-4">
            ¿Tienes preguntas? Contáctanos para más información
          </p>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Contactar Soporte
          </Button>
        </div>
      </div>
    </div>
  )
}
