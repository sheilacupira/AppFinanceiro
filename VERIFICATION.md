# ✅ Checklist de Verificação

**Última atualização:** 21/02/2026

## Escopo validado

### Frontend / PWA
- [x] Build do frontend gera artefatos PWA
- [x] Service Worker e manifest ativos
- [x] Fluxo offline funcional após primeira carga
- [x] Instalação em dispositivos suportados

### Core financeiro
- [x] Transações, categorias, recorrências e configurações
- [x] Importação OFX/CSV
- [x] Auto-categorização de importação
- [x] Exportação/importação de dados

### SaaS backend
- [x] Auth JWT (access + refresh)
- [x] Rotas de `me`, transações e metadados financeiros
- [x] Estrutura multi-tenant

### Billing
- [x] Checkout Stripe
- [x] Consulta de assinatura
- [x] Cancelamento/reativação/troca de plano
- [x] Invoices e portal
- [x] Endpoint de webhook

### Open Finance
- [x] Estrutura de integração Pluggy
- [x] Modo mock funcional
- [ ] Fluxo real completo (widget + sync automático) homologado

---

## Comandos de verificação rápida

### Frontend
```bash
npm run lint
npm run build
npm run preview
```

### Backend
```bash
cd server
npm run build
```

### PWA local
```bash
cd ..
npm run build
./serve-pwa.sh
```

---

## Critérios de pronto para produção

### PWA standalone
- [ ] HTTPS ativo no domínio final
- [ ] Teste de instalação em Android/iOS/Desktop
- [ ] Teste de restore de backup JSON

### Full stack
- [ ] API publicada com CORS correto
- [ ] Migrações aplicadas
- [ ] Variáveis Stripe preenchidas
- [ ] Webhook Stripe validado
- [ ] Teste E2E de login → sync → billing

---

## Referências

- `README.md`
- `QUICK_START.md`
- `DEPLOYMENT.md`
- `PRODUCAO.md`
- `docs/OPEN_FINANCE_SETUP.md`
