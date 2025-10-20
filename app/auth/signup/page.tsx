"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Building2 } from "lucide-react"
import AuthLayout from "@/components/auth/AuthLayout"

export default function SignUpAcademyPage() {
  const [formData, setFormData] = useState({
    academyName: "",
    slug: "",
    discipline: "",
    adminName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Auto-generate slug from academy name
  const handleAcademyNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      academyName: name,
      slug: name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim()
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validations
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

    if (!formData.slug || formData.slug.length < 3) {
      setError("El identificador de la academia debe tener al menos 3 caracteres")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup-academy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          academyName: formData.academyName,
          slug: formData.slug,
          discipline: formData.discipline || "Artes Marciales",
          adminName: formData.adminName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Academy registration successful:", data)
        
        // Wait a moment for database consistency
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Auto-login as admin
        console.log("🔄 Attempting admin auto-login...")
        const loginResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        console.log("🔍 Admin auto-login result:", loginResult)

        if (loginResult?.ok) {
          console.log("✅ Admin auto-login successful")
          // Redirect to onboarding
          router.push("/admin/onboarding")
        } else {
          console.log("❌ Auto-login failed, redirecting to manual login")
          router.push("/auth/signin?message=Academia creada exitosamente. Por favor inicia sesión.")
        }
      } else {
        const data = await response.json()
        setError(data.error || "Error al crear la academia")
      }
    } catch (error) {
      console.error("Error creating academy:", error)
      setError("Error al crear la academia. Por favor intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crear Academia"
      subtitle="Registra tu academia y empieza a gestionar tus estudiantes"
      Icon={Building2}
    >
      <Card className="glass-effect border-border shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">Registro de Academia</CardTitle>
          <CardDescription className="text-[hsl(var(--foreground))]/70">
            Completa la información para crear tu academia deportiva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Academy Information */}
            <div className="space-y-4 border-b border-border pb-4">
              <h3 className="font-semibold text-lg">Información de la Academia</h3>
              
              <div className="space-y-2">
                <Label htmlFor="academyName" className="font-medium">Nombre de la Academia *</Label>
                <Input
                  id="academyName"
                  value={formData.academyName}
                  onChange={(e) => handleAcademyNameChange(e.target.value)}
                  required
                  placeholder="Academia de Jiu-Jitsu"
                  className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="font-medium">
                  Identificador Único (URL) *
                  <span className="text-xs text-muted-foreground ml-2">
                    tu-academia.com/<strong>{formData.slug || "tu-slug"}</strong>
                  </span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                  placeholder="academia-jiujitsu"
                  pattern="[a-z0-9-]+"
                  className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
                />
                <p className="text-xs text-muted-foreground">Solo letras minúsculas, números y guiones</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discipline" className="font-medium">Disciplina</Label>
                <Input
                  id="discipline"
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                  placeholder="Jiu-Jitsu Brasileño"
                  className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
                />
              </div>
            </div>

            {/* Admin User Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Datos del Administrador</h3>
              
              <div className="space-y-2">
                <Label htmlFor="adminName" className="font-medium">Nombre Completo *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  required
                  placeholder="Juan Pérez"
                  className="bg-[hsl(var(--muted))]/50 border-border placeholder:text-[hsl(var(--foreground))]/60 focus:border-[hsl(var(--primary))]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="admin@tuacademia.cl"
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
            </div>

            {/* Password Section */}
            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="font-semibold text-lg">Contraseña de Acceso</h3>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
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
                <Label htmlFor="confirmPassword" className="font-medium">Confirmar Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    placeholder="Repite la contraseña"
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
            </div>

            <Button
              type="submit"
              className="w-full font-medium py-3 transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-purple-600"
              disabled={loading}
            >
              {loading ? "Creando Academia..." : "🚀 Crear Mi Academia"}
            </Button>
          </form>

          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-slate-400">¿Ya tienes una academia registrada?</span>
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
