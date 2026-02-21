# ⚡ Guia Rápido: Instalar em Outro Dispositivo (30 segundos)

## 🎯 3 Passos Simples

### Passo 1️⃣: Preparar no Computador
```bash
cd /Users/macos/Downloads/pocket-ledger-main

# Compilar (primeira vez leva 5 segundos)
npm run build

# Servir
./serve-pwa.sh
```

Você verá algo como:
```
Available on:
  http://127.0.0.1:3000
  http://192.168.3.11:3000  ← USE ESTE!
```

### Passo 2️⃣: Abrir em Outro Dispositivo

**No smartphone/tablet/outro PC:**

1. Abra o navegador (Chrome, Firefox, Safari)
2. Digite na barra de endereço: `http://192.168.3.11:3000`
   - Substitua `192.168.3.11` pelo IP do seu computador
3. Pressione Enter

### Passo 3️⃣: Instalar o App

**Android/Windows/Linux:**
- Clique em "Instalar" quando aparecer (ou ícone no canto da barra)

**iPhone/iPad:**
1. Clique no ícone de compartilhar (canto inferior)
2. Role para baixo
3. Clique "Adicionar à Tela Inicial"

**Pronto! ✅**

---

## 📍 Como Encontrar o IP do Computador

### macOS:
```bash
ipconfig getifaddr en0
```

### Windows:
```bash
ipconfig
# Procure por "IPv4 Address"
```

### Linux:
```bash
hostname -I
```

---

## ❓ Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Não consigo acessar" | Certifique-se que os dois estão na mesma WiFi |
| "Botão Instalar não aparece" | Atualize o navegador (precisa ser recente) |
| "App crasheou" | Feche e abra novamente (dados salvam localmente) |
| "Dados sumiram" | Use Configurações → Importar para restaurar |

---

## 💡 Dicas Úteis

✅ **Dados seguros**: Ninguém consegue acessar seus dados - salvam localmente  
✅ **Funciona offline**: Depois de instalar, trabalha sem internet  
✅ **Múltiplos dispositivos**: Importe/exporte dados nas Configurações  
✅ **Voltar depois**: Se parar o servidor, o app continua instalado  

---

## 🔄 Se Precisar Parar e Reiniciar

```bash
# Parar o servidor
Ctrl + C

# Reiniciar depois
cd /Users/macos/Downloads/pocket-ledger-main
./serve-pwa.sh
```

Os apps já instalados **continuam funcionando** mesmo sem o servidor!

---

**Tudo pronto! Divirta-se! 🎉**
