/**
 * Billing Service
 * Gerenciamento de assinaturas e pagamentos com Stripe
 */

import type { Subscription, Invoice, PaymentMethod, BillingInterval } from '@/types/billing';
import type { PlanId } from '@/types/billing';

class BillingService {
  private apiKey: string | null = null;
  private publishableKey: string | null = null;
  private mockMode = false;

  async initialize() {
    this.apiKey = import.meta.env.VITE_STRIPE_SECRET_KEY || null;
    this.publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null;

    if (!this.apiKey || !this.publishableKey) {
      console.warn('⚠️ Stripe credentials not found. Running in MOCK mode.');
      this.mockMode = true;
    } else {
      console.log('✅ Stripe initialized successfully');
    }
  }

  /**
   * Cria sessão de checkout para nova assinatura
   */
  async createCheckoutSession(
    planId: PlanId,
    interval: BillingInterval,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    if (this.mockMode) {
      return this.mockCreateCheckoutSession(planId, interval);
    }

    // TODO: Integração real com Stripe
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        interval,
        userId,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    return response.json();
  }

  /**
   * Obtém assinatura ativa do usuário
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    if (this.mockMode) {
      return this.mockGetSubscription(userId);
    }

    const response = await fetch(`/api/billing/subscription?userId=${userId}`);

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  /**
   * Cancela assinatura no final do período
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (this.mockMode) {
      return this.mockCancelSubscription(subscriptionId);
    }

    const response = await fetch('/api/billing/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });

    return response.ok;
  }

  /**
   * Reativa assinatura cancelada
   */
  async reactivateSubscription(subscriptionId: string): Promise<boolean> {
    if (this.mockMode) {
      return this.mockReactivateSubscription(subscriptionId);
    }

    const response = await fetch('/api/billing/subscription/reactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });

    return response.ok;
  }

  /**
   * Muda plano da assinatura
   */
  async changePlan(
    subscriptionId: string,
    newPlanId: PlanId,
    interval: BillingInterval
  ): Promise<boolean> {
    if (this.mockMode) {
      return this.mockChangePlan(subscriptionId, newPlanId);
    }

    const response = await fetch('/api/billing/subscription/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, newPlanId, interval }),
    });

    return response.ok;
  }

  /**
   * Lista faturas do usuário
   */
  async getInvoices(userId: string): Promise<Invoice[]> {
    if (this.mockMode) {
      return this.mockGetInvoices(userId);
    }

    const response = await fetch(`/api/billing/invoices?userId=${userId}`);

    if (!response.ok) {
      return [];
    }

    return response.json();
  }

  /**
   * Lista métodos de pagamento
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    if (this.mockMode) {
      return this.mockGetPaymentMethods(userId);
    }

    const response = await fetch(`/api/billing/payment-methods?userId=${userId}`);

    if (!response.ok) {
      return [];
    }

    return response.json();
  }

  /**
   * Cria portal do cliente (gerenciar assinatura)
   */
  async createCustomerPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    if (this.mockMode) {
      return { url: returnUrl };
    }

    const response = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, returnUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    return response.json();
  }

  // ==================== MOCK MODE ====================

  private mockCreateCheckoutSession(
    planId: PlanId,
    interval: BillingInterval
  ): Promise<{ sessionId: string; url: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          sessionId: `mock_session_${Date.now()}`,
          url: `/billing/success?plan=${planId}&interval=${interval}`,
        });
      }, 1000);
    });
  }

  private mockGetSubscription(userId: string): Promise<Subscription | null> {
    const mockSub = localStorage.getItem(`mock_subscription_${userId}`);
    if (mockSub) {
      const data = JSON.parse(mockSub);
      return Promise.resolve({
        ...data,
        currentPeriodStart: new Date(data.currentPeriodStart),
        currentPeriodEnd: new Date(data.currentPeriodEnd),
        trialEnd: data.trialEnd ? new Date(data.trialEnd) : undefined,
      });
    }
    return Promise.resolve(null);
  }

  private mockCancelSubscription(subscriptionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Atualizar mock no localStorage
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('mock_subscription_')) {
            const sub = JSON.parse(localStorage.getItem(key)!);
            if (sub.id === subscriptionId) {
              sub.cancelAtPeriodEnd = true;
              localStorage.setItem(key, JSON.stringify(sub));
              break;
            }
          }
        }
        resolve(true);
      }, 1000);
    });
  }

  private mockReactivateSubscription(subscriptionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('mock_subscription_')) {
            const sub = JSON.parse(localStorage.getItem(key)!);
            if (sub.id === subscriptionId) {
              sub.cancelAtPeriodEnd = false;
              localStorage.setItem(key, JSON.stringify(sub));
              break;
            }
          }
        }
        resolve(true);
      }, 1000);
    });
  }

  private mockChangePlan(subscriptionId: string, newPlanId: PlanId): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('mock_subscription_')) {
            const sub = JSON.parse(localStorage.getItem(key)!);
            if (sub.id === subscriptionId) {
              sub.planId = newPlanId;
              localStorage.setItem(key, JSON.stringify(sub));
              break;
            }
          }
        }
        resolve(true);
      }, 1000);
    });
  }

  private mockGetInvoices(userId: string): Promise<Invoice[]> {
    return Promise.resolve([
      {
        id: 'inv_001',
        subscriptionId: 'sub_001',
        amount: 29.90,
        status: 'paid',
        createdAt: new Date(2026, 1, 1),
        paidAt: new Date(2026, 1, 1),
        invoiceUrl: '#',
        receiptUrl: '#',
      },
      {
        id: 'inv_002',
        subscriptionId: 'sub_001',
        amount: 29.90,
        status: 'paid',
        createdAt: new Date(2026, 0, 1),
        paidAt: new Date(2026, 0, 1),
        invoiceUrl: '#',
        receiptUrl: '#',
      },
    ]);
  }

  private mockGetPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return Promise.resolve([
      {
        id: 'pm_001',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2028,
        isDefault: true,
      },
    ]);
  }
}

export const billingService = new BillingService();
