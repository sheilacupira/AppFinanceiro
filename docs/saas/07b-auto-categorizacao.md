# Etapa 7b: Auto-Categorização Inteligente

**Data:** 20 de fevereiro de 2026  
**Status:** ✅ COMPLETA  
**Build:** ✅ Lint + Build passaram

## 📋 Resumo

Implementada **auto-categorização inteligente** para transações importadas de extratos. O sistema agora:

1. **Analisa automaticamente a descrição** de cada transação
2. **Sugere uma categoria** baseada em keywords e fuzzy matching
3. **Permite revisão e ajuste** na UI antes de importar
4. **Aplica a categoria corrigida** ao salvar

---

## 🎯 Features Implementadas

### 1. **Category Matcher (src/lib/categoryMatcher.ts)**

Base de dados inteligente com:

- **9 categorias principais** (Alimentação, Saúde, Educação, Transporte, Utilidades, Entretenimento, Vestuário, Compras, Cartão)
- **Levenshtein Distance** para fuzzy matching (tolerância de typos ~75%)
- **Merchant Detection** com nomes conhecidos (Carrefour, Netflix, Shell, etc)
- **Scoring system** com peso:
  - Exact merchant match: 0.95
  - Keyword exact: 0.7
  - Fuzzy match: 0.5 × similarity

### 2. **Statement Import Updates (src/lib/statementImport.ts)**

- ✅ Novo campo `suggestedCategoryId` em `StatementItem`
- ✅ Auto-categorização ao fazer parse (OFX e CSV)
- ✅ Propagação para `Transaction` via `buildTransactionsFromItems`

### 3. **UI com Seletor de Categoria (src/components/StatementImportManager.tsx)**

- ✅ Coluna "Categoria" na tabela preview
- ✅ Dropdown com todas as 9 categorias
- ✅ Override de categoria (user pode mudar antes de importar)
- ✅ Estado `categoryOverrides` rastreia mudanças
- ✅ Aplicação das categorias customizadas no import

---

## 🔍 How It Works

### Fluxo de Categorização

```
1. User faz upload de CSV/OFX
       ↓
2. Parser detecta format e lê transações
       ↓
3. Para CADA transação:
   - Chama categorizeTransaction(description)
   - Returns: {categoryId, confidence, alternatives}
   ↓
4. UI mostra preview com categoria sugerida
       ↓
5. User pode:
   - Aceitar sugestão (default)
   - Mudar via dropdown
   ↓
6. Clica "Importar" com categorias finais
       ↓
7. Transações salvas com categorias corretas
```

### Exemplo de Correspondências

| Descrição               | Categoria         | Confiança | Motivo                      |
|------------------------|-------------------|-----------|------------------------------|
| "Padaria do João"      | Alimentação       | 0.70      | Keyword "padaria"            |
| "Netflix"              | Entretenimento    | 0.95      | Exact merchant match         |
| "Shell Combustível"    | Transporte        | 0.89      | Merchant + keyword           |
| "Hospital XYZ"         | Saúde             | 0.70      | Fuzzy match "hospital"       |
| "Uber 15.50"           | Transporte        | 0.95      | Exact merchant match         |
| "Transferência P2P"    | Compras           | 0.00      | Sem match (fallback)         |

---

## 📁 Arquivos Modificados/Criados

### Novos:
- `src/lib/categoryMatcher.ts` (210 linhas)
  - `categorizeTransaction()` - Sugere categoria com confiança
  - `getAllCategories()` - Lista todas as 9 categorias
  - `getCategoryById()` - Busca categoria por ID
  - Implementação de Levenshtein Distance

### Atualizados:
- `src/lib/statementImport.ts`
  - Adicionado `suggestedCategoryId` a `StatementItem`
  - Integração de `categorizeTransaction()` em `parseOfx()` e `parseCsvWithMapping()`
  - Atualização de `buildTransactionsFromItems()` para usar categoria sugerida

- `src/components/StatementImportManager.tsx`
  - Importação de `getAllCategories`
  - Novo estado `categoryOverrides: Map<string, string>`
  - Nova coluna "Categoria" na tabela preview
  - Dropdown select para cada transação
  - Aplicação de overrides no `handleImport()`

---

## 🧪 Teste Manual

1. **Fazer upload de CSV/OFX**
   ```
   → Ir em Configurações → Importar Extrato
   → Selecionar arquivo exemplo ou real
   ```

2. **Verificar categorias sugeridas**
   ```
   → Preview mostra cada transação com categoria
   → Coluna "Categoria" tem dropdown
   ```

3. **Ajustar categorias (opcional)**
   ```
   → Clica no dropdown de uma transação
   → Seleciona categoria diferente
   ```

4. **Importar com categorias corretas**
   ```
   → Clica "Importar N lançamentos"
   → Transações aparecem na aba Mês com categorias
   ```

---

## 📊 Base de Dados de Categorias

Cada categoria tem:
- `id` - identificador único (ex: "alimentacao")
- `name` - nome legível (ex: "Alimentação")
- `keywords` - lista de palavras-chave
- `merchants` - nomes de empresas conhecidas

**Categorias:**
1. Alimentação (Padaria, Supermercado, Restaurante, etc)
2. Saúde (Farmácia, Médico, Hospital, Dentista, etc)
3. Educação (Escola, Livro, Curso, Universidade, etc)
4. Transporte (Uber, Taxi, Ônibus, Combustível, etc)
5. Utilidades (Água, Luz, Gás, Telefone, Internet, etc)
6. Entretenimento (Netflix, Cinema, Spotify, Shows, etc)
7. Vestuário (Roupa, Sapato, Loja de roupas, etc)
8. Compras (Amazon, Marketplace, E-commerce, etc)
9. Cartão (Fatura, Juros, Anuidade, etc)

---

## 🚀 Próximos Passos (Etapa 7c)

- **Open Finance Integration**: Conectar direto com agregadores (Belvo, Pluggy)
- **Merchant Database**: Expandir com mais merchants brasileiros
- **ML Categorization** (opcional): Treinar modelo com histórico do user

---

## ✅ Validação

- ✅ Lint: 0 errors
- ✅ Build: Sem erros TypeScript
- ✅ Bundle size: 848.68 kB (aceitável)
- ✅ PWA: Gerado com sucesso

---

**Próxima reunião:** Etapa 7c (Open Finance) ou Bloco C (Billing)
