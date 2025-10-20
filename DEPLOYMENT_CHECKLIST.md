# ✅ Checklist de Deployment a Producción

## 🚀 Opción Rápida (Script Automatizado)

```bash
cd webapp
./scripts/deploy.sh
```

El script hace todo automáticamente. Si falla algo, sigue el checklist manual abajo.

---

## 📋 Checklist Manual (Paso a Paso)

### Pre-Requisitos (Solo Primera Vez)

- [ ] **Cuenta de Vercel**: Crear en https://vercel.com
- [ ] **Base de Datos**: Crear PostgreSQL en Neon (https://neon.tech) o Supabase
- [ ] **Vercel CLI**: Instalar con `npm i -g vercel`
- [ ] **Git Repository**: Código subido a GitHub/GitLab/Bitbucket

---

### 1️⃣ Preparación Local (5 minutos)

```bash
cd webapp

# Limpiar caché
rm -rf .next node_modules/.cache

# Reinstalar dependencias limpias
npm ci

# Generar Prisma client
npx prisma generate

# Verificar build
npm run build
```

**Checkpoint**: Si el build falla, NO continuar. Resolver errores primero.

---

### 2️⃣ Base de Datos Producción (10 minutos)

#### Opción A: Neon (Recomendado)

1. Ir a https://neon.tech → "New Project"
2. Nombre: `academia-prod`
3. Copiar "Pooled connection string"
4. Aplicar migraciones:

```bash
# Configurar temporalmente en .env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Aplicar
npx prisma db push

# Verificar
npx prisma studio
```

**Checkpoint**: Verificar que las tablas se crearon correctamente.

---

### 3️⃣ Deployment a Vercel (5 minutos)

```bash
# Login (solo primera vez)
vercel login

# Deploy a producción
vercel --prod
```

**Checkpoint**: Copiar la URL del deployment (ej: `https://academia-xyz.vercel.app`)

---

### 4️⃣ Variables de Entorno (10 minutos)

Ir a: **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables**

#### Variables OBLIGATORIAS:

```env
# Database
DATABASE_URL=postgresql://...?sslmode=require

# NextAuth (GENERAR NUEVO SECRET)
NEXTAUTH_SECRET=<ejecutar: openssl rand -base64 32>
NEXTAUTH_URL=https://tu-app.vercel.app
NEXT_PUBLIC_BASE_URL=https://tu-app.vercel.app
```

#### Variables de Payment Providers (según lo que uses):

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxx

# Khipu
KHIPU_RECEIVER_ID=xxxxx
KHIPU_SECRET=xxxxx

# Webpay
WEBPAY_COMMERCE_CODE=xxxxx
WEBPAY_API_KEY=xxxxx

# Transferencias (info visible al alumno)
TRANSFER_BANK_NAME=Banco de Chile
TRANSFER_ACCOUNT=12345678
TRANSFER_RUT=12.345.678-9
TRANSFER_EMAIL=pagos@tuacademia.cl
```

**Después de agregar variables**: Click en "Redeploy" en Vercel

---

### 5️⃣ Verificación (5 minutos)

```bash
# Verificar que el sitio carga
curl -I https://tu-app.vercel.app

# Debe retornar: HTTP/2 200
```

#### Pruebas Manuales:

- [ ] Abrir `https://tu-app.vercel.app`
- [ ] Probar **Signup** → Crear cuenta nueva
- [ ] Probar **Login** → Iniciar sesión
- [ ] Verificar que **Dashboard** carga
- [ ] Probar **selección de plan** (sin pagar aún)
- [ ] Verificar que **no hay errores en consola** del navegador

---

### 6️⃣ Configuración de Dominio (Opcional, 10 minutos)

Si tienes dominio personalizado (ej: `tuacademia.cl`):

1. **Vercel**: Settings → Domains → Add Domain
2. **DNS**: Configurar en tu proveedor:
   ```
   CNAME @ cname.vercel-dns.com
   ```
3. **Actualizar variables**:
   ```env
   NEXTAUTH_URL=https://tuacademia.cl
   NEXT_PUBLIC_BASE_URL=https://tuacademia.cl
   ```
4. **Redeploy** en Vercel

---

## 🎯 Resumen Ejecutivo (Opción Express)

Si ya tienes todo configurado:

```bash
# 1. Build local
npm run build

# 2. Deploy
vercel --prod

# 3. Verificar
curl https://tu-app.vercel.app
```

**Tiempo total**: ~5 minutos

---

## ⚠️ Troubleshooting Rápido

### Error: "Database connection failed"

```bash
# Verificar connection string
echo $DATABASE_URL

# Debe tener: ?sslmode=require al final
```

**Solución**: Agregar `?sslmode=require` al final de `DATABASE_URL`

### Error: "NEXTAUTH_SECRET missing"

```bash
# Generar nuevo secret
openssl rand -base64 32

# Agregar en Vercel → Environment Variables
# Luego Redeploy
```

### Error: "Prisma Client not found"

**Solución**: Verificar que `package.json` tenga:
```json
"postinstall": "prisma generate"
```

### Error: Build timeout

**Solución**: Optimizar `devDependencies` en `package.json`

---

## 📞 Soporte

- **Documentación completa**: Ver `Documentacion/deployment-guide.md`
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs

---

## ✅ Checklist Final Pre-Launch

```markdown
### Código
- [ ] Build local exitoso
- [ ] Git committeado y pusheado
- [ ] No hay secrets hardcodeados

### Base de Datos
- [ ] Migraciones aplicadas
- [ ] Conexión funciona desde Vercel
- [ ] Backup creado

### Variables de Entorno
- [ ] DATABASE_URL configurado
- [ ] NEXTAUTH_SECRET único de producción
- [ ] URLs apuntando a dominio correcto
- [ ] Payment providers configurados

### Testing
- [ ] Signup funciona
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] No hay errores en consola

### Monitoreo
- [ ] Vercel Analytics activo
- [ ] Logs accesibles
- [ ] Alertas configuradas
```

---

## 🎉 ¡Listo!

Si todos los checks están ✅, tu aplicación está **LIVE EN PRODUCCIÓN** 🚀

**Última recomendación**: Monitorea los logs por las primeras 24 horas.

```bash
# Ver logs en tiempo real
vercel logs --follow
```
