#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Financeiro PWA - Servidor Local${NC}"
echo ""

# Verificar se dist existe
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  Pasta 'dist' não encontrada. Compilando projeto...${NC}"
    npm run build
fi

# Obter IP local
IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
    IP="192.168.x.x"
fi

PORT=3000

echo -e "${GREEN}✅ Servidor iniciado!${NC}"
echo ""
echo -e "${BLUE}📱 Acesse em:${NC}"
echo -e "  Local:   ${GREEN}http://localhost:${PORT}${NC}"
echo -e "  Rede:    ${GREEN}http://${IP}:${PORT}${NC}"
echo ""
echo -e "${YELLOW}💡 Dica: Abra o link em outro dispositivo para instalar o app!${NC}"
echo ""

# Iniciar servidor
npx http-server dist -p $PORT -g
