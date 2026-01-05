# Verificación de Variables de Entorno en Netlify

## Variables Requeridas para Producción

Para que el login funcione correctamente en `https://globaljiujitsununoa.netlify.app`, necesitas configurar estas variables en Netlify:

### 1. Autenticación (NextAuth)
```
NEXTAUTH_URL=https://globaljiujitsununoa.netlify.app
NEXT_PUBLIC_BASE_URL=https://globaljiujitsununoa.netlify.app
NEXTAUTH_SECRET=X9B8MFM6qq2zV/enY2/7sqMw1bZsd3/Kq1LdEBvSOuM=
```

### 2. Base de Datos (Neon)
```
DATABASE_URL=postgresql://neondb_owner:npg_4LZoHR5inPvd@ep-round-fire-ade9ecu4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 3. Flow Payment Gateway (Opcional - solo si usas Flow)
```
FLOW_API_KEY=4628F0C0-ADB7-4E66-BD2F-6D63ECL993ED
FLOW_SECRET_KEY=a74360c22d9b63c17d833cd2bc4b58baf26d5465
FLOW_SANDBOX_EMAIL=ignacio.donosos4@gmail.com
```

### 4. Odoo Integration (Opcional - solo si usas Odoo)
```
ODOO_BASE_URL=http://localhost:8069
ODOO_DB=global
ODOO_USERNAME=api@academy.local
ODOO_PASSWORD=Qn4!vH7@pZ9#sL2^wT6%yK8*
ODOO_WEBHOOK_SHARED_SECRET=webhook-secret-super-seguro-2024
```

---

## Cómo Verificar Variables en Netlify

### Opción 1: Desde el Dashboard Web

1. Ve a https://app.netlify.com
2. Selecciona tu sitio: **globaljiujitsununoa**
3. Click en **Site configuration** (menú lateral)
4. Click en **Environment variables**
5. Verifica que estén todas las variables listadas arriba

### Opción 2: Usando Netlify CLI

Si tienes Netlify CLI instalado, puedes verificar con:

```bash
# Instalar Netlify CLI (si no lo tienes)
npm install -g netlify-cli

# Login
netlify login

# Ver variables de entorno
netlify env:list
```

---

## Pasos para Configurar Variables Faltantes

1. **Agregar variable individual:**
   - Dashboard → Site configuration → Environment variables
   - Click en **Add a variable**
   - Selecciona scope: **All deploys** (o el que necesites)
   - Ingresa **Key** y **Value**
   - Click **Create variable**

2. **Importar múltiples variables:**
   - Puedes usar Netlify CLI:
   ```bash
   netlify env:set NEXTAUTH_URL "https://globaljiujitsununoa.netlify.app"
   netlify env:set NEXT_PUBLIC_BASE_URL "https://globaljiujitsununoa.netlify.app"
   netlify env:set NEXTAUTH_SECRET "X9B8MFM6qq2zV/enY2/7sqMw1bZsd3/Kq1LdEBvSOuM="
   netlify env:set DATABASE_URL "postgresql://neondb_owner:npg_4LZoHR5inPvd@ep-round-fire-ade9ecu4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
   ```

3. **Redeploy después de cambiar variables:**
   - Netlify → Deploys → Trigger deploy → **Deploy site**
   - O desde CLI: `netlify deploy --prod`

---

## Verificación Post-Deploy

Después de configurar las variables y hacer redeploy:

1. Abre: https://globaljiujitsununoa.netlify.app/auth/signin
2. Intenta hacer login con:
   - Email: `jidonoso@rest.cl`
   - Contraseña: `ctaptc1pn`
3. Deberías ser redirigido a `/auth/post-signin` y luego al dashboard

---

## Troubleshooting

### Problema: Login redirige de vuelta a signin
**Causa:** `NEXTAUTH_URL` no está configurado o apunta a localhost
**Solución:** Verifica que `NEXTAUTH_URL=https://globaljiujitsununoa.netlify.app`

### Problema: Error de base de datos
**Causa:** `DATABASE_URL` no está configurado
**Solución:** Agrega la variable con la conexión a Neon

### Problema: Cambios no se reflejan
**Causa:** No se hizo redeploy después de cambiar variables
**Solución:** Trigger deploy desde Netlify Dashboard

---

## Checklist de Configuración

- [ ] `NEXTAUTH_URL` apunta a dominio de producción
- [ ] `NEXT_PUBLIC_BASE_URL` apunta a dominio de producción
- [ ] `NEXTAUTH_SECRET` está configurado
- [ ] `DATABASE_URL` apunta a Neon
- [ ] Variables de Flow configuradas (si usas pagos)
- [ ] Redeploy realizado después de cambios
- [ ] Login probado en producción

---

**Nota Importante:** El archivo `.env` local es solo para desarrollo. Las variables de producción deben configurarse directamente en Netlify.
