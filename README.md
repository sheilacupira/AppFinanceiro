# 💰 Financeiro - Controle Financeiro Offline

Um app de controle financeiro simples e eficiente que funciona **completamente offline**. Organize suas entradas e saídas por mês, com sincronização entre dispositivos.

## ✨ Características

- 🔒 **Offline-First**: Todos os dados salvos localmente no seu dispositivo
- 💻 **Sem Backend**: Funciona sem servidor - privacidade garantida
- 📱 **Instalável**: Use como app nativo em smartphone, tablet ou desktop
- 🎨 **Interface Moderna**: Design limpo e intuitivo
- 💾 **Sincronização**: Exporte/importe dados facilmente entre dispositivos
- 🌙 **Tema Escuro**: Suporta preferência de tema do sistema

## 🚀 Quick Start

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor local
npm run dev

# Acessar em http://localhost:8080
```

### Produção

```bash
# Compilar projeto
npm run build

# Servir versão compilada
./serve-pwa.sh

# Ou manualmente
npx http-server dist -p 3000 -g
```

## 📲 Instalar em Outro Dispositivo

### Opção Rápida (mesma rede)

1. Compile o projeto: `npm run build`
2. Rode: `./serve-pwa.sh`
3. Abra em outro dispositivo: `http://[SEU_IP]:3000`
4. Clique em "Instalar"

### Opção Completa

Veja [PWA_SETUP.md](./PWA_SETUP.md) para instruções detalhadas:
- Android (Chrome/Firefox)
- iOS/iPadOS (Safari)
- Windows/Linux (Chrome/Edge)
- macOS (Safari/Chrome)
- Deploy em servidor HTTPS

## 🏗️ Estrutura do Projeto

```
src/
├── pages/          # Páginas principais
├── components/     # Componentes React
├── lib/           # Lógica de armazenamento (offline)
├── contexts/      # Context API
├── types/         # TypeScript types
└── hooks/         # Custom hooks
```

## 💾 Dados Offline

Os dados são salvos em:
- **LocalStorage**: Preferências, transações e dados principais

Tudo é sincronizado automaticamente e persiste entre sessões.

## 🔄 Sincronização Entre Dispositivos

1. **Exportar**: Configurações → Exportar Dados
2. **Importar**: Configurações → Importar Dados (em outro dispositivo)

## 🛠️ Desenvolvimento

### Dependências Principais

- **React 18**: UI framework
- **Vite**: Build tool rápido
- **Shadcn/ui**: Component library
- **Tailwind CSS**: Styling
- **Vite PWA**: Plugin para PWA

### Scripts

```bash
npm run dev        # Dev server
npm run build      # Build produção
npm run preview    # Preview build
npm run lint       # ESLint check
```

## 📋 PWA Configuration

- **Service Worker**: Controle automático de cache
- **Manifest**: Configuração de instalação
- **Workbox**: Estratégia de cache inteligente
- **HTTPS**: Recomendado em produção

## 🐛 Troubleshooting

**App não instala?**
- Use HTTPS em produção
- Verifique se Service Worker está ativo (DevTools → Application)

**Dados não sincronizam?**
- Use a função Exportar/Importar nas Configurações
- Ou implemente um backend personalizado

**Ícone não aparece?**
- Certifique-se que `/icon-192.png` e `/icon-512.png` existem em `public/`

## 📞 Support

Para mais informações, veja [PWA_SETUP.md](./PWA_SETUP.md)

---

**Status**: ✅ Pronto para produção  
**Versão**: 1.0  
**Data**: 2 de Janeiro de 2026


**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
