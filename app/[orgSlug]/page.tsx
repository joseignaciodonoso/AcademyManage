import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Users, Calendar, ArrowRight, LogIn, UserPlus } from "lucide-react"

interface Props {
  params: { orgSlug: string }
}

export default async function OrgLandingPage({ params }: Props) {
  const { orgSlug } = params

  const academy = await prisma.academy.findUnique({
    where: { slug: orgSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      brandPrimary: true,
      type: true,
      discipline: true,
      sport: true,
      branches: {
        take: 1,
        select: {
          phone: true,
          email: true,
          address: true,
        }
      },
      _count: {
        select: {
          users: true,
          plans: true,
        }
      }
    }
  })

  if (!academy) {
    notFound()
  }

  const isClub = academy.type === "CLUB"
  const orgType = isClub ? "Club" : "Academia"
  const discipline = isClub ? academy.sport : academy.discipline
  const branch = academy.branches[0]
  const primaryColor = academy.brandPrimary || "#3b82f6"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {academy.logoUrl ? (
              <Image
                src={academy.logoUrl}
                alt={academy.name}
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {academy.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg text-slate-900 dark:text-white">{academy.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{orgType} de {discipline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${orgSlug}/login`}>
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </Button>
            </Link>
            <Link href={`/${orgSlug}/auth/signup`}>
              <Button size="sm" style={{ backgroundColor: primaryColor }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            {academy.logoUrl ? (
              <Image
                src={academy.logoUrl}
                alt={academy.name}
                width={120}
                height={120}
                className="rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div 
                className="w-28 h-28 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {academy.name.charAt(0)}
              </div>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Bienvenido a {academy.name}
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            {`${orgType} de ${discipline}. Únete a nuestra comunidad y alcanza tus metas.`}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`/${orgSlug}/auth/signup`}>
              <Button 
                size="lg" 
                className="text-lg px-8"
                style={{ backgroundColor: primaryColor }}
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href={`/${orgSlug}/login`}>
              <Button variant="outline" size="lg" className="text-lg px-8">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Trophy 
                  className="h-7 w-7" 
                  style={{ color: primaryColor }}
                />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">
                Entrena con los mejores
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Profesores certificados y programas de entrenamiento personalizados.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Users 
                  className="h-7 w-7" 
                  style={{ color: primaryColor }}
                />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">
                Comunidad activa
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Conecta con otros miembros y crece junto a una comunidad apasionada.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Calendar 
                  className="h-7 w-7" 
                  style={{ color: primaryColor }}
                />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">
                Horarios flexibles
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Múltiples horarios disponibles para que entrenes cuando puedas.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div 
          className="max-w-4xl mx-auto rounded-2xl p-8 md:p-12 text-center text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-lg opacity-90 mb-6">
            Regístrate hoy y comienza tu camino hacia la excelencia.
          </p>
          <Link href={`/${orgSlug}/auth/signup`}>
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Crear mi cuenta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 text-center text-slate-600 dark:text-slate-400">
          <p className="mb-2">{academy.name}</p>
          {branch?.address && <p className="text-sm">{branch.address}</p>}
          {branch?.email && <p className="text-sm">{branch.email}</p>}
          {branch?.phone && <p className="text-sm">{branch.phone}</p>}
          <p className="text-xs mt-4 opacity-60">
            Powered by ApexLeap
          </p>
        </div>
      </footer>
    </div>
  )
}
