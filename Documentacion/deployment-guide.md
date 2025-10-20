# Guía Completa de Deployment a Producción

## 📋 Índice

1. [Pre-requisitos](#pre-requisitos)
2. [Preparación del Código](#preparación-del-código)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Deployment de la Webapp](#deployment-de-la-webapp)
5. [Configuración de Odoo](#configuración-de-odoo)
6. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
7. [Post-Deployment](#post-deployment)
8. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
9. [Rollback](#rollback)

---

## 🎯 Pre-requisitos

### Cuentas y Servicios Necesarios

- ✅ **Cuenta de Vercel** (hosting webapp) - https://vercel.com
- ✅ **Base de datos PostgreSQL en la nube**:
  - **Neon** (recomendado) - https://neon.tech
  - **Supabase** - https://supabase.com
  - **Railway** - https://railway.app
- ✅ **Servidor Odoo 18+** (producción)
- ✅ **Git repository** (GitHub, GitLab, Bitbucket)
- ✅ **Dominio personalizado** (opcional)

### Software Local

```bash
# Verificar versiones
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
git --version   # >= 2.0.0
```

---

## 🔧 Preparación del Código

### 1. **Actualizar Configuración de Producción**

#### a) Verificar `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Cambiar a false para producción
  },
  typescript: {
    ignoreBuildErrors: false, // Cambiar a false para producción
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Optimizaciones de producción
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
```

#### b) Verificar `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  }
}
```

### 2. **Limpiar y Validar el Código**

```bash
# Desde el directorio webapp/
cd webapp

# Limpiar caché
rm -rf .next node_modules/.cache

# Reinstalar dependencias
npm ci

# Generar cliente Prisma
npx prisma generate

# Verificar build local
npm run build

# Si el build es exitoso, continuar
```

### 3. **Commit y Push**

```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

---

## 💾 Configuración de Base de Datos

### Opción A: Neon (Recomendado)

#### 1. Crear Proyecto

1. Ir a https://neon.tech
2. Crear cuenta o iniciar sesión
3. Click en "New Project"
4. Configurar:
   - **Name**: `academia-management-prod`
   - **Region**: Elegir la más cercana a tus usuarios
   - **PostgreSQL version**: 15 o 16

#### 2. Obtener Connection String

```bash
# Copiar la "Pooled connection string"
# Ejemplo:
postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require
```

#### 3. Configurar Prisma

En tu `.env` local de prueba:

```env
DATABASE_URL="postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require"
```

#### 4. Aplicar Migraciones

```bash
# Desde webapp/
npx prisma db push

# Verificar con Prisma Studio
npx prisma studio
```

#### 5. (Opcional) Seed de Datos Iniciales

```bash
# Si necesitas datos de ejemplo
npx prisma db seed
```

---

## 🚀 Deployment de la Webapp

### Opción 1: Vercel (Recomendado)

#### A. Desde el CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm install -g vercel

# Login
vercel login

# Ir al directorio webapp
cd webapp

# Deploy a producción
vercel --prod
```

#### B. Desde la UI de Vercel

1. Ir a https://vercel.com/dashboard
2. Click en "Add New..." → "Project"
3. Importar tu repositorio Git
4. Configurar:
   - **Framework Preset**: Next.js
   - **Root Directory**: `webapp`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`

5. Click en "Deploy"

### Opción 2: Netlify

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Desde webapp/
cd webapp

# Deploy
netlify deploy --prod --dir=.next
```

### Opción 3: Railway

1. Ir a https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Seleccionar tu repositorio
4. Configurar:
   - **Root Directory**: `/webapp`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

---

## 🔐 Configuración de Variables de Entorno

### Variables Requeridas en Producción

#### En Vercel Dashboard → Project → Settings → Environment Variables

```env
# ==========================================
# DATABASE
# ==========================================
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# ==========================================
# NEXTAUTH
# ==========================================
# Generar con: openssl rand -base64 32
NEXTAUTH_SECRET="tu-secret-super-seguro-de-32-caracteres-minimo"
NEXTAUTH_URL="https://tu-dominio.vercel.app"
NEXT_PUBLIC_BASE_URL="https://tu-dominio.vercel.app"

# ==========================================
# MERCADO PAGO (si usas)
# ==========================================
MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxx-xxxx-xxxx"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="APP_USR-xxxx-xxxx"

# ==========================================
# KHIPU (si usas)
# ==========================================
KHIPU_RECEIVER_ID="123456"
KHIPU_SECRET="tu-secret-khipu"

# ==========================================
# WEBPAY - TRANSBANK (si usas)
# ==========================================
WEBPAY_COMMERCE_CODE="597012345678"
WEBPAY_API_KEY="tu-api-key-webpay"

# ==========================================
# TRANSFERENCIAS (info visible al alumno)
# ==========================================
TRANSFER_BANK_NAME="Banco de Chile"
TRANSFER_ACCOUNT="12345678"
TRANSFER_RUT="12.345.678-9"
TRANSFER_EMAIL="pagos@tuacademia.cl"

# ==========================================
# EMAILS (opcional - para notificaciones)
# ==========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-app-password"
SMTP_FROM="Academia <noreply@tuacademia.cl>"

# ==========================================
# ANALYTICS (opcional)
# ==========================================
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### ⚠️ Importante: Secrets de Producción

```bash
# Generar NEXTAUTH_SECRET único para producción
openssl rand -base64 32

# NUNCA usar los mismos secrets de desarrollo en producción
```

---

## 🏢 Configuración de Odoo (Producción)

### Si tienes Odoo en un servidor propio

#### 1. Actualizar URLs en Vercel

```env
# NO incluir estas variables si solo usas Mercado Pago/Khipu/Webpay
ODOO_BASE_URL="https://tu-odoo.com"
ODOO_DB="tu_database"
ODOO_USERNAME="api_user"
ODOO_PASSWORD="super-secret-password"
```

#### 2. Configurar Webhooks en Odoo

1. En Odoo, ir a **Configuración → Técnico → Webhooks**
2. Crear nuevo webhook:
   - **URL**: `https://tu-dominio.vercel.app/api/odoo/payment`
   - **Evento**: `payment.confirmed`
   - **Secret**: Generar un secret y guardarlo

3. Agregar a Vercel:

```env
ODOO_WEBHOOK_SHARED_SECRET="el-secret-del-webhook"
```

---

## 🎬 Post-Deployment

### 1. **Verificar el Deployment**

```bash
# Verificar que el sitio esté en línea
curl -I https://tu-dominio.vercel.app

# Debería retornar 200 OK
```

### 2. **Probar Endpoints Críticos**

```bash
# Endpoint de health check (crear si no existe)
curl https://tu-dominio.vercel.app/api/health

# Endpoint de autenticación
curl https://tu-dominio.vercel.app/api/auth/signin
```

### 3. **Crear Usuario Administrador**

```bash
# Opción A: Desde Prisma Studio
npx prisma studio

# Opción B: Desde el signup con rol SUPER_ADMIN
# Modificar temporalmente el signup para permitir crear admin
```

### 4. **Configurar Dominio Personalizado** (Opcional)

#### En Vercel:

1. Dashboard → Project → Settings → Domains
2. Agregar dominio: `tuacademia.cl`
3. Configurar DNS:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

4. Actualizar `NEXTAUTH_URL`:

```env
NEXTAUTH_URL="https://tuacademia.cl"
NEXT_PUBLIC_BASE_URL="https://tuacademia.cl"
```

### 5. **Configurar Cron Jobs**

Vercel lee automáticamente `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/suspend-overdue",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 6. **Habilitar Analytics** (Opcional)

#### Vercel Analytics:

1. Dashboard → Project → Analytics → Enable
2. Incluir snippet en `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

---

## 📊 Monitoreo y Mantenimiento

### 1. **Logs en Tiempo Real**

```bash
# Ver logs en Vercel
vercel logs --follow

# O desde el dashboard:
# Vercel → Project → Logs
```

### 2. **Métricas Importantes**

Monitorear en Vercel Dashboard:

- ✅ **Build Time**: Debe ser < 5 minutos
- ✅ **Cold Start**: < 1 segundo
- ✅ **Response Time**: < 500ms (p95)
- ✅ **Error Rate**: < 1%

### 3. **Backups de Base de Datos**

#### Neon (Automático):

- Neon hace snapshots automáticos cada 24h
- Retención de 7 días en plan gratuito
- Retención de 30 días en planes pagos

#### Manual:

```bash
# Exportar toda la base de datos
pg_dump "postgresql://user:pass@host/db?sslmode=require" > backup_$(date +%Y%m%d).sql

# Restaurar
psql "postgresql://user:pass@host/db?sslmode=require" < backup_20250120.sql
```

### 4. **Alertas**

Configurar notificaciones en Vercel:

1. Settings → Notifications
2. Activar:
   - ✅ Deployment Failed
   - ✅ High Error Rate
   - ✅ Performance Degradation

---

## 🔄 Rollback (en caso de problemas)

### Opción 1: Rollback desde Vercel UI

1. Ir a **Deployments**
2. Encontrar el deployment anterior estable
3. Click en los 3 puntos → **Promote to Production**

### Opción 2: Rollback desde CLI

```bash
# Ver lista de deployments
vercel ls

# Promover un deployment específico
vercel promote <deployment-url>
```

### Opción 3: Rollback de Git

```bash
# Revertir al commit anterior
git revert HEAD
git push origin main

# Vercel auto-deployará el rollback
```

---

## ✅ Checklist Final Pre-Launch

```markdown
### Código
- [ ] Build local exitoso sin errores
- [ ] Tests pasando (si tienes)
- [ ] Linter sin warnings críticos
- [ ] TypeScript sin errores

### Base de Datos
- [ ] Migraciones aplicadas correctamente
- [ ] Backup inicial creado
- [ ] Conexión desde producción verificada

### Variables de Entorno
- [ ] Todas las variables configuradas en Vercel
- [ ] NEXTAUTH_SECRET único de producción
- [ ] URLs apuntando a dominio de producción
- [ ] Secrets de payment providers configurados

### Seguridad
- [ ] No hay secrets en el código
- [ ] NEXTAUTH_SECRET es diferente de dev
- [ ] CORS configurado correctamente
- [ ] Rate limiting activo

### Testing
- [ ] Signup funciona
- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] Payments flow funciona
- [ ] Emails se envían (si aplica)

### Monitoreo
- [ ] Logs accesibles
- [ ] Analytics configurado
- [ ] Alertas activadas
- [ ] Backups programados
```

---

## 🚨 Troubleshooting Común

### Error: "Database connection failed"

```bash
# Verificar connection string
echo $DATABASE_URL

# Probar conexión directa
psql "$DATABASE_URL" -c "SELECT 1;"
```

**Solución**: Verificar que la IP de Vercel esté en la whitelist de Neon/Supabase.

### Error: "NEXTAUTH_SECRET missing"

**Solución**: Agregar la variable en Vercel y re-deploy:

```bash
vercel env add NEXTAUTH_SECRET production
vercel --prod
```

### Error: "Prisma Client not generated"

```bash
# Asegurar que postinstall esté en package.json
"postinstall": "prisma generate"

# Re-deploy
vercel --prod --force
```

### Error: Build timeout

**Solución**: Optimizar dependencies en `package.json`:

```json
{
  "devDependencies": {
    // Mover packages grandes que solo se usan en dev
  }
}
```

### Error: "Payment provider not configured"

**Solución**: Verificar que las variables del provider estén configuradas:

```bash
# Ver todas las env vars
vercel env ls

# Agregar la faltante
vercel env add MERCADOPAGO_ACCESS_TOKEN production
```

---

## 📞 Soporte y Recursos

### Documentación Oficial

- **Vercel**: https://vercel.com/docs
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth.js**: https://next-auth.js.org

### Comunidades

- **Discord de Vercel**: https://vercel.com/discord
- **Stack Overflow**: Tag `nextjs` + `vercel`

---

## 🎉 ¡Listo para Producción!

Una vez completados todos los pasos, tu aplicación estará en producción y lista para recibir usuarios reales.

**Última recomendación**: Haz un soft-launch con usuarios beta antes del lanzamiento oficial para detectar cualquier issue en producción.

```bash
# Verificar que todo esté funcionando
curl https://tu-dominio.vercel.app/api/health
```

✅ **Si obtienes un 200 OK, ¡felicidades! Estás en producción.** 🚀
