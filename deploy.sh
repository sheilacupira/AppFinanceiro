#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}💰 FINANCEIRO PWA - DEPLOY SCRIPT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar se a pasta dist existe
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  Pasta 'dist' não encontrada!${NC}"
    echo "Fazendo build primeiro..."
    npm run build
    echo ""
fi

# Obter IP local
IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

echo -e "${GREEN}✅ Build pronto para deploy!${NC}"
echo ""
echo -e "${BLUE}📊 Tamanho dos arquivos:${NC}"
du -sh dist/
echo ""

echo -e "${BLUE}🚀 Iniciando servidor...${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ FINANCEIRO PWA - SERVIDOR RODANDO${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📱 Acesse em:${NC}"
echo -e "  ${GREEN}Local:${NC}   http://localhost:3000"
echo -e "  ${GREEN}Rede:${NC}    http://$IP:3000"
echo ""
echo -e "${YELLOW}💡 Dica: Abra o link de Rede em outro dispositivo para instalar o app!${NC}"
echo ""
echo -e "${BLUE}Navegadores suportados:${NC}"
echo "  ✅ Chrome/Chromium"
echo "  ✅ Firefox"
echo "  ✅ Edge"
echo "  ✅ Safari (iOS/macOS)"
echo ""
echo -e "${BLUE}Pressione${NC} Ctrl+C ${BLUE}para parar o servidor${NC}"
echo ""

# Verificar se http-server está instalado
if ! command -v http-server &> /dev/null; then
    echo -e "${YELLOW}⚠️  http-server não encontrado. Instalando...${NC}"
    npm install -g http-server
    echo ""
fi

# Iniciar o servidor
http-server dist -p 3000 -c-1 -g
