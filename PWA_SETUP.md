# 📱 Guia de Instalação do Financeiro como PWA

## ✅ Status do Projeto

O projeto **Financeiro** foi preparado como Progressive Web App (PWA) com as seguintes características:

- ✅ **Offline-first**: Todos os dados são salvos localmente no navegador (IndexedDB/LocalStorage)
- ✅ **Sem Backend**: Funciona completamente independente de servidores
- ✅ **Service Worker**: Cache automático de arquivos para funcionamento offline
- ✅ **Instalável**: Pode ser instalado em smartphones, tablets e desktops
- ✅ **Sincronização**: Funciona em múltiplos dispositivos (com exportação/importação de dados)

---

## 📋 Requisitos

- Um servidor web com HTTPS (importante para segurança e PWA)
- Navegador moderno (Chrome, Firefox, Safari 11+, Edge)
- Conexão de internet apenas para a instalação inicial

---

## 🚀 Instalação em Outro Dispositivo

### Opção 1: Usando o Servidor de Desenvolvimento (mesma rede)

**No computador com o projeto:**
```bash
npm run dev
```

O servidor iniciará em: `http://localhost:8080/` e `http://[SEU_IP]:8080/`

**No outro dispositivo (smartphone, tablet, outro PC):**
1. Abra o navegador e acesse: `http://[SEU_IP]:8080/`
   - Substitua `[SEU_IP]` pelo IP mostrado no terminal (ex: `192.168.3.11`)
2. A página carregará e mostrará a opção de instalar
3. Clique em "Instalar" ou no menu do navegador → "Instalar aplicativo"

### Opção 2: Usando a Build de Produção (RECOMENDADO para múltiplos dispositivos)

**No computador:**

1. **Compilar o projeto:**
```bash
npm run build
```

2. **Servir a versão compilada:**
```bash
npx http-server dist -p 3000 -g
```

Você verá:
```
Available on:
  http://127.0.0.1:3000
  http://[SEU_IP]:3000
```

**No outro dispositivo:**
1. Abra o navegador e acesse: `http://[SEU_IP]:3000/`
2. Clique em "Instalar" ou no menu do navegador → "Instalar aplicativo"

### Opção 3: Deploy em um Servidor com HTTPS (melhor solução)

Para usar em qualquer lugar, sem estar na mesma rede:

1. **Fazer o upload da pasta `dist/` para um servidor web:**
   - Vercel (recomendado, grátis)
   - GitHub Pages
   - Netlify
   - Seu próprio servidor

2. **Exemplo com Vercel:**
```bash
npm install -g vercel
vercel
```

3. **Acessar de qualquer lugar:**
   - Qualquer dispositivo pode acessar `https://seu-dominio.com`
   - Instalar como app normalmente

---

## 📲 Como Instalar em Diferentes Dispositivos

### 📱 Android (Chrome/Firefox)
1. Abra o app no navegador
2. Você verá um prompt "Instalar" no topo
3. Clique em "Instalar"
4. O app aparecerá na tela inicial como um ícone

### 🍎 iOS/iPadOS (Safari)
1. Abra o app no Safari
2. Clique no botão "Compartilhar" (canto inferior)
3. Role para baixo e clique "Adicionar à Tela Inicial"
4. Escolha um nome e clique "Adicionar"

### 💻 Windows/Linux (Chrome/Edge)
1. Abra o app no navegador
2. Clique no ícone de instalação (canto superior direito)
3. Clique "Instalar"
4. O app será adicionado ao menu Iniciar/Aplicativos

### 🖥️ macOS (Safari/Chrome)
1. Abra o app no navegador
2. Clique no menu (⋮ ou Safari)
3. Selecione "Adicionar à Dock" ou "Instalar app"

---

## 💾 Sincronização Entre Dispositivos

### Exportar Dados:
1. Abra o app e vá para **Configurações**
2. Clique em **"Exportar Dados"**
3. Um arquivo JSON será baixado

### Importar Dados:
1. Abra o app em outro dispositivo
2. Vá para **Configurações**
3. Clique em **"Importar Dados"**
4. Selecione o arquivo JSON exportado

---

## 🔧 Configuração Técnica

O PWA inclui:

- **manifest.json**: Define como o app aparece
- **Service Worker**: Cache inteligente de arquivos
- **Workbox**: Estratégia de cache avançada
- **HTTPS**: Recomendado para produção

### Arquivos Importantes:
```
dist/
├── index.html          # Página principal
├── sw.js              # Service Worker
├── manifest.webmanifest # Configuração PWA
└── assets/            # CSS, JS, ícones
```

---

## 🐛 Troubleshooting

**Problema**: Não consigo instalar o app
- Solução: Use HTTPS em produção, HTTP com localhost
- Verifique se o manifest.json é válido

**Problema**: App não funciona offline
- Solução: Service Worker precisa ter sido registrado
- Abra DevTools → Applications → Service Workers
- Verifique se está "activated"

**Problema**: Dados não sincronizam entre dispositivos
- Solução: Use exportar/importar de dados via Settings
- Ou implemente um backend (não necessário para uso offline)

**Problema**: Ícone não aparece corretamente
- Solução: Verifique se `/icon-192.png` e `/icon-512.png` existem em `public/`

---

## 📊 Próximos Passos

1. **Testar em múltiplos dispositivos** ✅
2. **Exportar/Importar dados** se necessário
3. **Customizar ícones** (colocar logo do app)
4. **Deploy em servidor HTTPS** para acesso remoto

---

## 📚 Referências

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google: Web Fundamentals PWA](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

**Versão**: 1.0  
**Data**: 2 de Janeiro de 2026  
**Status**: ✅ Pronto para produção
