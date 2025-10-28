#!/bin/bash

# Script para verificar el estado de la base de datos
# Uso: ./scripts/check-db-status.sh

set -e

echo "🔍 Verificando estado de la base de datos..."

# Verificar conexión
echo "📡 Probando conexión..."
if npx prisma db pull --print > /dev/null 2>&1; then
    echo "✅ Conexión exitosa"
else
    echo "❌ Error de conexión"
    exit 1
fi

# Mostrar estado de migraciones
echo ""
echo "📋 Estado de migraciones:"
npx prisma migrate status

# Mostrar información de la base de datos
echo ""
echo "📊 Información de la base de datos:"
echo "   Base de datos: $(echo $DATABASE_URL | sed 's/.*@\([^/]*\)\/.*/\1/')"
echo "   Esquema: public"

# Contar tablas principales
echo ""
echo "📈 Estadísticas de tablas (si la DB existe):"
echo "   Ejecuta este comando para ver las tablas:"
echo "   npx prisma studio"
