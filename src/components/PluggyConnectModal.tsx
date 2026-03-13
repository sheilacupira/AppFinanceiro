/**
 * PluggyConnectModal
 *
 * Abre o Pluggy Connect Widget via pacote npm (pluggy-connect-sdk).
 * O widget cria seu próprio overlay full-screen.
 *
 * Referência: https://docs.pluggy.ai/docs/connect-widget
 */

import { useEffect, useRef, useState } from 'react';
import { PluggyConnect } from 'pluggy-connect-sdk';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Tipos do Widget ──────────────────────────────────────────────────────────

interface PluggyConnectSuccessPayload {
  item: { id: string };
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface PluggyConnectModalProps {
  connectToken: string;
  bankName?: string;
  onSuccess: (itemId: string) => void;
  onError: (error: unknown) => void;
  onClose: () => void;
}

export function PluggyConnectModal({
  connectToken,
  bankName,
  onSuccess,
  onError,
  onClose,
}: PluggyConnectModalProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const widgetRef = useRef<PluggyConnect | null>(null);

  useEffect(() => {
    let cancelled = false;

    try {
      const widget = new PluggyConnect({
        connectToken,
        products: ['TRANSACTIONS', 'ACCOUNTS'],
        countryCodes: ['BR'],
        onOpen: () => {
          if (!cancelled) setStatus('ready');
        },
        onSuccess: (data: PluggyConnectSuccessPayload) => {
          if (!cancelled) onSuccess(data.item.id);
        },
        onError: (err: unknown) => {
          if (!cancelled) {
            setStatus('error');
            const msg =
              err instanceof Error
                ? err.message
                : 'Erro na conexão bancária. Tente novamente.';
            setErrorMessage(msg);
            onError(err);
          }
        },
        onClose: () => {
          if (!cancelled) onClose();
        },
      });

      widgetRef.current = widget;
      widget.init().then(() => {
        if (!cancelled) setStatus('ready');
      }).catch((err: unknown) => {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage('Erro ao inicializar o widget de conexão bancária.');
          onError(err);
        }
      });
    } catch (err) {
      if (!cancelled) {
        setStatus('error');
        setErrorMessage('Erro ao carregar o widget da Pluggy.');
        onError(err);
      }
    }

    return () => {
      cancelled = true;
      widgetRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectToken]);

  // ── Overlay de carregamento ────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-card rounded-2xl p-8 text-center space-y-4 shadow-2xl max-w-xs w-full mx-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <div>
            <p className="font-semibold">Abrindo conexão bancária</p>
            {bankName && (
              <p className="text-sm text-muted-foreground mt-1">{bankName}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // ── Tela de erro ──────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-card rounded-2xl p-8 text-center space-y-4 shadow-2xl max-w-sm w-full mx-4 border border-destructive/30">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <X className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">Erro na conexão</p>
            <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
          </div>
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  // status === 'ready': o widget Pluggy ocupou a tela — não renderizamos nada aqui
  return null;
}
