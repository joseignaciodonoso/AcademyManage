"use client"

import type React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ArrowLeft, LogIn } from "lucide-react"

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
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-20"></div>
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-[hsl(var(--accent))] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-[hsl(var(--primary))] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[hsl(var(--secondary))] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between p-4 lg:px-8 backdrop-blur-md bg-[hsl(var(--foreground))]/10 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🥋</span>
          <span className="text-xl font-bold">AcademyPro</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild className="hover:bg-[hsl(var(--muted))]/40">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al inicio</span>
            </Link>
          </Button>
        </div>
      </nav>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] rounded-2xl shadow-lg">
                <LogIn className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-[hsl(var(--foreground))]/70">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          <Card className="glass-effect border-border shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">Iniciar Sesion</CardTitle>
              <CardDescription className="text-[hsl(var(--foreground))]/70">
                Accede a tu dashboard personalizado
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
                      placeholder="••••••••"
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
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <p className="text-[hsl(var(--foreground))]/70 text-sm">
              Al iniciar sesion, aceptas nuestros{" "}
              <Link href="/terms" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors">
                Terminos de Servicio
              </Link>{" "}
              y{" "}
              <Link href="/privacy" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors">
                Politica de Privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}