# Gestión de Estudiantes - Documentación

## Funcionalidades Implementadas

### 1. Eliminar Estudiante
- **Ubicación UI**: `/admin/students` → Menú de acciones (⋮) → "Eliminar"
- **Endpoint**: `DELETE /api/admin/students/[id]`
- **Permisos**: Requiere `students:write` (SUPER_ADMIN o ACADEMY_ADMIN)
- **Validaciones**:
  - Verifica que el usuario sea un estudiante
  - ACADEMY_ADMIN solo puede eliminar estudiantes de su academia
  - Muestra diálogo de confirmación antes de eliminar
- **Efecto**: Elimina permanentemente al estudiante y sus datos relacionados (cascade)

### 2. Suspender/Activar Estudiante
- **Ubicación UI**: `/admin/students` → Menú de acciones (⋮) → "Suspender" o "Activar"
- **Endpoint**: `PATCH /api/admin/students/[id]`
- **Permisos**: Requiere `students:write` (SUPER_ADMIN o ACADEMY_ADMIN)
- **Estados disponibles**:
  - `ACTIVE`: Estudiante activo
  - `SUSPENDED`: Estudiante suspendido (no puede acceder)
  - `INACTIVE`: Estudiante inactivo
- **Uso**: Cambia entre ACTIVE ↔ SUSPENDED con un clic

### 3. Suspensión Automática por Pago Vencido

#### Job Automático
- **Archivo**: `lib/jobs/suspend-overdue-students.ts`
- **Lógica**:
  - Busca estudiantes ACTIVE con membresías ACTIVE
  - Verifica si `nextBillingDate` + 7 días ha pasado
  - Si no hay pago exitoso reciente, suspende al estudiante
  - Cambia estado a `SUSPENDED` tanto en User como en Membership
- **Logs**: Registra cada suspensión con días de retraso

#### Endpoint Cron
- **Ruta**: `POST /api/cron/suspend-overdue`
- **Seguridad**: Requiere header `Authorization: Bearer CRON_SECRET`
- **Métodos**:
  - `POST`: Ejecuta el job y suspende estudiantes
  - `GET`: Modo test (muestra cuántos se suspenderían sin ejecutar)

#### Configuración Automática (Vercel)
- **Archivo**: `vercel.json`
- **Schedule**: `0 2 * * *` (todos los días a las 2:00 AM)
- **Configuración**:
  ```json
  {
    "crons": [{
      "path": "/api/cron/suspend-overdue",
      "schedule": "0 2 * * *"
    }]
  }
  ```

#### Configuración Manual (Otros Hosts)
Si no usas Vercel, configura un cron job en tu servidor:

```bash
# Ejecutar diariamente a las 2:00 AM
0 2 * * * curl -X POST https://tu-dominio.com/api/cron/suspend-overdue \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

#### Variables de Entorno
Agrega a tu `.env` o `.env.local`:

```bash
# Secreto para proteger el endpoint de cron
CRON_SECRET=tu_secreto_aleatorio_seguro_aqui
```

**Generar un secreto seguro**:
```bash
# En terminal
openssl rand -base64 32
```

## Flujo de Suspensión Automática

1. **Día 0**: Fecha de pago (`nextBillingDate`)
2. **Días 1-7**: Período de gracia (estudiante sigue activo)
3. **Día 8+**: Job verifica:
   - ¿Hay pago exitoso después de `nextBillingDate`?
   - **NO** → Suspende automáticamente
   - **SÍ** → Mantiene activo

## Testing

### Probar Suspensión Manual
1. Inicia sesión como `academy_admin@example.com` (contraseña: `Admin123!`)
2. Ve a `/admin/students`
3. Click en menú (⋮) de un estudiante
4. Selecciona "Suspender"
5. Verifica que el estado cambie a "Suspendido"

### Probar Eliminación
1. Click en menú (⋮) de un estudiante
2. Selecciona "Eliminar"
3. Confirma en el diálogo
4. Verifica que el estudiante desaparezca de la lista

### Probar Job Automático (Local)
```bash
# Método 1: GET (modo test, no suspende)
curl http://localhost:3001/api/cron/suspend-overdue \
  -H "Authorization: Bearer tu_cron_secret"

# Método 2: POST (ejecuta suspensión real)
curl -X POST http://localhost:3001/api/cron/suspend-overdue \
  -H "Authorization: Bearer tu_cron_secret"
```

## Notificaciones (Pendiente)

El job tiene un placeholder para enviar emails:
```typescript
// TODO: Send notification email to student
// await sendSuspensionEmail(student.email, student.name)
```

Para implementar:
1. Instala un servicio de email (nodemailer, sendgrid, resend, etc.)
2. Crea función `sendSuspensionEmail()` en `lib/jobs/suspend-overdue-students.ts`
3. Descomenta la línea en el job

## Permisos RBAC

Los endpoints requieren el permiso `students:write`, que tienen:
- ✅ `SUPER_ADMIN`
- ✅ `ACADEMY_ADMIN`
- ❌ `COACH`
- ❌ `STUDENT`
- ❌ `FINANCE`

## Archivos Modificados/Creados

### UI
- `app/admin/students/page.tsx` - Agregados botones Eliminar/Suspender con dropdown menu

### API
- `app/api/admin/students/[id]/route.ts` - Endpoints DELETE y PATCH
- `app/api/cron/suspend-overdue/route.ts` - Endpoint para job automático

### Lógica de Negocio
- `lib/jobs/suspend-overdue-students.ts` - Job de suspensión automática

### Configuración
- `vercel.json` - Configuración de cron job para Vercel

## Próximos Pasos Sugeridos

1. **Notificaciones por Email**
   - Implementar envío de email al suspender
   - Email de recordatorio 3 días antes del vencimiento

2. **Dashboard de Pagos Vencidos**
   - Vista de estudiantes con pagos próximos a vencer
   - Alertas en el dashboard principal

3. **Reactivación Automática**
   - Job para reactivar estudiantes cuando paguen

4. **Historial de Suspensiones**
   - Registrar en tabla `AuditLog` cada suspensión/reactivación
   - Ver historial en perfil del estudiante

5. **Webhooks de Pago**
   - Integrar con pasarela de pago para actualizar automáticamente
