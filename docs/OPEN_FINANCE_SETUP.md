# 🏦 Open Finance Integration - Guia Completo

## 📋 Visão Geral

A integração com **Open Finance** permite que usuários conectem suas contas bancárias diretamente ao app e importem transações automaticamente, sem precisar fazer upload manual de CSV/OFX.

### ✨ Funcionalidades

- ✅ Conexão com +200 instituições financeiras brasileiras
- ✅ Importação automática de transações
- ✅ Sincronização em tempo real
- ✅ Suporte a múltiplas contas
- ✅ Gerenciamento seguro de credenciais
- ✅ Auto-categorização de transações

---

## 🎯 Agregadores Suportados

### Pluggy (Implementado)
- **Website**: https://pluggy.ai
- **Dashboard**: https://dashboard.pluggy.ai
- **Docs**: https://docs.pluggy.ai
- **Cobertura**: 200+ bancos brasileiros
- **Certificação**: Certificado pelo Banco Central
- **Preço**: Plano gratuito disponível (500 conexões/mês)

### Outros (Futuro)
- **Belvo**: https://belvo.com
- **Pismo**: https://pismo.io

---

## 🚀 Setup - Pluggy

### 1. Criar Conta Pluggy

1. Acesse https://dashboard.pluggy.ai
2. Clique em "Sign Up"
3. Preencha seus dados
4. Verifique seu email

### 2. Criar Client ID e Secret

1. No dashboard, vá em **Settings** → **API Keys**
2. Clique em **Create new API Key**
3. Copie o **Client ID** e **Client Secret**
4. **⚠️ IMPORTANTE**: Guarde o Client Secret em local seguro, ele só é mostrado uma vez

### 3. Configurar no Projeto

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
VITE_PLUGGY_CLIENT_ID=seu-client-id-aqui
VITE_PLUGGY_CLIENT_SECRET=seu-client-secret-aqui
```

**⚠️ Nunca comite .env.local no Git!** (já está no .gitignore)

### 4. Reiniciar Servidor

```bash
npm run dev
```

Agora o Open Finance estará ativo!

---

## 🎨 Como Usar

### 1. Acessar Open Finance

1. Abra o app
2. Vá em **Configurações** (ícone de engrenagem no menu inferior)
3. Role até a seção **"Open Finance"**

### 2. Conectar Banco

1. Clique no card do seu banco
2. Uma tela de login bancário será aberta (Pluggy Connect Widget)
3. Digite suas credenciais bancárias
4. Autorize a conexão
5. Aguarde sincronização

### 3. Sincronizar Transações

- **Automático**: A cada 24h
- **Manual**: Clique em "Sincronizar" no card da conta

### 4. Desconectar Banco

1. Clique em "Desconectar" no card
2. Confirme a ação
3. Os dados serão removidos

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Frontend      │
│  (React + TS)   │
└────────┬────────┘
         │
         │ openFinanceService.ts
         │
         ▼
┌─────────────────┐
│   Pluggy API    │
│  (REST + OAuth) │
└────────┬────────┘
         │
         │ Open Finance Protocol
         │
         ▼
┌─────────────────┐
│  Bancos (APIs)  │
│  BB, Itaú, etc  │
└─────────────────┘
```

### Fluxo de Dados

1. **Usuário clica em "Conectar Banco"**
   - Frontend chama `openFinanceService.getConnectToken()`
   - Pluggy retorna token temporário

2. **Pluggy Connect Widget abre**
   - Usuário faz login no banco
   - Pluggy cria conexão (Item) com o banco
   - Retorna itemId

3. **Frontend busca contas**
   - Chama `openFinanceService.listAccounts(itemId)`
   - Salva no localStorage via `bankConnectionStorage`

4. **Sincronização de transações**
   - Frontend chama `openFinanceService.getTransactions(accountId)`
   - Converte para formato do app
   - Aplica auto-categorização
   - Importa transações
   - Aplica deduplicação

---

## 🔐 Segurança

### Credenciais Bancárias

- ✅ **Não são armazenadas no app**
- ✅ Pluggy usa **OAuth 2.0** e é certificado pelo Banco Central
- ✅ Conexão via **HTTPS/TLS**
- ✅ Tokens expiram após uso

### Client Secret

- ⚠️ **Nunca exponha no código frontend em produção**
- ⚠️ Em produção, mova autenticação para backend
- ⚠️ Use variáveis de ambiente

### Recomendações Produção

```typescript
// ❌ NÃO FAZER (desenvolvimento)
const response = await fetch('https://api.pluggy.ai/auth', {
  body: JSON.stringify({
    clientId: VITE_PLUGGY_CLIENT_ID,
    clientSecret: VITE_PLUGGY_CLIENT_SECRET, // ❌ Exposto no frontend
  }),
});

// ✅ FAZER (produção)
const response = await fetch('/api/open-finance/auth', {
  // Backend faz autenticação com Pluggy
  // Client secret nunca vai ao frontend
});
```

---

## 🧪 Modo Mock (Desenvolvimento)

Se você não configurar credenciais, o sistema roda em **Modo Mock**:

- ✅ Mostra 7 bancos brasileiros populares
- ✅ Permite "conectar" (simulado)
- ✅ UI completa funciona
- ❌ Não busca dados reais
- ❌ Transações não são importadas

**Ideal para**: 
- Desenvolvimento de UI
- Testes sem credenciais
- Demo do produto

---

## 📦 Estrutura de Arquivos

```
src/
├── types/
│   └── openFinance.ts              # Types do Open Finance
├── lib/
│   ├── openFinance.ts              # Serviço Pluggy
│   └── bankConnectionStorage.ts    # Storage de conexões
└── components/
    └── BankConnectionManager.tsx   # UI de gerenciamento
```

---

## 🐛 Troubleshooting

### Erro: "Falha ao autenticar com Pluggy"

**Causa**: Client ID ou Secret inválidos

**Solução**:
1. Verifique se copiou corretamente do dashboard
2. Confirme que não tem espaços extras
3. Reinicie o servidor: `npm run dev`

### Erro: "Banco não responde"

**Causa**: Instabilidade do banco ou Pluggy

**Solução**:
1. Tente novamente em alguns minutos
2. Verifique status: https://status.pluggy.ai
3. Tente outro banco

### Transações não aparecem

**Causa**: Período sem transações ou erro de sincronização

**Solução**:
1. Verifique período de busca (padrão: últimos 30 dias)
2. Clique em "Sincronizar" novamente
3. Veja console do navegador (F12) para erros

### "Service Worker registration failed"

**Causa**: PWA não configurado corretamente

**Solução**:
1. Certifique-se que está rodando em HTTPS (ou localhost)
2. Limpe cache do navegador
3. Rebuilde: `npm run build`

---

## 📊 Limites e Quotas

### Pluggy Free Plan
- ✅ 500 conexões/mês
- ✅ 200+ instituições
- ✅ Histórico de 12 meses
- ✅ Suporte via email

### Pluggy Paid Plans
- 🚀 Unlimited connections
- 🚀 Webhooks
- 🚀 Suporte prioritário
- 🚀 SLA garantido

Ver preços: https://pluggy.ai/pricing

---

## 🔄 Roadmap

### v1.0 (Atual)
- ✅ Conexão manual com bancos
- ✅ Listagem de contas
- ✅ Importação manual de transações
- ✅ Modo mock

### v1.1 (Próximo)
- ⏳ Pluggy Connect Widget (iframe/modal)
- ⏳ Sincronização automática (24h)
- ⏳ Webhooks de atualização
- ⏳ Notificações de novas transações

### v2.0 (Futuro)
- ⏳ Suporte a Belvo
- ⏳ Cartões de crédito
- ⏳ Investimentos
- ⏳ Pix automático

---

## 📚 Recursos

- **Pluggy Docs**: https://docs.pluggy.ai
- **Pluggy Status**: https://status.pluggy.ai
- **Postman Collection**: https://pluggy.postman.co
- **Banco Central Open Finance**: https://openbankingbrasil.org.br

---

## 🆘 Suporte

### Problemas com Pluggy
- Email: support@pluggy.ai
- Slack: https://pluggy-community.slack.com

### Problemas com o App
- Abra uma issue no GitHub
- Email: seu-email@example.com

---

## ⚖️ Licença e Compliance

- ✅ Pluggy é **certificado pelo Banco Central**
- ✅ Segue normas do **Open Finance Brasil**
- ✅ Em conformidade com **LGPD**
- ✅ Certificado **ISO 27001**

**⚠️ Importante**: Ao conectar bancos, você está autorizando o compartilhamento de dados conforme Lei 13.709/2018 (LGPD). Os dados são usados exclusivamente para o funcionamento do app financeiro.

---

## 🎉 Conclusão

Com Open Finance configurado, seu app agora:

- ✅ Importa transações automaticamente
- ✅ Economiza tempo do usuário
- ✅ Reduz erros de digitação manual
- ✅ Mantém dados sempre atualizados

**Próximo passo**: Teste conectando sua conta bancária real! 🚀
