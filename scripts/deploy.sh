#!/bin/bash

# ===========================================
# Script de Deployment a Producción
# Academia Management Platform
# ===========================================

set -e  # Exit on error

echo "🚀 Iniciando proceso de deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Verificar que estamos en la rama correcta
echo -e "${YELLOW}📋 Paso 1: Verificando rama Git...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${RED}⚠️  No estás en la rama main/master. Rama actual: $CURRENT_BRANCH${NC}"
    read -p "¿Continuar de todas formas? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo -e "${GREEN}✅ Rama verificada: $CURRENT_BRANCH${NC}"
echo ""

# Step 2: Verificar cambios pendientes
echo -e "${YELLOW}📋 Paso 2: Verificando cambios pendientes...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear:${NC}"
    git status -s
    read -p "¿Commitear estos cambios? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Mensaje de commit: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
    else
        echo -e "${RED}Deployment cancelado. Commitea tus cambios primero.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ No hay cambios pendientes${NC}"
echo ""

# Step 3: Limpiar y reinstalar dependencias
echo -e "${YELLOW}📋 Paso 3: Limpiando caché y reinstalando dependencias...${NC}"
rm -rf .next node_modules/.cache
npm ci
echo -e "${GREEN}✅ Dependencias reinstaladas${NC}"
echo ""

# Step 4: Generar cliente Prisma
echo -e "${YELLOW}📋 Paso 4: Generando cliente Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Cliente Prisma generado${NC}"
echo ""

# Step 5: Build local para verificar
echo -e "${YELLOW}📋 Paso 5: Ejecutando build de prueba...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build exitoso${NC}"
else
    echo -e "${RED}❌ Build falló. Corrige los errores antes de deployar.${NC}"
    exit 1
fi
echo ""

# Step 6: Tests (si existen)
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo -e "${YELLOW}📋 Paso 6: Ejecutando tests...${NC}"
    npm test || {
        echo -e "${YELLOW}⚠️  Tests fallaron. ¿Continuar de todas formas? (y/n)${NC}"
        read -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
    echo -e "${GREEN}✅ Tests completados${NC}"
else
    echo -e "${YELLOW}⚠️  No se encontraron tests${NC}"
fi
echo ""

# Step 7: Push a Git
echo -e "${YELLOW}📋 Paso 7: Subiendo cambios a Git...${NC}"
git push origin $CURRENT_BRANCH
echo -e "${GREEN}✅ Cambios subidos a Git${NC}"
echo ""

# Step 8: Deploy a Vercel
echo -e "${YELLOW}📋 Paso 8: Deployando a Vercel...${NC}"
if command -v vercel &> /dev/null; then
    read -p "¿Deployar a producción? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel --prod
        echo -e "${GREEN}✅ Deployment a producción completado${NC}"
    else
        vercel
        echo -e "${GREEN}✅ Deployment a preview completado${NC}"
    fi
else
    echo -e "${RED}❌ Vercel CLI no está instalado${NC}"
    echo -e "${YELLOW}Instala con: npm i -g vercel${NC}"
    echo -e "${YELLOW}O haz el deployment manualmente desde https://vercel.com${NC}"
fi
echo ""

# Step 9: Verificar deployment
echo -e "${YELLOW}📋 Paso 9: Verificando deployment...${NC}"
read -p "URL de tu deployment (ej: https://tuapp.vercel.app): " DEPLOY_URL
if [ -n "$DEPLOY_URL" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL")
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Deployment verificado: $HTTP_CODE${NC}"
    else
        echo -e "${RED}⚠️  Deployment responde con código: $HTTP_CODE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Verificación manual omitida${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 DEPLOYMENT COMPLETADO 🎉        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos pasos recomendados:${NC}"
echo "   1. Verificar que el sitio cargue correctamente"
echo "   2. Probar login/signup"
echo "   3. Probar flujo de pagos"
echo "   4. Verificar logs en Vercel"
echo "   5. Monitorear por las próximas horas"
echo ""
echo -e "${GREEN}✅ ¡Listo para producción!${NC}"
