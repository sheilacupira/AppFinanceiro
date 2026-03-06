/**
 * PlanGate
 * Componente wrapper que exibe conteúdo ou tela de upgrade conforme o plano.
 */

import { ReactNode } from 'react';
import { Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isSaasMode } from '@/config/runtime';
import { useAuth } from '@/contexts/AuthContext';
import { getEntitlementsByPlan, getDefaultEntitlements } from '@/lib/featureFlags';
import type { FeatureEntitlements } from '@/types/saas';

interface PlanGateProps {
  /** Qual flag de entitlement deve ser verdadeira para exibir children */
  feature: keyof FeatureEntitlements;
  /** Título exibido no paywall */
  title?: string;
  /** Descrição exibida no paywall */
  description?: string;
  children: ReactNode;
}

export function PlanGate({
  feature,
  title = 'Recurso exclusivo do plano Pró',
  description = 'Faça upgrade para liberar este recurso.',
  children,
}: PlanGateProps) {
  const { session } = useAuth();

  const entitlements = isSaasMode
    ? getEntitlementsByPlan(session?.tenant.billingPlan ?? 'free')
    : getDefaultEntitlements();

  if (entitlements[feature]) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-5 rounded-xl border border-dashed border-border bg-muted/30">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="font-semibold text-base">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        size="sm"
        onClick={() => {
          window.location.hash = '#billing';
        }}
        className="gap-2"
      >
        <Zap className="h-4 w-4" />
        Ver planos de assinatura
      </Button>
    </div>
  );
}
