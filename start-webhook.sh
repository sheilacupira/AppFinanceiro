#!/bin/bash
# Script para iniciar o Stripe webhook listener
STRIPE_SK=$(grep STRIPE_SECRET_KEY server/.env | cut -d= -f2)
echo "Iniciando Stripe webhook listener..."
stripe listen --api-key "$STRIPE_SK" --forward-to localhost:4000/api/billing/webhook
