/**
 * StatementGuide
 * Guia visual de como exportar extrato em cada banco brasileiro
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronDown, ChevronUp, FileDown, Smartphone, Monitor } from 'lucide-react';

interface BankGuide {
  name: string;
  color: string;
  emoji: string;
  format: string;
  app: string[];
  web: string[];
}

const BANK_GUIDES: BankGuide[] = [
  {
    name: 'Nubank',
    color: 'bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-700',
    emoji: '💜',
    format: 'CSV',
    app: [
      'Abra o app do Nubank',
      'Toque em "Extrato" na tela inicial',
      'Toque nos 3 pontos (⋯) no canto superior direito',
      'Selecione "Exportar extrato"',
      'Escolha o período desejado',
      'Toque em "Exportar CSV"',
      'Compartilhe ou salve o arquivo',
    ],
    web: [],
  },
  {
    name: 'Itaú',
    color: 'bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-700',
    emoji: '🟠',
    format: 'OFX ou CSV',
    app: [
      'Acesse o app do Itaú',
      'Vá em "Extrato"',
      'Selecione o período',
      'Toque em "Exportar" ou no ícone de compartilhar',
      'Escolha OFX ou CSV',
    ],
    web: [
      'Acesse itau.com.br',
      'Vá em "Conta Corrente" → "Extrato"',
      'Selecione o período desejado',
      'Clique em "Exportar" (ícone de download)',
      'Escolha o formato OFX ou CSV',
    ],
  },
  {
    name: 'Bradesco',
    color: 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700',
    emoji: '🔴',
    format: 'OFX',
    app: [
      'Acesse o app ou site do Bradesco',
      'Vá em "Extrato"',
      'Selecione o mês desejado',
      'Toque em "Exportar" → "OFX"',
    ],
    web: [
      'Acesse bradesco.com.br',
      'Vá em "Conta Corrente" → "Extrato"',
      'Clique em "Exportar para OFX"',
      'Salve o arquivo',
    ],
  },
  {
    name: 'Banco do Brasil',
    color: 'bg-yellow-100 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700',
    emoji: '🟡',
    format: 'CSV ou OFX',
    app: [],
    web: [
      'Acesse bb.com.br',
      'Clique em "Minha Conta" → "Extrato"',
      'Selecione o período',
      'Clique em "Exportar" → CSV ou OFX',
      'Salve o arquivo no computador',
    ],
  },
  {
    name: 'Caixa Econômica',
    color: 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700',
    emoji: '🔵',
    format: 'CSV',
    app: [],
    web: [
      'Acesse caixa.gov.br ou o app CAIXA',
      'Vá em "Extrato"',
      'Selecione o período',
      'Clique em "Exportar" ou "Imprimir em PDF"',
      'Para CSV: procure a opção de download',
    ],
  },
  {
    name: 'Santander',
    color: 'bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-700',
    emoji: '🌹',
    format: 'OFX',
    app: [
      'Acesse o app Santander',
      'Vá em "Conta" → "Extrato"',
      'Selecione o período',
      'Toque em exportar → OFX',
    ],
    web: [
      'Acesse santander.com.br',
      'Vá em "Conta Corrente" → "Extrato"',
      'Clique em "Exportar OFX"',
    ],
  },
  {
    name: 'Inter',
    color: 'bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-700',
    emoji: '🟧',
    format: 'CSV ou OFX',
    app: [
      'Abra o app Inter',
      'Vá em "Extrato"',
      'Toque nos 3 pontos ou ícone de exportar',
      'Escolha CSV ou OFX',
      'Selecione o período e baixe',
    ],
    web: [],
  },
  {
    name: 'C6 Bank',
    color: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
    emoji: '⬛',
    format: 'CSV',
    app: [
      'Abra o app C6 Bank',
      'Vá em "Extrato"',
      'Toque no ícone de compartilhar/exportar',
      'Escolha CSV e o período',
      'Salve ou compartilhe o arquivo',
    ],
    web: [],
  },
];

function BankCard({ guide }: { guide: BankGuide }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-lg border p-4 cursor-pointer transition-all ${guide.color}`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{guide.emoji}</span>
          <div>
            <p className="font-semibold text-sm">{guide.name}</p>
            <p className="text-xs text-muted-foreground">Formato: {guide.format}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>

      {open && (
        <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
          {guide.app.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Smartphone className="w-3 h-3" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pelo App</p>
              </div>
              <ol className="space-y-1">
                {guide.app.map((step, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-muted-foreground font-medium min-w-[16px]">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {guide.web.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Monitor className="w-3 h-3" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pelo Computador</p>
              </div>
              <ol className="space-y-1">
                {guide.web.map((step, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="text-muted-foreground font-medium min-w-[16px]">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StatementGuide() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileDown className="w-5 h-5 text-primary" />
          <CardTitle>Como Importar seu Extrato</CardTitle>
        </div>
        <CardDescription>
          Exporte o extrato direto do seu banco (gratuito) e importe abaixo. Clique no seu banco para ver o passo a passo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BANK_GUIDES.map((guide) => (
            <BankCard key={guide.name} guide={guide} />
          ))}
        </div>
        <div className="mt-4 rounded-md bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
          💡 <strong>Dica:</strong> Após exportar o arquivo CSV ou OFX do seu banco, use o campo "Importar Extrato" acima para carregar as transações automaticamente.
        </div>
      </CardContent>
    </Card>
  );
}
