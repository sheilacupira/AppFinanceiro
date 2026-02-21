#!/bin/bash

# Script de validação de configuração Stripe
# Verifica se todos os Price IDs estão configurados no .env

set -e

echo "🔍 Validando configuração Stripe..."
echo ""

# Verifica se o arquivo .env existe
if [ ! -f "server/.env" ]; then
  echo "❌ Arquivo server/.env não encontrado!"
  echo "   Execute: cd server && cp .env.example .env"
  exit 1
fi

# Carrega variáveis do .env
source server/.env 2>/dev/null || true

# Array de variáveis obrigatórias para Stripe
REQUIRED_VARS=(
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "STRIPE_PRICE_PRO_MONTHLY"
  "STRIPE_PRICE_PRO_YEARLY"
  "STRIPE_PRICE_ENTERPRISE_MONTHLY"
  "STRIPE_PRICE_ENTERPRISE_YEARLY"
)

MISSING_VARS=()
EMPTY_VARS=()

# Verifica cada variável
for VAR in "${REQUIRED_VARS[@]}"; do
  VALUE=$(eval echo \$$VAR)
  
  if [ -z "$VALUE" ]; then
    EMPTY_VARS+=("$VAR")
  else
    echo "✅ $VAR configurado"
  fi
done

echo ""

# Relatório
if [ ${#EMPTY_VARS[@]} -eq 0 ]; then
  echo "🎉 Todas as variáveis Stripe estão configuradas!"
  echo ""
  echo "📋 Validações adicionais:"
  
  # Verifica formato da Secret Key
  if [[ $STRIPE_SECRET_KEY == sk_test_* ]]; then
    echo "⚠️  Usando chave de TEST (sk_test_...)"
    echo "   Para produção, use sk_live_..."
  elif [[ $STRIPE_SECRET_KEY == sk_live_* ]]; then
    echo "✅ Usando chave de PRODUÇÃO (sk_live_...)"
  else
    echo "❌ Formato de STRIPE_SECRET_KEY inválido"
    echo "   Deve começar com sk_test_ ou sk_live_"
  fi
  
  # Verifica formato dos Price IDs
  PRICE_VARS=(
    "$STRIPE_PRICE_PRO_MONTHLY"
    "$STRIPE_PRICE_PRO_YEARLY"
    "$STRIPE_PRICE_ENTERPRISE_MONTHLY"
    "$STRIPE_PRICE_ENTERPRISE_YEARLY"
  )
  
  INVALID_PRICES=()
  for PRICE in "${PRICE_VARS[@]}"; do
    if [[ ! $PRICE == price_* ]]; then
      INVALID_PRICES+=("$PRICE")
    fi
  done
  
  if [ ${#INVALID_PRICES[@]} -eq 0 ]; then
    echo "✅ Todos os Price IDs têm formato válido (price_...)"
  else
    echo "❌ Price IDs com formato inválido: ${INVALID_PRICES[@]}"
    echo "   Price IDs devem começar com 'price_'"
  fi
  
  echo ""
  echo "📖 Próximos passos:"
  echo "   1. Testar localmente: cd server && npm run dev"
  echo "   2. Testar webhook: stripe listen --forward-to localhost:4000/api/billing/webhook"
  echo "   3. Ver guia completo: docs/STRIPE_PRICING_SETUP.md"
else
  echo "❌ Variáveis faltando no server/.env:"
  for VAR in "${EMPTY_VARS[@]}"; do
    echo "   - $VAR"
  done
  echo ""
  echo "📖 Configure seguindo o guia: docs/STRIPE_PRICING_SETUP.md"
  exit 1
fi

echo ""
