/**
 * PluggyConnectModal
 *
 * Carrega o Pluggy Connect Widget via CDN e abre o fluxo de autenticação
 * bancária. O widget cria seu próprio overlay full-screen; enquanto o script
 * está sendo carregado exibimos um spinner.
 *
 * Referência: https://docs.pluggy.ai/docs/connect-widget
 */

import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// CDN do Pluggy Connect Widget
const PLUGGY_SCRIPT_URL =
  'https://cdn.pluggy.ai/pluggy-connect/v2.11.0/pluggy-connect.min.js';

// ─── Tipos do Widget ──────────────────────────────────────────────────────────

interface PluggyConnectSuccessPayload {
  item: { id: string };
}

interface PluggyConnectOptions {
  connectToken: string;
  onSuccess: (data: PluggyConnectSuccessPayload) => void;
  onError: (error: unknown) => void;
  onClose: () => void;
  onOpen?: () => void;
  products?: string[];
  countryCodes?: string[];
}

interface PluggyConnectInstance {
  init(): void;
  destroy?: () => void;
}

declare global {
  interface Window {
    PluggyConnect: new (options: PluggyConnectOptions) => PluggyConnectInstance;
  }
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
  const widgetRef = useRef<PluggyConnectInstance | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initWidget = () => {
      if (cancelled) return;

      if (typeof window.PluggyConnect === 'undefined') {
        setStatus('error');
        setErrorMessage(
          'Não foi possível carregar o widget da Pluggy. Verifique sua conexão com a internet.'
        );
        onError(new Error('PluggyConnect não disponível'));
        return;
      }

      try {
        const widget = new window.PluggyConnect({
          connectToken,
          products: ['TRANSACTIONS', 'ACCOUNTS'],
          countryCodes: ['BR'],
          onOpen: () => {
            if (!cancelled) setStatus('ready');
          },
          onSuccess: (data) => {
            if (!cancelled) onSuccess(data.item.id);
          },
          onError: (err) => {
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
        widget.init();
        // O widget cuida do próprio overlay; saímos do estado loading quando
        // onOpen disparar. Caso onOpen nunca dispare (versões antigas), 
        // aguardamos 3s e assumimos que já abriu.
        setTimeout(() => {
          if (!cancelled && status === 'loading') setStatus('ready');
        }, 3000);
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage('Erro ao inicializar o widget de conexão bancária.');
          onError(err);
        }
      }
    };

    // Script já carregado?
    if (typeof window.PluggyConnect !== 'undefined') {
      initWidget();
      return;
    }

    // Tag já existe no DOM (carregamento anterior)?
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PLUGGY_SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener('load', initWidget, { once: true });
      existing.addEventListener(
        'error',
        () => {
          if (!cancelled) {
            setStatus('error');
            setErrorMessage('Falha ao carregar o script da Pluggy.');
            onError(new Error('Script load failed'));
          }
        },
        { once: true }
      );
      return () => {
        cancelled = true;
        widgetRef.current?.destroy?.();
      };
    }

    // Carrega o script pela primeira vez
    const script = document.createElement('script');
    script.src = PLUGGY_SCRIPT_URL;
    script.async = true;
    script.onload = initWidget;
    script.onerror = () => {
      if (!cancelled) {
        setStatus('error');
        setErrorMessage(
          'Falha ao carregar o widget da Pluggy. Verifique sua conexão com a internet.'
        );
        onError(new Error('Script load failed'));
      }
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      widgetRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectToken]);

  // ── Overlay de carregamento (visível enquanto o script não abre o widget) ──
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
