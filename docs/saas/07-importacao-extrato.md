# Etapa 7 — Importação de extrato (OFX/CSV)

## Objetivo
Permitir que o usuário importe extratos bancários em OFX ou CSV e converta em lançamentos no app.

## Status
✅ Concluída

## Entregas implementadas
- Parser OFX básico (STMTTRN, DTPOSTED, TRNAMT, MEMO/NAME).
- Parser CSV com mapeamento automático de colunas comuns.
- Preview com contagem de entradas/saídas e lista de lançamentos.
- Importação com deduplicação por hash determinístico.

## Arquivos principais
- `src/lib/statementImport.ts`
- `src/components/StatementImportManager.tsx`
- `src/pages/SettingsPage.tsx`

## Como validar
1. Abra Configurações.
2. Clique em "Selecionar arquivo".
3. Envie um OFX ou CSV.
4. Revise a prévia e confirme.

## Próxima etapa
Mapeamento manual de colunas CSV e integração Open Finance (etapa 7b já implementada com auto-categorização).

---

**Última atualização:** 21/02/2026
