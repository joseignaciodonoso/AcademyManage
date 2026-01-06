import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Users, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  BarChart3, 
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Trophy,
  Zap
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-purple-950/30 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              ApexLeap
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-slate-300 hover:text-white hover:bg-white/10">
              <Link href="/auth/signin">Iniciar Sesión</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0">
              <Link href="/auth/signup">Comenzar Gratis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 mb-8">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Plataforma #1 para Academias y Clubes</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Gestiona tu{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Academia o Club
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M1 5.5C47 2 153 2 199 5.5" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#3b82f6"/>
                    <stop offset="0.5" stopColor="#a855f7"/>
                    <stop offset="1" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <br />
            como un profesional
          </h1>
          
          <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Alumnos, pagos, entrenamientos, partidos y reportes en una sola plataforma. 
            Diseñado para academias de artes marciales, clubes deportivos y escuelas de formación.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0 shadow-lg shadow-purple-500/25">
              <Link href="/auth/signup" className="flex items-center gap-2">
                Comenzar Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10">
              <Link href="/auth/signin">
                Ver Demo
              </Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Configuración en 5 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Soporte en español</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Todo lo que necesitas,{" "}
              <span className="text-slate-400">nada que no</span>
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Herramientas diseñadas específicamente para academias y clubes deportivos
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Gestión de Alumnos",
                description: "Control completo de membresías, pagos y progreso de estudiantes y jugadores",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Calendar,
                title: "Calendario Inteligente",
                description: "Programa clases, entrenamientos y partidos con control de asistencia",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: CreditCard,
                title: "Pagos Integrados",
                description: "MercadoPago, Khipu, Flow y transferencias bancarias",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: BookOpen,
                title: "Contenido Educativo",
                description: "Biblioteca de vídeos y materiales organizados por nivel",
                color: "from-orange-500 to-red-500"
              },
              {
                icon: BarChart3,
                title: "Reportes y Métricas",
                description: "Dashboard con estadísticas en tiempo real de tu academia o club",
                color: "from-indigo-500 to-blue-500"
              },
              {
                icon: Shield,
                title: "Multi-sede y Roles",
                description: "Gestiona múltiples sedes con diferentes niveles de acceso",
                color: "from-slate-500 to-slate-400"
              }
            ].map((feature, i) => (
              <Card key={i} className="group bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-8 sm:p-12">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { value: "500+", label: "Organizaciones" },
                { value: "25K+", label: "Estudiantes" },
                { value: "98%", label: "Satisfacción" },
                { value: "24/7", label: "Soporte" }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-sm text-green-400 mb-6">
            <Zap className="w-4 h-4" />
            <span>Comienza gratis hoy</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            ¿Listo para transformar tu organización?
          </h2>
          <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto">
            Únete a cientos de academias y clubes que ya gestionan su negocio de forma profesional
          </p>
          <div className="mt-10">
            <Button size="lg" asChild className="h-14 px-10 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0 shadow-lg shadow-purple-500/25">
              <Link href="/auth/signup" className="flex items-center gap-2">
                Comenzar Ahora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">ApexLeap</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ApexLeap - Gestión integral para academias y clubes deportivos
          </p>
        </div>
      </footer>
    </div>
  )
}
