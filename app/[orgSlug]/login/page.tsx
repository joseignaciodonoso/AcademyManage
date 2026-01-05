'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'

export default function TenantLoginPage() {
  const params = useParams<{ orgSlug: string }>()
  const router = useRouter()
  const orgSlug = params?.orgSlug

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Cargar email guardado al montar el componente
  useEffect(() => {
    const savedEmail = localStorage.getItem(`rememberEmail_${orgSlug}`)
    const savedRememberMe = localStorage.getItem(`rememberMe_${orgSlug}`)
    
    if (savedEmail && savedRememberMe === 'true') {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [orgSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        orgSlug,
        redirect: false, // No redirigir automáticamente para capturar errores
        callbackUrl: `/auth/post-signin?org=${orgSlug}`,
      })

      if (result?.error) {
        // Mostrar el error específico del backend
        setError(result.error)
      } else if (result?.ok) {
        // Login exitoso - guardar preferencia "recordarme"
        if (rememberMe) {
          localStorage.setItem(`rememberEmail_${orgSlug}`, email)
          localStorage.setItem(`rememberMe_${orgSlug}`, 'true')
        } else {
          localStorage.removeItem(`rememberEmail_${orgSlug}`)
          localStorage.removeItem(`rememberMe_${orgSlug}`)
        }
        // Redirigir manualmente
        window.location.href = result.url || `/auth/post-signin?org=${orgSlug}`
      }
    } catch (error: any) {
      setError(error?.message || 'Error al iniciar sesión. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={`Bienvenido a ${orgSlug}`}
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
            Correo Electrónico
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
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
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
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-border bg-[hsl(var(--muted))]/50 text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))]"
            />
            <Label htmlFor="remember" className="text-sm text-[hsl(var(--foreground))]/70">
              Recordarme
            </Label>
          </div>
          <Link
            href={`/${orgSlug}/forgot-password`}
            className="text-sm text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors"
          >
            ¿Olvidaste tu contraseña?
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
              <span>Iniciando sesión...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <LogIn className="h-4 w-4" />
              <span>Iniciar Sesión</span>
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
            <span className="px-2 bg-transparent text-slate-400">¿No tienes cuenta?</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          asChild
          className="w-full transition-all duration-300"
        >
          <Link href={`/${orgSlug}/signup`}>
            Crear cuenta nueva
          </Link>
        </Button>
      </div>
    </AuthLayout>
  )
}
