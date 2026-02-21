# 🚀 Deploy na Vercel

**Última atualização:** 21/02/2026

## Cenário A — Frontend/PWA standalone

### 1) Build local
```bash
npm install
npm run build
```

### 2) Publicação

- Via Git (recomendado): importar o repositório em https://vercel.com/new
- Via upload manual: enviar a pasta `dist/` em “Deploy without Git”

### 3) Configuração

- Framework: `Vite` (ou Static se upload da `dist`)
- Sem variáveis obrigatórias para modo local-only

---

## Cenário B — Frontend SaaS (com API separada)

### 1) Publicar backend primeiro

Hospede o backend em plataforma de API (Render/Railway/Fly.io/VM etc) e obtenha a URL pública.

### 2) Configurar variáveis no projeto Vercel

- `VITE_API_BASE_URL` = URL pública da API
- `VITE_STRIPE_PUBLISHABLE_KEY` (se billing real)
- `VITE_PLUGGY_CLIENT_ID` e `VITE_PLUGGY_CLIENT_SECRET` (Open Finance)

### 3) Deploy do frontend

Redeploy após salvar as variáveis.

---

## Checklist pós-deploy

- [ ] Frontend abre sem erro no console
- [ ] Login SaaS funciona (se ativo)
- [ ] Chamadas à API respondem corretamente
- [ ] Fluxo de assinatura abre checkout Stripe
- [ ] PWA instalável no domínio final

---

## Links úteis

- Vercel Dashboard: https://vercel.com/dashboard
- Novo projeto: https://vercel.com/new
- Projetos: https://vercel.com/dashboard/projects
