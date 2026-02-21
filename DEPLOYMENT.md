# 🚀 Financeiro PWA - Guia de Deployment

## ✅ Build Compilado com Sucesso!

A pasta `dist/` contém a versão compilada e otimizada do app, pronta para produção.

---

## 📱 Como Rodar em Qualquer Aparelho

### **Opção 1: Na Mesma Rede (Mais Fácil - 30 segundos)**

```bash
# No seu computador:
./serve-pwa.sh
```

O script vai mostrar dois endereços:
- **Local**: `http://localhost:3000` (só seu computador)
- **Rede**: `http://192.168.X.X:3000` (qualquer dispositivo na mesma rede)

**Em outro dispositivo (smartphone, tablet, outro PC):**
1. Conecte na mesma rede Wi-Fi
2. Abra o navegador
3. Digite o endereço de rede (ex: `http://192.168.3.10:3000`)
4. Clique em "Instalar" (Chrome, Firefox, Edge) ou Menu → "Adicionar à Tela Inicial" (Safari)

---

### **Opção 2: Com Node.js Instalado**

```bash
# Instalar dependência de servidor HTTP
npm install -g http-server

# Servir a pasta dist
cd /Users/macos/Downloads/AppFinanceiro-main
http-server dist -p 3000 -c-1
```

Depois acesse em outro dispositivo como na Opção 1.

---

### **Opção 3: Deploy em Servidor Online**

Se quiser rodar o app **permanentemente online**, você pode fazer deploy em:

#### **Vercel (Recomendado - Grátis)**
```bash
npm install -g vercel
vercel deploy
```

#### **Netlify (Também Grátis)**
Arraste a pasta `dist/` para: https://app.netlify.com/drop

#### **GitHub Pages**
```bash
# Crie um repositório no GitHub
git init
git add .
git commit -m "Deploy Financeiro PWA"
git remote add origin https://github.com/seu-usuario/seu-repo.git
git push -u origin main
```

Depois ative GitHub Pages nas configurações do repositório.

---

## 📊 Informações do Build

| Métrica | Valor |
|---------|-------|
| **CSS Minificado** | 59.58 kB (gzip: 10.54 kB) |
| **JavaScript** | 803.41 kB (gzip: 234.06 kB) |
| **Service Worker** | Configurado ✅ |
| **PWA Manifest** | Configurado ✅ |
| **Cache Inteligente** | Ativo ✅ |

---

## 🔒 Privacidade & Segurança

✅ **Todos os dados são salvos LOCALMENTE** no seu dispositivo  
✅ **Nenhuma informação é enviada para servidor** (offline-first)  
✅ **Funciona sem Internet** depois de instalado  
✅ **Sincronize entre dispositivos** via Configurações → Exportar/Importar  

---

## 🎯 Funcionalidades Implementadas

✅ Gerenciamento de transações (entradas/saídas)  
✅ Transações recorrentes (aparecem no dia 1 automaticamente)  
✅ Categorias personalizadas  
✅ Gráfico de gastos por categoria (pizza chart)  
✅ Filtro por intervalo de datas  
✅ Busca e filtros avançados  
✅ Editar/deletar transações individuais  
✅ Tema claro/escuro  
✅ Instalável como app nativo  
✅ Dízimo automático (opcional)  

---

## 📥 Fazer Backup dos Dados

Se mudar de dispositivo:

1. Abra o app
2. Vá para **Configurações**
3. Clique em **"Exportar Dados"**
4. Salve o arquivo JSON

Para restaurar em outro dispositivo:
1. Abra o app
2. Vá para **Configurações**
3. Clique em **"Importar Dados"**
4. Selecione o arquivo JSON

---

## ✨ Próximas Melhorias (Opcionais)

- [ ] Backup automático diário
- [ ] Swipe gestures para fechar modais
- [ ] Relatórios mensais/anuais avançados
- [ ] Metas de gastos por categoria
- [ ] Integração com calendário

---

## 🆘 Troubleshooting

**P: O app não carrega?**  
R: Verifique se ambos dispositivos estão na mesma rede Wi-Fi

**P: Dados não aparecem após fechar?**  
R: O Service Worker pode estar em cache. Limpe dados do site e reabra

**P: Como instalar em iPhone?**  
R: Safari → Compartilhar → "Adicionar à Tela Inicial"

**P: Pode usar com Internet instável?**  
R: Sim! Após primeira carga, funciona offline completamente

---

**Divirta-se controlando suas finanças! 💰✨**
