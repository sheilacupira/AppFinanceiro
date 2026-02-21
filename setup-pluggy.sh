#!/bin/bash

echo "🔧 Configuração do Pluggy Open Finance"
echo "======================================"
echo ""

# Pedir credenciais
read -p "Cole o Client ID: " CLIENT_ID
read -p "Cole o Client Secret: " CLIENT_SECRET

# Criar arquivo .env.local
cat > .env.local << ENVEOF
# Pluggy API Credentials
VITE_PLUGGY_CLIENT_ID=$CLIENT_ID
VITE_PLUGGY_CLIENT_SECRET=$CLIENT_SECRET
ENVEOF

echo ""
echo "✅ Arquivo .env.local criado com sucesso!"
echo ""
echo "🔄 Reiniciando servidor..."
echo ""

# Parar servidor atual
pkill -f "node.*vite" 2>/dev/null
sleep 2

# Iniciar novamente
npm run dev &

echo ""
echo "✅ Servidor reiniciado!"
echo "📱 Abra http://localhost:8080 e vá em Configurações → Open Finance"
echo ""
