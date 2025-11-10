# Instrucciones de Deployment - Cuentas Bancarias

## Resumen de Cambios

Se han implementado las siguientes mejoras:

### 1. ✅ Error de Actualización de Estudiantes - CORREGIDO
- **Archivo**: `/app/api/admin/students/[id]/route.ts`
- **Problema**: Variable `academyFromTenant` no definida
- **Solución**: Reemplazada por `(session.user as any).academyId`

### 2. ✅ Sistema de Cuentas Bancarias - IMPLEMENTADO

#### Cambios en Base de Datos (Prisma Schema)
- Agregado modelo `BankAccount` con los campos:
  - `name`: Nombre de la cuenta
  - `bank`: Nombre del banco
  - `accountType`: Tipo de cuenta (CHECKING, SAVINGS, CREDIT, OTHER)
  - `accountNumber`: Número de cuenta (últimos 4 dígitos)
  - `currency`: Moneda (CLP por defecto)
  - `isActive`: Estado activo/inactivo
  
- Agregado campo `bankAccountId` al modelo `Payment`
- Agregada relación `bankAccounts` al modelo `Academy`

#### APIs Creadas
1. **GET/POST `/api/admin/bank-accounts`** - Listar y crear cuentas bancarias
2. **PUT/DELETE `/api/admin/bank-accounts/[id]`** - Actualizar y eliminar cuentas
3. **GET `/api/admin/bank-accounts/stats`** - Estadísticas de pagos por cuenta bancaria

#### Frontend Creado
1. **`/app/admin/settings/page.tsx`** - Página de configuración general con gestión de cuentas bancarias
2. **Actualizado `/app/admin/payments/page.tsx`** - Modal de registro de pagos ahora incluye selector de cuenta bancaria

## Pasos para Deployment

### 1. Generar y Aplicar Migración de Base de Datos

```bash
# Navegar al directorio de la webapp
cd /Users/joseignacio/Documents/Proyectos\ \ /Odoo_Nunoa/odoo18/webapp

# Generar migración
npx prisma migrate dev --name add_bank_accounts

# O para producción (sin preguntar por nombre)
npx prisma migrate deploy
```

### 2. Regenerar Cliente de Prisma

```bash
npx prisma generate
```

### 3. Verificar que la Base de Datos esté Activa

Asegúrate de que tu base de datos PostgreSQL esté corriendo y la conexión en `.env` sea correcta:

```
DATABASE_URL="postgresql://..."
```

### 4. Reiniciar el Servidor de Desarrollo

```bash
npm run dev
```

## Características Implementadas

### Para Administradores de Academia:

1. **Gestión de Cuentas Bancarias** (`/admin/settings`)
   - Crear nuevas cuentas bancarias
   - Editar cuentas existentes
   - Activar/desactivar cuentas
   - Eliminar cuentas (solo si no tienen pagos asociados)

2. **Registro de Pagos con Cuenta Bancaria** (`/admin/payments`)
   - Al registrar un pago manual, ahora puedes seleccionar a qué cuenta bancaria se depositó
   - Campo opcional - puedes dejar sin especificar

3. **Estadísticas por Cuenta Bancaria** (API preparada)
   - Endpoint `/api/admin/bank-accounts/stats`
   - Muestra total de pagos por cuenta
   - Agrupación mensual
   - Identifica pagos sin cuenta asignada

## Próximos Pasos Sugeridos

1. **Dashboard de Métricas Bancarias**: Agregar gráficos en el dashboard mostrando distribución de pagos por cuenta bancaria

2. **Exportación de Reportes**: Permitir exportar a Excel/CSV los pagos filtrados por cuenta bancaria

3. **Asignación Masiva**: Herramienta para asignar cuentas bancarias a pagos existentes sin cuenta

## Permisos

Los siguientes roles tienen acceso a las cuentas bancarias:
- **SUPER_ADMIN**: Acceso completo
- **ACADEMY_ADMIN**: Acceso completo dentro de su academia
- **FINANCE**: Solo lectura (visualización de estadísticas)

## Notas Importantes

⚠️ **Los errores de lint que ves actualmente son esperados** - Se resolverán automáticamente al ejecutar `npx prisma generate` después de aplicar la migración.

⚠️ **Backup de Base de Datos** - Aunque la migración es no destructiva (solo agrega tablas y campos), siempre es recomendable hacer un backup antes de aplicar migraciones en producción.

## Verificación Post-Deployment

1. ✅ Verificar que puedes acceder a `/admin/settings`
2. ✅ Crear una cuenta bancaria de prueba
3. ✅ Registrar un pago manual y asignarle la cuenta bancaria
4. ✅ Verificar que el pago aparece con la cuenta asignada
5. ✅ Probar la actualización de estudiantes (nombre, email, estado)

## Soporte

Si encuentras algún problema durante el deployment, verifica:
1. Logs del servidor Next.js
2. Logs de la base de datos PostgreSQL
3. Que todas las variables de entorno estén configuradas correctamente
