"use client"

import type React from "react"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import AuthLayout from "@/components/auth/AuthLayout"

export default function TenantSignupPage() {
  const params = useParams<{ orgSlug: string }>()
  const router = useRouter()
  const orgSlug = params?.orgSlug

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          selectedPlan: null,
          orgSlug: orgSlug,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Student registration successful:", data)
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log("🔄 Attempting auto-login...")
        const loginResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          orgSlug,
          redirect: false,
          callbackUrl: `/auth/post-signin?org=${orgSlug}`,
        })

        if (loginResult?.error) {
          setError(`Registro exitoso pero error al iniciar sesión: ${loginResult.error}`)
          setTimeout(() => {
            router.push(`/${orgSlug}/auth/signin`)
          }, 2000)
        } else if (loginResult?.ok) {
          window.location.href = loginResult.url || `/auth/post-signin?org=${orgSlug}`
        }
      } else {
        const data = await response.json()
        setError(data.error || "Error al crear la cuenta")
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error?.message || "Error al crear la cuenta. Por favor intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={`Únete a ${orgSlug}`}
      subtitle="Crea tu cuenta para comenzar tu entrenamiento"
      Icon={UserPlus}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name" className="font-medium">
            Nombre Completo
          </Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Juan Pérez"
            className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="font-medium">
            Correo Electrónico
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="tu@email.com"
            className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="font-medium">
            Teléfono
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+56 9 1234 5678"
            className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-medium">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="•••••••"
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
          <Label htmlFor="confirmPassword" className="font-medium">
            Confirmar Contraseña
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              placeholder="•••••••"
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
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-[hsl(var(--foreground))]/30 border-t-[hsl(var(--foreground))] rounded-full animate-spin"></div>
              <span>Creando cuenta...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Crear Cuenta</span>
            </div>
          )}
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
          <Link href={`/${orgSlug}/auth/signin`}>
            Iniciar Sesión
          </Link>
        </Button>
      </div>
    </AuthLayout>
  )
}
