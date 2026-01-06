'use client'

import type React from "react"
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, LogIn } from "lucide-react"
import AuthLayout from "@/components/auth/AuthLayout"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Cargar email guardado al montar el componente
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail')
    const savedRememberMe = localStorage.getItem('rememberMe')
    
    if (savedEmail && savedRememberMe === 'true') {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // No redirigir automáticamente para capturar errores
        callbackUrl: "/auth/post-signin",
      })

      if (result?.error) {
        // Mostrar el error específico del backend
        setError(result.error)
      } else if (result?.ok) {
        // Login exitoso - guardar preferencia "recordarme"
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email)
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberEmail')
          localStorage.removeItem('rememberMe')
        }
        // Redirigir manualmente
        window.location.href = result.url || "/auth/post-signin"
      }
    } catch (error: any) {
      setError(error?.message || "Error al iniciar sesión. Por favor intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Ingresa tus credenciales para acceder a tu cuenta"
      Icon={LogIn}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="font-medium">
            Correo Electronico
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-medium">
            Contrasena
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="•••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground">
              Recordarme
            </Label>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Olvidaste tu contrasena?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
              Iniciando sesion...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              Iniciar Sesion
            </>
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-card text-muted-foreground">No tienes cuenta?</span>
        </div>
      </div>

      <Button variant="outline" asChild className="w-full">
        <Link href="/auth/signup">Crear cuenta nueva</Link>
      </Button>

      <p className="text-center mt-6 text-xs text-muted-foreground">
        Al iniciar sesion, aceptas nuestros <Link href="/terms" className="text-primary hover:underline">Terminos de Servicio</Link> y <Link href="/privacy" className="text-primary hover:underline">Politica de Privacidad</Link>
      </p>
    </AuthLayout>
  )
}