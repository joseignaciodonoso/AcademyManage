"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get('plan')
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    // role is forced server-side to STUDENT; keep UI minimal
    selectedPlan: selectedPlan || "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const planNames = {
    "plan_monthly_basic": "Plan Básico ($25.000/mes)",
    "plan_monthly_premium": "Plan Premium ($45.000/mes)",
    "plan_yearly_master": "Plan Maestro ($480.000/año)"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          selectedPlan: formData.selectedPlan || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Registration successful:", data)
        
        // Wait a moment for database consistency
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Auto-login after successful registration
        console.log("🔄 Attempting auto-login...")
        const loginResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        console.log("🔍 Auto-login result:", loginResult)

        if (loginResult?.ok) {
          console.log("✅ Auto-login successful")
          // Public signup always lands on student app
          router.push("/app")
        } else {
          console.log("❌ Auto-login failed, redirecting to manual login")
          // If auto-login fails, redirect to login page
          router.push("/auth/signin?message=Cuenta creada exitosamente. Por favor inicia sesión.")
        }
      } else {
        const data = await response.json()
        setError(data.error || "Error al crear la cuenta")
      }
    } catch (error) {
      setError("Error al crear la cuenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Registro de Estudiante</CardTitle>
          <CardDescription>
            {selectedPlan
              ? `Completa tu registro para ${planNames[selectedPlan as keyof typeof planNames] || selectedPlan}`
              : "Crea tu cuenta de estudiante para acceder a la plataforma"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="juan@academia.cl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </div>

            {/* Admin/Academy creation removed from public signup */}

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
