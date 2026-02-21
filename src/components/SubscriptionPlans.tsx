/**
 * Subscription Plans Component
 * UI para seleção e upgrade de planos
 */

import { useState } from 'react';
import { Check, Loader2, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { billingService } from '@/lib/billingService';
import { getAllPlans } from '@/lib/plans';
import type { PlanId, BillingInterval } from '@/types/billing';

interface SubscriptionPlansProps {
  currentPlan?: PlanId;
  userId: string;
  onPlanChanged?: (planId: PlanId) => void;
}

export function SubscriptionPlans({
  currentPlan = 'free',
  userId,
  onPlanChanged,
}: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [interval, setInterval] = useState<BillingInterval>('month');

  const plans = getAllPlans();

  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === 'free') return;

    setLoading(planId);
    try {
      await billingService.initialize();

      const result = await billingService.createCheckoutSession(
        planId,
        interval,
        userId,
        `${window.location.origin}/settings?billing=success`,
        `${window.location.origin}/settings?billing=cancel`,
      );

      // Em produção, redirecionar para Stripe Checkout
      if (result.url.startsWith('http')) {
        window.location.href = result.url;
      } else {
        // Modo mock: simular upgrade local
        const mockSubscription = {
          id: `sub_${Date.now()}`,
          userId,
          planId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: undefined,
          stripeCustomerId: undefined,
        };
        localStorage.setItem(`mock_subscription_${userId}`, JSON.stringify(mockSubscription));
        onPlanChanged?.(planId);
      }
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      alert('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getPlanIcon = (planId: PlanId) => {
    switch (planId) {
      case 'enterprise':
        return <Crown className="h-5 w-5" />;
      case 'pro':
        return <Zap className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Escolha seu plano</h2>
        <p className="text-muted-foreground">
          Upgrade para desbloquear recursos avançados
        </p>
      </div>

      {/* Interval Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border p-1 bg-muted">
          <button
            onClick={() => setInterval('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              interval === 'month'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              interval === 'year'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Anual
            <Badge variant="secondary" className="ml-2 text-xs">-17%</Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const isLoading = loading === plan.id;
          const price = interval === 'month' ? plan.price.monthly : plan.price.yearly;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.highlighted
                  ? 'border-primary shadow-lg scale-105'
                  : ''
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Mais Popular
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center gap-2">
                  {getPlanIcon(plan.id)}
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-3xl font-bold">{formatPrice(price)}</span>
                  {price > 0 && (
                    <span className="text-muted-foreground ml-1">
                      /{interval === 'month' ? 'mês' : 'ano'}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {plan.features.slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? 'secondary' : 'default'}
                  disabled={isCurrentPlan || isLoading}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : isCurrentPlan ? (
                    'Plano Atual'
                  ) : plan.id === 'free' ? (
                    'Plano Gratuito'
                  ) : (
                    'Fazer Upgrade'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
