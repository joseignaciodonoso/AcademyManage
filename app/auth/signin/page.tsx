"use client"

import type React from "react"
import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Credenciales invalidas")
      } else {
        const session = await getSession()

        if (session?.user.role === "SUPER_ADMIN" || session?.user.role === "ACADEMY_ADMIN") {
          router.push("/admin/dashboard")
        } else if (session?.user.role === "COACH") {
          router.push("/coach/schedule")
        } else {
          router.push("/app")
        }
      }
    } catch (error) {
      setError("Error al iniciar sesion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between p-4 lg:px-8 backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🥋</span>
          <span className="text-xl font-bold text-white">AcademyPro</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild className="text-white hover:bg-white/20">
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
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <LogIn className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-slate-300">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-white">Iniciar Sesion</CardTitle>
              <CardDescription className="text-slate-300">
                Accede a tu dashboard personalizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Correo Electronico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">
                    Contrasena
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
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
                      className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/20"
                    />
                    <Label htmlFor="remember" className="text-sm text-slate-300">
                      Recordarme
                    </Label>
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Olvidaste tu contrasena?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 transition-all duration-300 transform hover:scale-105"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                  className="w-full border-white/20 text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Link href="/auth/signup">
                    Crear cuenta nueva
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <p className="text-slate-400 text-sm">
              Al iniciar sesion, aceptas nuestros{" "}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                Terminos de Servicio
              </Link>{" "}
              y{" "}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                Politica de Privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}