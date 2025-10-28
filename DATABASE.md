# 🗄️ Gestión de Base de Datos

Esta guía explica cómo manejar las migraciones y despliegues de la base de datos para la webapp de academias.

## 📋 Configuración Inicial

### 1. Configurar Neon Database

1. Ve a [Neon Console](https://console.neon.tech/)
2. Crea un nuevo proyecto o usa uno existente
3. Copia la connection string desde el dashboard
4. Agrega la URL a tu archivo `.env`:

```bash
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

### 2. Variables de Entorno Requeridas

```bash
# Base de datos principal (Neon)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Opcional: Base de datos local para desarrollo
DATABASE_URL_LOCAL="postgresql://user:password@localhost:5432/webapp_academy"
```

## 🚀 Scripts Disponibles

### Scripts NPM

```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar cambios sin migración (desarrollo)
npm run db:push

# Crear nueva migración
npm run db:migrate

# Desplegar migraciones a producción
npm run db:deploy

# Ver estado de migraciones
npm run db:status

# Abrir Prisma Studio
npm run db:studio

# Reset completo de la base de datos
npm run db:reset

# Desplegar a Neon (script personalizado)
npm run deploy:neon

# Verificar estado de la base de datos
npm run check:db
```

### Scripts Shell

```bash
# Desplegar a Neon
./scripts/deploy-to-neon.sh

# Verificar estado de la DB
./scripts/check-db-status.sh
```

## 📊 Migraciones Actuales

El proyecto incluye las siguientes migraciones:

1. **20250929034122_content_admin_models** - Modelos de contenido y administración
2. **20251001050139_add_payment_method** - Sistema de métodos de pago
3. **20251008152505_recurring_schedules** - Horarios recurrentes
4. **20251020204348_add_club_management_models** - Gestión de clubes deportivos
5. **20251024163934_add_tournaments_and_training_schedules** - Torneos y entrenamientos

## 🔄 Flujo de Desarrollo

### Para Desarrollo Local

```bash
# 1. Hacer cambios en schema.prisma
# 2. Crear migración
npm run db:migrate

# 3. Aplicar cambios
npm run db:generate
```

### Para Producción (Neon)

```bash
# 1. Verificar estado actual
npm run check:db

# 2. Desplegar cambios
npm run deploy:neon

# 3. Verificar que se aplicaron correctamente
npm run db:status
```

## 🛠️ Comandos Útiles

### Verificar Conexión

```bash
npx prisma db pull --print
```

### Ver Schema Actual

```bash
npx prisma db pull
```

### Resetear Base de Datos (⚠️ CUIDADO)

```bash
npm run db:reset
```

### Seed de Datos Iniciales

```bash
npm run db:seed
```

## 🔍 Troubleshooting

### Error de Conexión

1. Verifica que la `DATABASE_URL` esté correcta
2. Asegúrate de que incluya `?sslmode=require`
3. Verifica que el usuario tenga permisos

### Migraciones Pendientes

```bash
# Ver qué migraciones faltan
npm run db:status

# Aplicar migraciones pendientes
npm run db:deploy
```

### Schema Out of Sync

```bash
# Generar una nueva migración basada en el schema actual
npx prisma migrate dev --name fix_schema_sync
```

## 📈 Monitoreo

### Prisma Studio

Para explorar los datos visualmente:

```bash
npm run db:studio
```

### Logs de Prisma

Para debug, habilita logs en tu código:

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

## 🔒 Seguridad

- ✅ Siempre usa `sslmode=require` para conexiones a Neon
- ✅ No commitees archivos `.env` con credenciales
- ✅ Usa variables de entorno diferentes para dev/prod
- ✅ Haz backups antes de migraciones importantes

## 📚 Recursos

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Neon Documentation](https://neon.tech/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
