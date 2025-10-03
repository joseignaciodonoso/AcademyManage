import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, BookOpen, Shield, TrendingUp, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-4 lg:px-8 backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🥋</span>
          <span className="text-xl font-bold text-white">AcademyPro</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild className="text-white hover:bg-white/20">
            <Link href="/auth/signin">Iniciar Sesión</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Gestiona tu Academia de{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Artes Marciales
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 lg:text-xl">
            Plataforma completa para administrar alumnos, pagos, clases y contenido educativo. 
            Integración total con Odoo para gestión de pagos.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/auth/signup">
                🚀 Crear Academia
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="border-white/20 text-white hover:bg-white/10">
              <Link href="/auth/signin">
                Ver Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white lg:text-4xl">
              Todo lo que necesitas para tu academia
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Herramientas profesionales para gestionar cada aspecto de tu negocio
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Feature Card 1 */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Gestión de Alumnos</CardTitle>
                <CardDescription className="text-slate-300">
                  Administra membresías, pagos y progreso de tus estudiantes de forma intuitiva
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Control de suscripciones</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Seguimiento de pagos</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Progreso por cinturón</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Historial de asistencia</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature Card 2 */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Calendario de Clases</CardTitle>
                <CardDescription className="text-slate-300">
                  Programa y gestiona las clases de tu academia con herramientas avanzadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Horarios por sede</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Control de cupos</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Lista de espera</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Asistencia con QR</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature Card 3 */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Contenido Educativo</CardTitle>
                <CardDescription className="text-slate-300">
                  Biblioteca completa de vídeos y materiales de entrenamiento organizados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Vídeos por nivel</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Malla curricular</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Acceso por plan</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Progreso de estudiantes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white lg:text-4xl">500+</div>
              <div className="mt-2 text-sm text-slate-300">Academias Activas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white lg:text-4xl">25K+</div>
              <div className="mt-2 text-sm text-slate-300">Estudiantes Registrados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white lg:text-4xl">98%</div>
              <div className="mt-2 text-sm text-slate-300">Satisfacción del Cliente</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white lg:text-4xl">24/7</div>
              <div className="mt-2 text-sm text-slate-300">Soporte Técnico</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-slate-400">
            © 2024 AcademyPro - Gestión integral para academias de artes marciales
          </p>
        </div>
      </footer>
    </div>
  )
}
