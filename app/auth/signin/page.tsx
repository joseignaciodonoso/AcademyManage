'use client'

import type React from "react"
import { useState } from "react"
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
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/auth/post-signin",
      })

      if ((result as any)?.error) {
        setError("Credenciales inválidas")
      }
    } catch (error) {
      setError("Error al iniciar sesión")
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
            className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
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
              className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--foreground))]/60 hover:text-[hsl(var(--foreground))] transition-colors"
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
              className="rounded border-border bg-[hsl(var(--muted))]/50 text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]"
            />
            <Label htmlFor="remember" className="text-sm text-[hsl(var(--foreground))]/70">
              Recordarme
            </Label>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors"
          >
            Olvidaste tu contrasena?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full font-medium py-3 transition-all duration-300 transform hover:scale-105"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-[hsl(var(--foreground))]/30 border-t-[hsl(var(--foreground))] rounded-full animate-spin"></div>
              <span>Iniciando sesion...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <LogIn className="h-4 w-4" />
              <span>Iniciar Sesion</span>
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
            <span className="px-2 bg-transparent text-slate-400">No tienes cuenta?</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          asChild
          className="w-full transition-all duration-300"
        >
          <Link href="/auth/signup">
            Crear cuenta nueva
          </Link>
        </Button>
      </div>

      <div className="text-center mt-8">
        <p className="text-[hsl(var(--foreground))]/70 text-sm">
          Al iniciar sesion, aceptas nuestros <Link href="/terms" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors">Terminos de Servicio</Link> y <Link href="/privacy" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors">Politica de Privacidad</Link>
        </p>
      </div>
    </AuthLayout>
  )
}