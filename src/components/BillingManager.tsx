/**
 * Billing Manager
 * Gerenciamento completo de assinatura e faturamento
 */

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { billingService } from '@/lib/billingService';
import { getPlan } from '@/lib/plans';
import { SubscriptionPlans } from './SubscriptionPlans';
import type { Subscription, Invoice, PaymentMethod, PlanId } from '@/types/billing';

interface BillingManagerProps {
  userId: string;
}

export function BillingManager({ userId }: BillingManagerProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [error, setError] = useState('');

  const loadBillingData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await billingService.initialize();

      const [subData, invoiceData, paymentData] = await Promise.all([
        billingService.getSubscription(userId),
        billingService.getInvoices(userId),
        billingService.getPaymentMethods(userId),
      ]);

      setSubscription(subData);
      setInvoices(invoiceData);
      setPaymentMethods(paymentData);
    } catch (err) {
      setError('Erro ao carregar dados de cobrança');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    const confirmed = confirm('Tem certeza que deseja cancelar sua assinatura?');
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const success = await billingService.cancelSubscription(subscription.id);
      if (success) {
        await loadBillingData();
      }
    } catch (err) {
      alert('Erro ao cancelar assinatura');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    setActionLoading(true);
    try {
      const success = await billingService.reactivateSubscription(subscription.id);
      if (success) {
        await loadBillingData();
      }
    } catch (err) {
      alert('Erro ao reativar assinatura');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlanChanged = async (planId: PlanId) => {
    setShowPlans(false);
    await loadBillingData();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const currentPlan = subscription ? getPlan(subscription.planId) : getPlan('free');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showPlans) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Planos e Assinaturas</h2>
          <Button variant="outline" onClick={() => setShowPlans(false)}>
            Voltar
          </Button>
        </div>
        <SubscriptionPlans
          currentPlan={subscription?.planId || 'free'}
          userId={userId}
          onPlanChanged={handlePlanChanged}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Billing & Subscription</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie seu plano, pagamentos e assinatura
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Plano Atual: {currentPlan.name}
                <Badge variant={currentPlan.id === 'free' ? 'secondary' : 'default'}>
                  {currentPlan.id.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>{currentPlan.description}</CardDescription>
            </div>
            <Button onClick={() => setShowPlans(true)}>
              {currentPlan.id === 'free' ? 'Fazer Upgrade' : 'Trocar Plano'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Próxima cobrança</p>
                    <p className="text-sm font-medium">
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {subscription.status === 'active' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize">{subscription.status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Método de pagamento</p>
                    <p className="text-sm font-medium">
                      {paymentMethods[0]
                        ? `${paymentMethods[0].brand?.toUpperCase()} •••• ${paymentMethods[0].last4}`
                        : 'Não cadastrado'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                {subscription.cancelAtPeriodEnd ? (
                  <Button
                    variant="outline"
                    onClick={handleReactivateSubscription}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Reativar Assinatura
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Cancelar Assinatura
                  </Button>
                )}
              </div>

              {subscription.cancelAtPeriodEnd && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sua assinatura está cancelada e será encerrada em{' '}
                    {formatDate(subscription.currentPeriodEnd)}
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Você está no plano gratuito
              </p>
              <Button onClick={() => setShowPlans(true)}>
                Ver Planos Premium
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Faturas Recentes</CardTitle>
            <CardDescription>Histórico de pagamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{formatPrice(invoice.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(invoice.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                  >
                    {invoice.status === 'paid' ? 'Pago' : invoice.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
