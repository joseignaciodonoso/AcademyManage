#!/bin/bash

# Script para desplegar cambios de base de datos a Neon
# Uso: ./scripts/deploy-to-neon.sh

set -e

echo "🚀 Desplegando cambios de base de datos a Neon..."

# Cargar variables de entorno desde .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Verificar que Prisma puede conectarse (mejor que verificar la variable directamente)
echo "🔍 Verificando conexión a la base de datos..."
if ! npx prisma db pull --print > /dev/null 2>&1; then
    echo "❌ Error: No se puede conectar a la base de datos"
    echo "   Verifica que la variable DATABASE_URL esté configurada correctamente en .env"
    echo "   Ejemplo: DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require"
    exit 1
fi

echo "✅ Conexión a la base de datos exitosa"

echo "📋 Verificando estado de migraciones..."
npx prisma migrate status

echo "🔄 Aplicando migraciones pendientes..."
npx prisma migrate deploy

echo "🔧 Generando cliente de Prisma..."
npx prisma generate

echo "📊 Verificando conexión a la base de datos..."
npx prisma db pull --print

echo "✅ ¡Despliegue completado exitosamente!"
echo "📝 Migraciones aplicadas:"
echo "   - 20250929034122_content_admin_models"
echo "   - 20251001050139_add_payment_method"
echo "   - 20251008152505_recurring_schedules"
echo "   - 20251020204348_add_club_management_models"
echo "   - 20251024163934_add_tournaments_and_training_schedules"
