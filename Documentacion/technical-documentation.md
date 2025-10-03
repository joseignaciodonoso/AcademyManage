# Documentación Técnica

## Arquitectura del Sistema

### Stack Tecnológico

\`\`\`
Frontend:
├── Next.js 14 (App Router)
├── React 18
├── TypeScript
├── Tailwind CSS v4
└── shadcn/ui + Radix UI

Backend:
├── Next.js API Routes
├── Prisma ORM
├── NextAuth.js
└── PostgreSQL

Integrations:
├── Odoo (XML-RPC/JSON-RPC)
├── Vercel Blob (File Storage)
└── Webhooks (HMAC Verification)
\`\`\`

### Arquitectura Multi-Tenant

\`\`\`typescript
// Modelo de datos multi-tenant
Academy {
  id: String
  slug: String (unique)
  branding: BrandingConfig
  users: User[]
  branches: Branch[]
  plans: Plan[]
}

// Aislamiento de datos por academia
middleware.ts -> Academy resolution by subdomain/slug
prisma queries -> WHERE academyId = currentAcademy.id
\`\`\`

## Esquema de Base de Datos

### Modelos Principales

\`\`\`prisma
model Academy {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  branding    Json?    // BrandingConfig
  isActive    Boolean  @default(true)
  
  // Relaciones
  users       User[]
  branches    Branch[]
  plans       Plan[]
  classes     Class[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  role        UserRole
  academyId   String
  
  // Relaciones
  academy     Academy  @relation(fields: [academyId], references: [id])
  memberships Membership[]
  enrollments Enrollment[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Plan {
  id          String   @id @default(cuid())
  name        String
  price       Decimal
  currency    String   @default("USD")
  interval    String   // monthly, yearly
  odooProductId Int?
  academyId   String
  
  // Relaciones
  academy     Academy  @relation(fields: [academyId], references: [id])
  memberships Membership[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Membership {
  id          String   @id @default(cuid())
  status      MembershipStatus
  startDate   DateTime
  endDate     DateTime?
  userId      String
  planId      String
  academyId   String
  
  // Relaciones
  user        User     @relation(fields: [userId], references: [id])
  plan        Plan     @relation(fields: [planId], references: [id])
  academy     Academy  @relation(fields: [academyId], references: [id])
  payments    Payment[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
\`\`\`

### Enums

\`\`\`typescript
enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN"
  ACADEMY_ADMIN = "ACADEMY_ADMIN"
  COACH = "COACH"
  STUDENT = "STUDENT"
  GUEST = "GUEST"
}

enum MembershipStatus {
  ACTIVE = "ACTIVE"
  INACTIVE = "INACTIVE"
  SUSPENDED = "SUSPENDED"
  CANCELLED = "CANCELLED"
}

enum PaymentStatus {
  PENDING = "PENDING"
  COMPLETED = "COMPLETED"
  FAILED = "FAILED"
  REFUNDED = "REFUNDED"
}
\`\`\`

## Sistema de Autenticación

### NextAuth.js Configuration

\`\`\`typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" }
      },
      authorize: async (credentials) => {
        // Validación con Prisma
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { academy: true }
        })
        
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            academyId: user.academyId
          }
        }
        return null
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role
        token.academyId = user.academyId
      }
      return token
    },
    session: ({ session, token }) => {
      session.user.role = token.role
      session.user.academyId = token.academyId
      return session
    }
  }
}
\`\`\`

### Middleware de Autorización

\`\`\`typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  // Rutas protegidas por rol
  const adminRoutes = ['/admin']
  const studentRoutes = ['/app']
  
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!token || !['ACADEMY_ADMIN', 'SUPER_ADMIN'].includes(token.role)) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }
  
  if (studentRoutes.some(route => pathname.startsWith(route))) {
    if (!token || token.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }
  
  return NextResponse.next()
}
\`\`\`

## Integración con Odoo

### Conector Odoo

\`\`\`typescript
// lib/odoo/connector.ts
export class OdooConnector {
  private baseUrl: string
  private db: string
  private username: string
  private password: string
  private uid: number | null = null

  async authenticate(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: this.db,
          login: this.username,
          password: this.password
        }
      })
    })
    
    const data = await response.json()
    this.uid = data.result?.uid
    return !!this.uid
  }

  async createPartner(userData: CreatePartnerData): Promise<number> {
    return this.call('res.partner', 'create', [userData])
  }

  async createSubscription(subscriptionData: CreateSubscriptionData): Promise<number> {
    return this.call('sale.subscription', 'create', [subscriptionData])
  }

  async createPaymentLink(amount: number, partnerId: number): Promise<string> {
    const paymentData = {
      amount,
      partner_id: partnerId,
      currency_id: 1, // USD
      reference: `ACADEMY-${Date.now()}`,
      return_url: process.env.PAYMENT_RETURN_SUCCESS_URL,
      cancel_url: process.env.PAYMENT_RETURN_FAIL_URL
    }
    
    const linkId = await this.call('payment.link', 'create', [paymentData])
    const link = await this.call('payment.link', 'read', [linkId, ['url']])
    return link[0].url
  }

  private async call(model: string, method: string, args: any[] = []): Promise<any> {
    const response = await fetch(`${this.baseUrl}/web/dataset/call_kw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model,
          method,
          args,
          kwargs: {}
        }
      })
    })
    
    const data = await response.json()
    return data.result
  }
}
\`\`\`

### Webhooks de Odoo

\`\`\`typescript
// app/api/odoo/payment/route.ts
export async function POST(request: Request) {
  const signature = request.headers.get('X-Odoo-Signature')
  const body = await request.text()
  
  // Verificar HMAC
  const expectedSignature = crypto
    .createHmac('sha256', process.env.ODOO_WEBHOOK_SHARED_SECRET!)
    .update(body)
    .digest('hex')
  
  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const payload = JSON.parse(body)
  
  if (payload.event === 'payment.confirmed') {
    await handlePaymentConfirmed(payload.data)
  }
  
  return NextResponse.json({ success: true })
}

async function handlePaymentConfirmed(data: PaymentData) {
  // Actualizar estado de membresía
  await prisma.payment.update({
    where: { odooTransactionId: data.transaction_id },
    data: { status: 'COMPLETED' }
  })
  
  // Activar membresía
  await prisma.membership.update({
    where: { id: data.membership_id },
    data: { status: 'ACTIVE' }
  })
}
\`\`\`

## Sistema de Branding

### Configuración Dinámica

\`\`\`typescript
// lib/branding.ts
export interface BrandingConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logo: string
  favicon: string
  fontFamily: string
  customCSS?: string
}

export function applyBranding(config: BrandingConfig) {
  const root = document.documentElement
  
  // Aplicar colores CSS custom properties
  root.style.setProperty('--primary', config.primaryColor)
  root.style.setProperty('--secondary', config.secondaryColor)
  root.style.setProperty('--accent', config.accentColor)
  
  // Aplicar logo
  const logoElements = document.querySelectorAll('[data-brand-logo]')
  logoElements.forEach(el => {
    (el as HTMLImageElement).src = config.logo
  })
  
  // Aplicar favicon
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
  if (favicon) favicon.href = config.favicon
}

export function validateContrast(color1: string, color2: string): boolean {
  // Implementar validación WCAG AA (4.5:1 ratio)
  const contrast = calculateContrast(color1, color2)
  return contrast >= 4.5
}
\`\`\`

## KPIs y Analytics

### Calculadora de Métricas

\`\`\`typescript
// lib/kpis/calculator.ts
export class KPICalculator {
  async calculateMRR(academyId: string): Promise<number> {
    const activeSubscriptions = await prisma.membership.findMany({
      where: {
        academyId,
        status: 'ACTIVE'
      },
      include: { plan: true }
    })
    
    return activeSubscriptions.reduce((total, membership) => {
      const monthlyRevenue = membership.plan.interval === 'yearly' 
        ? membership.plan.price.toNumber() / 12
        : membership.plan.price.toNumber()
      return total + monthlyRevenue
    }, 0)
  }

  async calculateARPU(academyId: string): Promise<number> {
    const mrr = await this.calculateMRR(academyId)
    const activeUsers = await prisma.membership.count({
      where: { academyId, status: 'ACTIVE' }
    })
    
    return activeUsers > 0 ? mrr / activeUsers : 0
  }

  async calculateChurnRate(academyId: string, period: 'monthly' | 'yearly' = 'monthly'): Promise<number> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - (period === 'yearly' ? 12 : 1))
    
    const startingUsers = await prisma.membership.count({
      where: {
        academyId,
        startDate: { lte: startDate },
        status: 'ACTIVE'
      }
    })
    
    const churnedUsers = await prisma.membership.count({
      where: {
        academyId,
        endDate: { gte: startDate, lte: endDate },
        status: 'CANCELLED'
      }
    })
    
    return startingUsers > 0 ? (churnedUsers / startingUsers) * 100 : 0
  }
}
\`\`\`

## Seguridad

### Validación de Datos

\`\`\`typescript
// lib/validations.ts
import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  role: z.enum(['ACADEMY_ADMIN', 'COACH', 'STUDENT']),
  academyId: z.string().cuid()
})

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  interval: z.enum(['monthly', 'yearly']),
  academyId: z.string().cuid()
})
\`\`\`

### Rate Limiting

\`\`\`typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true
})

export async function rateLimitMiddleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }
}
\`\`\`

## Performance

### Caching Strategy

\`\`\`typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache'

export const getCachedKPIs = unstable_cache(
  async (academyId: string) => {
    const calculator = new KPICalculator()
    return {
      mrr: await calculator.calculateMRR(academyId),
      arpu: await calculator.calculateARPU(academyId),
      churnRate: await calculator.calculateChurnRate(academyId)
    }
  },
  ['academy-kpis'],
  { revalidate: 3600 } // 1 hour
)
\`\`\`

### Database Optimization

\`\`\`sql
-- Índices para optimización
CREATE INDEX idx_user_academy_role ON "User"(academy_id, role);
CREATE INDEX idx_membership_status_academy ON "Membership"(status, academy_id);
CREATE INDEX idx_payment_status_created ON "Payment"(status, created_at);
CREATE INDEX idx_class_academy_date ON "Class"(academy_id, start_time);
