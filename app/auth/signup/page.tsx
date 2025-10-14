"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import AuthLayout from "@/components/auth/AuthLayout"

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
    <AuthLayout
      title="Crear cuenta"
      subtitle="Regístrate para acceder a tu portal de estudiante"
      Icon={UserPlus}
    >
      <Card className="glass-effect border-border shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">Registro de Estudiante</CardTitle>
          <CardDescription className="text-[hsl(var(--foreground))]/70">
            {selectedPlan
              ? `Completa tu registro para ${planNames[selectedPlan as keyof typeof planNames] || selectedPlan}`
              : "Crea tu cuenta de estudiante para acceder a la plataforma"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">Nombre Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Juan Pérez"
                className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="juan@academia.cl"
                className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-medium">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+56 9 1234 5678"
                className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--foreground))]/60 hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-medium">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  placeholder="••••••••"
                  className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--foreground))]/60 hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-medium py-3 transition-all duration-300 transform hover:scale-105"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-slate-400">¿Ya tienes cuenta?</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              asChild
              className="w-full transition-all duration-300"
            >
              <Link href="/auth/signin">Iniciar Sesión</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <p className="text-[hsl(var(--foreground))]/70 text-sm">
          Al registrarte, aceptas nuestros <Link href="/terms" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors">Términos de Servicio</Link> y <Link href="/privacy" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors">Política de Privacidad</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
