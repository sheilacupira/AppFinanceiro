# Etapa 7 — Importacao de extrato (OFX/CSV)

## Objetivo
Permitir que o usuario importe extratos bancarios em OFX ou CSV e converta em lancamentos no app.

## O que foi implementado
- Parser OFX basico (STMTTRN, DTPOSTED, TRNAMT, MEMO/NAME).
- Parser CSV com mapeamento automatico de colunas comuns.
- Preview com contagem de entradas/saidas e lista de lancamentos.
- Importacao com deduplicacao por id deterministico.

## Arquivos principais
- `src/lib/statementImport.ts`
- `src/components/StatementImportManager.tsx`
- `src/pages/SettingsPage.tsx`

## Como usar
1. Abra Configuracoes
2. Clique em "Selecionar arquivo"
3. Envie um OFX ou CSV
4. Revise a previa e confirme

## Proximos passos
- Mapeamento manual de colunas CSV quando o formato nao for detectado.
- Regras melhores para deduplicacao e conciliacao.
- Integracao Open Finance (automatica).
