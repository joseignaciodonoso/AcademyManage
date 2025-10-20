# 🔐 GUÍA DE ACCESO MULTI-TENANT

**Sistema:** Academia Management Platform  
**Arquitectura:** Multi-tenant por slug de academia

---

## 🎯 CONCEPTO IMPORTANTE

El sistema es **multi-tenant**, esto significa:

- **Administradores globales** → Acceden por rutas sin slug
- **Usuarios de academia (alumnos, coaches)** → Acceden por rutas CON slug de academia

---

## 🔗 RUTAS DE ACCESO

### Para ADMINISTRADORES (SuperAdmin, Academy Admin)

```
Login:    http://localhost:3001/auth/signin
Signup:   http://localhost:3001/auth/register
Panel:    http://localhost:3001/admin/*
```

### Para ALUMNOS y COACHES

```
Login:    http://localhost:3001/{slug-academia}/signin
Signup:   http://localhost:3001/{slug-academia}/signup
Panel:    http://localhost:3001/app/*
```

**⚠️ IMPORTANTE:** Los alumnos DEBEN usar la ruta con el slug de su academia.

---

## 🏫 ACADEMIA ACTUAL

**Nombre:** Global Jiu JItsu  
**Slug:** `academia-demo`  
**ID:** `academy-demo-123`

### URLs Específicas

```
Login Alumnos:    http://localhost:3001/academia-demo/signin
Registro Alumnos: http://localhost:3001/academia-demo/signup
```

---

## 👤 CREDENCIALES DE ACCESO

### Alumno de Prueba

```
📧 Email:      svvillarp@gmail.com
🔑 Password:   Student123!
👤 Nombre:     Sofia Villar
🎓 Rol:        STUDENT
🏫 Academia:   Global Jiu JItsu
```

**URL de Login:**
```
http://localhost:3001/academia-demo/signin
```

### Pasos para Ingresar

1. **Abre el navegador** en `http://localhost:3001/academia-demo/signin`
2. **Ingresa las credenciales:**
   - Email: `svvillarp@gmail.com`
   - Password: `Student123!`
3. **Click en "Iniciar Sesión"**
4. **Serás redirigido** al dashboard del alumno (`/app`)

---

## 🔧 UTILIDADES

### Resetear Contraseña de un Alumno

Si necesitas cambiar la contraseña de otro alumno:

```bash
node scripts/reset-student-password.js
```

Este script:
- ✅ Busca el primer estudiante
- ✅ Establece contraseña: `Student123!`
- ✅ Muestra las credenciales y URL de acceso

### Ver Slug de la Academia

```bash
node scripts/get-academy-slug.js
```

### Listar Todos los Estudiantes

```bash
node scripts/test-student-data.js
```

---

## 📋 ESTRUCTURA DE RUTAS

```
webapp/app/
├── auth/                      # ❌ SOLO para admins
│   ├── signin/
│   └── register/
│
├── [orgSlug]/                 # ✅ Para usuarios de academia
│   ├── auth/
│   │   ├── signin/           # Login de alumnos/coaches
│   │   └── signup/           # Registro de alumnos
│   └── login/                # Componente compartido
│
├── app/                       # Dashboard de alumno
│   ├── page.tsx              # Dashboard principal
│   ├── billing/              # Pagos
│   ├── calendar/             # Calendario
│   └── profile/              # Perfil
│
└── admin/                     # Panel de administración
    ├── dashboard/
    ├── students/
    └── ...
```

---

## 🎨 FLUJO DE AUTENTICACIÓN

### Para Alumnos

```
1. Alumno visita: /academia-demo/signin
2. Ingresa email y password
3. NextAuth valida credenciales
4. Si role === 'STUDENT' → Redirige a /app
5. Dashboard carga datos del alumno
```

### Para Administradores

```
1. Admin visita: /auth/signin
2. Ingresa email y password
3. NextAuth valida credenciales
4. Si role === 'ACADEMY_ADMIN' → Redirige a /admin
5. Panel de admin carga
```

---

## 🔍 VERIFICACIÓN DE ACCESO

### Comprobar que el Login Funciona

```bash
# 1. Asegúrate de que el servidor esté corriendo
curl http://localhost:3001/api/debug/env

# 2. Visita la URL de login en el navegador
open http://localhost:3001/academia-demo/signin

# 3. Ingresa las credenciales mostradas arriba
```

### Comprobar Sesión Actual

```bash
# Si ya estás logueado, verifica tu sesión
curl http://localhost:3001/api/auth/session --cookie "tu-cookie"
```

---

## 🚨 PROBLEMAS COMUNES

### 1. "No autorizado" al intentar login

**Causa:** Intentando acceder a `/auth/signin` como alumno  
**Solución:** Usa `/academia-demo/signin` con el slug de la academia

### 2. "Credenciales inválidas"

**Causa:** Password incorrecta  
**Solución:** Ejecuta `node scripts/reset-student-password.js`

### 3. Redirige a página equivocada después del login

**Causa:** El rol del usuario no coincide con la ruta  
**Solución:** Verifica el rol en la base de datos:
```bash
npx prisma studio
# Busca el usuario y verifica campo 'role'
```

### 4. "Academia no encontrada"

**Causa:** El slug en la URL no existe  
**Solución:** Verifica el slug correcto con:
```bash
node scripts/get-academy-slug.js
```

---

## 🔄 CAMBIAR DE ACADEMIA

Si trabajas con múltiples academias:

1. **Obtén el slug de la academia deseada:**
```bash
node scripts/get-academy-slug.js
```

2. **Usa ese slug en la URL:**
```
http://localhost:3001/{nuevo-slug}/signin
```

---

## 📚 DATOS DE PRUEBA DISPONIBLES

Después del seeding, tienes:

- ✅ **19 estudiantes** (10 con datos de prueba completos)
- ✅ **212 clases** programadas
- ✅ **1,120 asistencias** históricas
- ✅ **Curriculum** con 27 técnicas
- ✅ **23 registros** de progreso

**Email de estudiantes de prueba:**
- `svvillarp@gmail.com` (principal, con password reseteada)
- Otros 18 estudiantes (usar reset-password.js para obtener acceso)

---

## 💡 RECOMENDACIONES

1. **Usa siempre el slug correcto** para usuarios de academia
2. **Mantén `/auth/*` solo para administradores**
3. **Resetea passwords** cuando sea necesario con el script
4. **Verifica el rol** del usuario antes de asignar rutas

---

## 🔐 SEGURIDAD

### Separación de Contextos

- ✅ **Admins globales:** Acceso a múltiples academias
- ✅ **Usuarios de academia:** Solo ven su academia
- ✅ **Aislamiento de datos:** Por `academyId`
- ✅ **RBAC implementado:** Permisos por rol

### Validaciones

- ✅ Sesión verificada en cada request
- ✅ Rol validado en rutas protegidas
- ✅ AcademyId validado en queries
- ✅ Passwords hasheadas con bcryptjs

---

**¿Necesitas ayuda?** Ejecuta los scripts de utilidad o revisa los logs del servidor.
