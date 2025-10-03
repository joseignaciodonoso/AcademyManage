# Guía de Instalación

## Requisitos Previos

### Software Requerido
- Node.js 18+ 
- PostgreSQL 14+
- Git
- Docker (opcional, para desarrollo local)

### Servicios Externos
- Instancia de Odoo 18+ (local o en la nube)
- Cuenta de Vercel (para deployment)
- Servicio de base de datos PostgreSQL (Supabase, Neon, o local)

## Instalación Local

### 1. Clonar el Repositorio

\`\`\`bash
git clone https://github.com/tu-usuario/academia-management.git
cd academia-management
\`\`\`

### 2. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### 3. Configurar Variables de Entorno

Crear archivo `.env.local`:

\`\`\`env
# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/academia_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-muy-seguro-aqui"

# Odoo Configuration
ODOO_BASE_URL="http://localhost:8069"
ODOO_DB="tu_base_datos_odoo"
ODOO_USERNAME="admin"
ODOO_PASSWORD="admin"
ODOO_CLIENT_ID="tu_client_id"
ODOO_CLIENT_SECRET="tu_client_secret"

# Payment URLs
PAYMENT_RETURN_SUCCESS_URL="http://localhost:3000/app/billing/success"
PAYMENT_RETURN_FAIL_URL="http://localhost:3000/app/billing/failed"

# Webhooks
ODOO_WEBHOOK_SHARED_SECRET="tu-webhook-secret-compartido"

# File Storage (opcional)
BLOB_READ_WRITE_TOKEN="tu-vercel-blob-token"
\`\`\`

### 4. Configurar Base de Datos

#### Opción A: PostgreSQL Local con Docker

\`\`\`bash
# Ejecutar PostgreSQL en Docker
docker run --name postgres-academia \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=academia_db \
  -p 5432:5432 -d postgres:15

# Verificar que esté corriendo
docker ps
\`\`\`

#### Opción B: Base de Datos en la Nube

1. Crear cuenta en [Supabase](https://supabase.com) o [Neon](https://neon.tech)
2. Crear nueva base de datos
3. Copiar la URL de conexión a `DATABASE_URL`

### 5. Configurar Prisma

\`\`\`bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma db push

# (Opcional) Poblar con datos de ejemplo
npx prisma db seed
\`\`\`

### 6. Configurar Odoo

#### Instalación Local de Odoo con Docker

\`\`\`bash
# Crear docker-compose.yml
version: '3.8'
services:
  odoo:
    image: odoo:18
    ports:
      - "8069:8069"
    environment:
      - HOST=db
      - USER=odoo
      - PASSWORD=odoo
    volumes:
      - odoo-data:/var/lib/odoo
    depends_on:
      - db
      
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=postgres
      - POSTGRES_USER=odoo
      - POSTGRES_PASSWORD=odoo
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  odoo-data:
  postgres-data:

# Ejecutar Odoo
docker-compose up -d
\`\`\`

#### Configuración de Odoo

1. Acceder a `http://localhost:8069`
2. Crear base de datos
3. Instalar módulos requeridos:
   - `sale` (Ventas)
   - `account` (Contabilidad)
   - `payment` (Pagos)
   - `website_sale` (E-commerce)

4. Crear usuario técnico para API:
   - Ir a Configuración > Usuarios
   - Crear usuario con permisos de administrador
   - Usar credenciales en `.env.local`

### 7. Ejecutar la Aplicación

\`\`\`bash
# Modo desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:3000
\`\`\`

## Deployment en Producción

### 1. Deployment en Vercel

\`\`\`bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Deploy
vercel --prod
\`\`\`

### 2. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, agregar todas las variables de entorno:

\`\`\`env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=...
ODOO_BASE_URL=https://tu-odoo.com
# ... resto de variables
\`\`\`

### 3. Configurar Base de Datos de Producción

#### Opción A: Supabase

1. Crear proyecto en Supabase
2. Obtener URL de conexión
3. Ejecutar migraciones:

\`\`\`bash
npx prisma db push --preview-feature
\`\`\`

#### Opción B: Neon

1. Crear base de datos en Neon
2. Configurar `DATABASE_URL`
3. Ejecutar migraciones

### 4. Configurar Odoo de Producción

1. Configurar instancia de Odoo en producción
2. Actualizar `ODOO_BASE_URL` en variables de entorno
3. Configurar webhooks apuntando a tu dominio de producción

## Verificación de Instalación

### 1. Verificar Conexión a Base de Datos

\`\`\`bash
npx prisma studio
# Debe abrir interfaz web en http://localhost:5555
\`\`\`

### 2. Verificar Conexión a Odoo

\`\`\`bash
curl -X GET http://localhost:3000/api/billing/odoo/acquirers
# Debe retornar lista de métodos de pago
\`\`\`

### 3. Verificar Autenticación

1. Ir a `http://localhost:3000/auth/signin`
2. Crear cuenta de prueba
3. Verificar que se puede acceder al dashboard

### 4. Verificar Webhooks

\`\`\`bash
# Probar webhook de Odoo
curl -X POST http://localhost:3000/api/odoo/payment \
  -H "Content-Type: application/json" \
  -H "X-Odoo-Signature: test-signature" \
  -d '{"event":"payment.confirmed","data":{"transaction_id":"test"}}'
\`\`\`

## Troubleshooting

### Error: "UserRole not found"

\`\`\`bash
# Regenerar cliente Prisma
npx prisma generate
npm run dev
\`\`\`

### Error: "Cannot connect to database"

1. Verificar que PostgreSQL esté corriendo
2. Verificar `DATABASE_URL` en `.env.local`
3. Verificar permisos de usuario de base de datos

### Error: "Odoo connection failed"

1. Verificar que Odoo esté accesible
2. Verificar credenciales en `.env.local`
3. Verificar que los módulos requeridos estén instalados

### Error: "NextAuth configuration error"

1. Verificar `NEXTAUTH_SECRET` esté configurado
2. Verificar `NEXTAUTH_URL` sea correcto
3. Limpiar cookies del navegador

## Scripts Útiles

\`\`\`bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción

# Base de datos
npx prisma studio    # Interfaz web de base de datos
npx prisma generate  # Generar cliente Prisma
npx prisma db push   # Aplicar cambios de esquema
npx prisma db seed   # Poblar con datos de ejemplo

# Linting y formato
npm run lint         # Ejecutar ESLint
npm run type-check   # Verificar tipos TypeScript
\`\`\`

## Configuración de Desarrollo

### VS Code Extensions Recomendadas

\`\`\`json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode"
  ]
}
\`\`\`

### Configuración de Prettier

\`\`\`json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
