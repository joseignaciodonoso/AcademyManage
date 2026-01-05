# 🚀 Configuración de Variables de Entorno en Netlify

## ⚠️ Problema Actual
El login en producción (`https://globaljiujitsununoa.netlify.app`) está fallando porque las variables de entorno no están configuradas correctamente en Netlify.

---

## 📋 Variables REQUERIDAS (Mínimas para que funcione el login)

### 1. NextAuth (Autenticación) - **CRÍTICAS**
```
NEXTAUTH_URL=https://globaljiujitsununoa.netlify.app
NEXT_PUBLIC_BASE_URL=https://globaljiujitsununoa.netlify.app
NEXTAUTH_SECRET=X9B8MFM6qq2zV/enY2/7sqMw1bZsd3/Kq1LdEBvSOuM=
```

### 2. Base de Datos Neon - **CRÍTICA**
```
DATABASE_URL=postgresql://neondb_owner:npg_4LZoHR5inPvd@ep-round-fire-ade9ecu4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 🔧 Cómo Configurar en Netlify (Paso a Paso)

### Método 1: Dashboard Web (Recomendado)

1. **Ir a Netlify Dashboard**
   - Abre: https://app.netlify.com
   - Inicia sesión con tu cuenta

2. **Seleccionar tu sitio**
   - Busca y selecciona: `globaljiujitsununoa`

3. **Ir a Environment Variables**
   - Click en **Site configuration** (menú lateral izquierdo)
   - Click en **Environment variables**

4. **Agregar cada variable**
   - Click en **Add a variable** o **Add environment variables**
   - Para cada variable:
     - **Key**: Nombre de la variable (ej: `NEXTAUTH_URL`)
     - **Values**: 
       - Scope: **All deploys** (o **Production** si prefieres)
       - Value: El valor correspondiente
     - Click **Create variable**

5. **Variables a agregar:**

   **Variable 1:**
   ```
   Key: NEXTAUTH_URL
   Value: https://globaljiujitsununoa.netlify.app
   Scope: All deploys
   ```

   **Variable 2:**
   ```
   Key: NEXT_PUBLIC_BASE_URL
   Value: https://globaljiujitsununoa.netlify.app
   Scope: All deploys
   ```

   **Variable 3:**
   ```
   Key: NEXTAUTH_SECRET
   Value: X9B8MFM6qq2zV/enY2/7sqMw1bZsd3/Kq1LdEBvSOuM=
   Scope: All deploys
   ```

   **Variable 4:**
   ```
   Key: DATABASE_URL
   Value: postgresql://neondb_owner:npg_4LZoHR5inPvd@ep-round-fire-ade9ecu4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   Scope: All deploys
   ```

6. **Redeploy el sitio**
   - Ve a **Deploys** (menú lateral)
   - Click en **Trigger deploy**
   - Selecciona **Deploy site**
   - Espera a que termine el deploy (2-5 minutos)

---

### Método 2: Netlify CLI (Alternativo)

Si prefieres usar la terminal:

```bash
# Ya instalado: netlify-cli

# Login (abrirá navegador para autenticar)
netlify login

# Link al sitio (si no está linkeado)
netlify link

# Agregar variables una por una
netlify env:set NEXTAUTH_URL "https://globaljiujitsununoa.netlify.app"
netlify env:set NEXT_PUBLIC_BASE_URL "https://globaljiujitsununoa.netlify.app"
netlify env:set NEXTAUTH_SECRET "X9B8MFM6qq2zV/enY2/7sqMw1bZsd3/Kq1LdEBvSOuM="
netlify env:set DATABASE_URL "postgresql://neondb_owner:npg_4LZoHR5inPvd@ep-round-fire-ade9ecu4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Verificar variables
netlify env:list

# Redeploy
netlify deploy --prod
```

---

## ✅ Verificación Post-Configuración

Después de configurar las variables y hacer redeploy:

1. **Espera a que termine el deploy** (verifica en Netlify → Deploys)

2. **Prueba el login:**
   - Abre: https://globaljiujitsununoa.netlify.app/auth/signin
   - Ingresa credenciales:
     - Email: `jidonoso@rest.cl`
     - Contraseña: `ctaptc1pn`
   - Deberías ser redirigido al dashboard

3. **Si funciona:** ✅ Todo listo!

4. **Si sigue fallando:**
   - Verifica que las variables estén en "All deploys" o "Production"
   - Verifica que el deploy haya terminado correctamente
   - Revisa los logs del deploy en Netlify

---

## 🔍 Cómo Verificar que las Variables Están Configuradas

### Desde Dashboard:
1. Netlify → Tu sitio → Site configuration → Environment variables
2. Deberías ver las 4 variables listadas

### Desde CLI:
```bash
netlify env:list
```

Deberías ver algo como:
```
┌─────────────────────────┬────────────────────────────────────────┐
│ Key                     │ Value                                  │
├─────────────────────────┼────────────────────────────────────────┤
│ NEXTAUTH_URL            │ https://globaljiujitsununoa.netlify... │
│ NEXT_PUBLIC_BASE_URL    │ https://globaljiujitsununoa.netlify... │
│ NEXTAUTH_SECRET         │ X9B8MFM6qq2zV/enY2/7sqMw1bZsd3/Kq1... │
│ DATABASE_URL            │ postgresql://neondb_owner:npg_4LZo... │
└─────────────────────────┴────────────────────────────────────────┘
```

---

## 📝 Variables Opcionales (para funcionalidades adicionales)

### Flow Payment Gateway
```
FLOW_API_KEY=4628F0C0-ADB7-4E66-BD2F-6D63ECL993ED
FLOW_SECRET_KEY=a74360c22d9b63c17d833cd2bc4b58baf26d5465
FLOW_SANDBOX_EMAIL=ignacio.donosos4@gmail.com
```

### Odoo Integration
```
ODOO_BASE_URL=http://localhost:8069
ODOO_DB=global
ODOO_USERNAME=api@academy.local
ODOO_PASSWORD=Qn4!vH7@pZ9#sL2^wT6%yK8*
ODOO_WEBHOOK_SHARED_SECRET=webhook-secret-super-seguro-2024
```

---

## 🐛 Troubleshooting

### Problema: Login redirige de vuelta a signin
**Causa:** `NEXTAUTH_URL` no configurado o apunta a localhost  
**Solución:** Verifica que `NEXTAUTH_URL=https://globaljiujitsununoa.netlify.app`

### Problema: Error "Invalid URL"
**Causa:** `NEXTAUTH_URL` mal formado  
**Solución:** Asegúrate de usar `https://` (no `http://`)

### Problema: Error de base de datos
**Causa:** `DATABASE_URL` no configurado  
**Solución:** Agrega la variable con la conexión a Neon

### Problema: Cambios no se reflejan
**Causa:** No se hizo redeploy  
**Solución:** Trigger deploy desde Netlify Dashboard

### Problema: Variables aparecen pero no funcionan
**Causa:** Scope incorrecto (ej: solo en "Branch deploys")  
**Solución:** Cambia scope a "All deploys" o "Production"

---

## 📌 Checklist Final

- [ ] Netlify CLI instalado (`npm install -g netlify-cli`)
- [ ] `NEXTAUTH_URL` configurado en Netlify
- [ ] `NEXT_PUBLIC_BASE_URL` configurado en Netlify
- [ ] `NEXTAUTH_SECRET` configurado en Netlify
- [ ] `DATABASE_URL` configurado en Netlify
- [ ] Todas las variables con scope "All deploys" o "Production"
- [ ] Redeploy realizado después de agregar variables
- [ ] Deploy completado exitosamente (sin errores)
- [ ] Login probado en https://globaljiujitsununoa.netlify.app/auth/signin
- [ ] Usuario `jidonoso@rest.cl` puede iniciar sesión

---

**⚠️ IMPORTANTE:** El archivo `.env` local es solo para desarrollo. Las variables de producción DEBEN configurarse en Netlify, no se leen del archivo `.env` en producción.
