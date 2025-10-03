# Academia Management Platform

## Descripción General

Plataforma SaaS completa para la gestión de academias de artes marciales con arquitectura multi-tenant, integración con Odoo para pagos, sistema de branding personalizable y control de acceso basado en roles.

## Características Principales

### 🏢 Multi-Tenant
- Soporte para múltiples academias en una sola instancia
- Branding personalizable por academia (colores, logos, temas)
- Aislamiento completo de datos entre academias

### 💳 Integración con Odoo
- Procesamiento de pagos 100% a través de Odoo
- Sincronización automática de planes, usuarios y suscripciones
- Webhooks para confirmación de pagos en tiempo real

### 👥 Sistema de Roles
- **SuperAdmin**: Gestión global de la plataforma
- **Academy Admin**: Administración completa de la academia
- **Coach**: Gestión de clases y estudiantes asignados
- **Student**: Acceso a contenido y gestión de suscripción
- **Guest**: Acceso limitado para visitantes

### 📊 Analytics y KPIs
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Tasa de abandono (Churn Rate)
- LTV (Lifetime Value)
- Métricas de asistencia y ocupación

### 📚 Gestión de Contenido
- Currículum estructurado por disciplinas
- Videos y materiales de entrenamiento
- Sistema de progresión por cinturones
- Evaluaciones y certificaciones

## Estructura del Proyecto

\`\`\`
├── app/                    # Next.js App Router
│   ├── admin/             # Panel de administración
│   ├── app/               # Portal de estudiantes
│   ├── auth/              # Autenticación
│   └── api/               # API endpoints
├── components/            # Componentes React
│   ├── admin/            # Componentes de admin
│   ├── student/          # Componentes de estudiantes
│   ├── onboarding/       # Wizard de configuración
│   └── ui/               # Componentes base (shadcn/ui)
├── lib/                  # Utilidades y configuración
│   ├── odoo/            # Integración con Odoo
│   ├── kpis/            # Cálculo de métricas
│   └── branding.ts      # Sistema de branding
├── prisma/              # Esquema de base de datos
├── scripts/             # Scripts de configuración
└── docs/                # Documentación
\`\`\`

## Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: PostgreSQL
- **Autenticación**: NextAuth.js
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **Integración**: Odoo (XML-RPC/JSON-RPC)
- **Deployment**: Vercel

## Enlaces de Documentación

- [Documentación Funcional](./functional-documentation.md)
- [Documentación Técnica](./technical-documentation.md)
- [Guía de Instalación](./installation-guide.md)
- [API Reference](./api-reference.md)
- [Integración con Odoo](./odoo-integration.md)
- [Guía de Desarrollo](./development-guide.md)
