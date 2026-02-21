# 📦 Produção — Estado Consolidado

**Data de consolidação:** 21/02/2026

## Resumo executivo

O projeto está operacional em dois perfis:

1. **PWA local-first**: pronto para uso diário, instalação e operação offline.
2. **SaaS**: backend com autenticação, sync de dados financeiros e billing Stripe implementados.

## Maturidade por módulo

### ✅ Estável
- Core financeiro (transações, categorias, recorrências, configurações)
- Importação de extrato OFX/CSV
- Auto-categorização de importação
- PWA (manifest + service worker)
- Backend base SaaS e sync de metadados
- Billing Stripe (checkout, assinatura, invoices, portal, webhook)

### 🟡 Parcial
- Open Finance/Pluggy: serviço e UI existem, porém fluxos finais de widget real e sync automático ainda em evolução.

## Checklist de produção (full stack)

- [ ] API publicada com HTTPS
- [ ] `CORS_ORIGIN` alinhado ao domínio do frontend
- [ ] Migrações Prisma aplicadas
- [ ] Secrets JWT fortes e rotacionáveis
- [ ] Chaves Stripe e price IDs preenchidos
- [ ] Webhook Stripe validado em ambiente real
- [ ] `VITE_API_BASE_URL` apontando para API pública
- [ ] Teste E2E básico de login → sync → billing

## Checklist de produção (PWA standalone)

- [ ] Build frontend concluído (`npm run build`)
- [ ] App servido em HTTPS (ou localhost para teste)
- [ ] Instalação testada em Android/iOS/Desktop
- [ ] Fluxo backup/restore (export/import JSON) validado

## Riscos conhecidos

- Documentações antigas de “sem backend” ainda existiam e foram normalizadas nesta revisão.
- Open Finance está funcional em mock e estrutura real, mas não deve ser comunicado como 100% concluído sem homologação final.

## Referências

- `README.md`
- `SUMMARY.md`
- `DEPLOYMENT.md`
- `docs/OPEN_FINANCE_SETUP.md`
- `docs/saas/backlog-mvp.md`
