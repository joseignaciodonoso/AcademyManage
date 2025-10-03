"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, CreditCard } from "lucide-react"
import type { OnboardingData } from "../onboarding-wizard"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  billingCycle: "monthly" | "yearly"
  features: string[]
  isActive: boolean
  trialDays?: number
}

interface PlansStepProps {
  data: OnboardingData
  onUpdate: (data: Partial<OnboardingData>) => void
}

export function PlansStep({ data, onUpdate }: PlansStepProps) {
  const plans = data.plans || []

  const addPlan = () => {
    const newPlan: Plan = {
      id: Date.now().toString(),
      name: "",
      description: "",
      price: 0,
      currency: "CLP",
      billingCycle: "monthly",
      features: [""],
      isActive: true,
    }
    onUpdate({ plans: [...plans, newPlan] })
  }

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    const updatedPlans = plans.map((plan) => (plan.id === id ? { ...plan, ...updates } : plan))
    onUpdate({ plans: updatedPlans })
  }

  const removePlan = (id: string) => {
    const updatedPlans = plans.filter((plan) => plan.id !== id)
    onUpdate({ plans: updatedPlans })
  }

  const addFeature = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (plan) {
      updatePlan(planId, { features: [...plan.features, ""] })
    }
  }

  const updateFeature = (planId: string, featureIndex: number, value: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (plan) {
      const updatedFeatures = [...plan.features]
      updatedFeatures[featureIndex] = value
      updatePlan(planId, { features: updatedFeatures })
    }
  }

  const removeFeature = (planId: string, featureIndex: number) => {
    const plan = plans.find((p) => p.id === planId)
    if (plan && plan.features.length > 1) {
      const updatedFeatures = plan.features.filter((_, index) => index !== featureIndex)
      updatePlan(planId, { features: updatedFeatures })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planes de Suscripción</h3>
          <p className="text-sm text-muted-foreground">Define los planes que ofrecerás a tus estudiantes</p>
        </div>
        <Button onClick={addPlan}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay planes configurados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crea al menos un plan de suscripción para tus estudiantes
            </p>
            <Button onClick={addPlan}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Plan {index + 1}
                    {plan.name && ` - ${plan.name}`}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={(checked) => updatePlan(plan.id, { isActive: checked })}
                      />
                      <Label className="text-sm">Activo</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlan(plan.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`plan-name-${plan.id}`}>Nombre del Plan *</Label>
                    <Input
                      id={`plan-name-${plan.id}`}
                      value={plan.name}
                      onChange={(e) => updatePlan(plan.id, { name: e.target.value })}
                      placeholder="Plan Básico, Plan Premium, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`plan-price-${plan.id}`}>Precio *</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`plan-price-${plan.id}`}
                        type="number"
                        value={plan.price}
                        onChange={(e) => updatePlan(plan.id, { price: Number.parseFloat(e.target.value) || 0 })}
                        placeholder="29990"
                        min="0"
                        step="0.01"
                        required
                      />
                      <Select value={plan.currency} onValueChange={(value) => updatePlan(plan.id, { currency: value })}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLP">CLP</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`plan-billing-${plan.id}`}>Ciclo de Facturación</Label>
                    <Select
                      value={plan.billingCycle}
                      onValueChange={(value) => updatePlan(plan.id, { billingCycle: value as "monthly" | "yearly" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`plan-trial-${plan.id}`}>Días de Prueba</Label>
                    <Input
                      id={`plan-trial-${plan.id}`}
                      type="number"
                      value={plan.trialDays || ""}
                      onChange={(e) => updatePlan(plan.id, { trialDays: Number.parseInt(e.target.value) || undefined })}
                      placeholder="7"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`plan-description-${plan.id}`}>Descripción</Label>
                  <Textarea
                    id={`plan-description-${plan.id}`}
                    value={plan.description}
                    onChange={(e) => updatePlan(plan.id, { description: e.target.value })}
                    placeholder="Describe las características de este plan..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Características del Plan</Label>
                    <Button variant="outline" size="sm" onClick={() => addFeature(plan.id)}>
                      <Plus className="mr-1 h-3 w-3" />
                      Agregar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(plan.id, featureIndex, e.target.value)}
                          placeholder="Ej: 8 clases por mes"
                        />
                        {plan.features.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeature(plan.id, featureIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {plans.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={addPlan}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Otro Plan
          </Button>
        </div>
      )}
    </div>
  )
}
