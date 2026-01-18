"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, UserPlus, Mail, Phone, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react"

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
  const [academyName, setAcademyName] = useState("")

  // Fetch academy name for better UX
  useEffect(() => {
    if (orgSlug) {
      fetch(`/api/public/academy/${orgSlug}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.name) setAcademyName(data.name)
        })
        .catch(() => {})
    }
  }, [orgSlug])

  const displayName = academyName || orgSlug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

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

  // Password strength indicator
  const getPasswordStrength = () => {
    const pwd = formData.password
    if (!pwd) return { strength: 0, label: "", color: "" }
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    
    const labels = ["", "Débil", "Regular", "Buena", "Fuerte"]
    const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"]
    return { strength, label: labels[strength], color: colors[strength] }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Registro abierto
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Bienvenido a<br />
              <span className="text-blue-200">{displayName}</span>
            </h1>
            <p className="text-lg text-blue-100/80 max-w-md">
              Únete a nuestra comunidad y comienza tu camino hacia la excelencia deportiva.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span>Acceso a todas las clases y entrenamientos</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span>Seguimiento de tu progreso en tiempo real</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span>Comunidad de atletas comprometidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25 mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Únete a {displayName}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Crea tu cuenta para comenzar
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Crear cuenta
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Completa tus datos para registrarte
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nombre completo
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Juan Pérez"
                  className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Correo electrónico
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="tu@email.com"
                  className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Teléfono <span className="text-slate-400 font-normal">(opcional)</span>
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+56 9 1234 5678"
                  className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Contraseña
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10 pr-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength * 25}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{passwordStrength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  placeholder="Repite tu contraseña"
                  className="pl-10 pr-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8 && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Las contraseñas coinciden
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creando cuenta...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Crear cuenta</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">
                ¿Ya tienes cuenta?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Button
            variant="outline"
            asChild
            className="w-full h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium transition-all duration-200 text-slate-700 dark:text-slate-300"
          >
            <Link href={`/${orgSlug}/auth/signin`}>
              Iniciar sesión
            </Link>
          </Button>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-8">
            Al registrarte, aceptas nuestros{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Términos de servicio
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Política de privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
