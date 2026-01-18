'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, Trophy, Users, TrendingUp } from 'lucide-react'

export default function TenantLoginPage() {
  const params = useParams<{ orgSlug: string }>()
  const orgSlug = params?.orgSlug

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [academyName, setAcademyName] = useState('')

  // Fetch academy name and load saved email
  useEffect(() => {
    if (orgSlug) {
      // Load saved email
      const savedEmail = localStorage.getItem(`rememberEmail_${orgSlug}`)
      const savedRememberMe = localStorage.getItem(`rememberMe_${orgSlug}`)
      if (savedEmail && savedRememberMe === 'true') {
        setEmail(savedEmail)
        setRememberMe(true)
      }

      // Fetch academy name
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
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: `/auth/post-signin?org=${orgSlug}`,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        if (rememberMe) {
          localStorage.setItem(`rememberEmail_${orgSlug}`, email)
          localStorage.setItem(`rememberMe_${orgSlug}`, 'true')
        } else {
          localStorage.removeItem(`rememberEmail_${orgSlug}`)
          localStorage.removeItem(`rememberMe_${orgSlug}`)
        }
        window.location.href = result.url || `/auth/post-signin?org=${orgSlug}`
      }
    } catch (error: any) {
      setError(error?.message || 'Error al iniciar sesión. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">ApexLeap</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Bienvenido a<br />
              <span className="text-blue-200">{displayName}</span>
            </h1>
            <p className="text-lg text-blue-100/80 max-w-md">
              Accede a tu cuenta para continuar tu entrenamiento y seguir tu progreso.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span>Gestiona tus clases y horarios</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span>Revisa tu progreso y estadísticas</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <span>Alcanza tus metas deportivas</span>
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
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Bienvenido a {displayName}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Ingresa tus credenciales
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Iniciar sesión
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
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
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Recordarme</span>
              </label>
              <Link
                href={`/${orgSlug}/forgot-password`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
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
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Iniciar sesión</span>
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
                ¿No tienes cuenta?
              </span>
            </div>
          </div>

          {/* Signup Link */}
          <Button
            variant="outline"
            asChild
            className="w-full h-12 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium transition-all duration-200 text-slate-700 dark:text-slate-300"
          >
            <Link href={`/${orgSlug}/auth/signup`}>
              Crear cuenta nueva
            </Link>
          </Button>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-8">
            Plataforma potenciada por{" "}
            <Link href="/" className="text-blue-600 hover:underline font-medium">
              ApexLeap
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
