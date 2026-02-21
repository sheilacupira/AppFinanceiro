# Etapa 7b — Auto-categorização inteligente

## Objetivo
Aplicar auto-categorização de transações importadas com base em keywords, merchants e fuzzy matching.

## Status
✅ Concluída

## Entregas implementadas

- **Category Matcher** com 9 categorias principais e fuzzy matching (Levenshtein).
- **Merchant Detection** com nomes conhecidos (Carrefour, Netflix, Shell, etc.).
- **Scoring system** com exact match (0.95), keyword exact (0.7), fuzzy (0.5 × similarity).
- Auto-categorização ao parser de OFX/CSV com campo `suggestedCategoryId`.
- UI com dropdown de categoria na tabela de preview de importação.
- Edição inline permitindo que o usuário corrija categoria antes de importar.

## Arquivos principais

- `src/lib/categoryMatcher.ts` — Lógica de matching e scoring.
- `src/lib/statementImport.ts` — Aplicação de categorização no parse.
- `src/components/StatementImportManager.tsx` — Seletor de categoria na preview.

## Como validar

1. Abra Configurações.
2. Importe um arquivo CSV ou OFX.
3. Verifique que a coluna "Categoria" sugere valores automaticamente.
4. Ajuste manualmente se necessário, clicando no dropdown.
5. Confirme a importação e valide que transações ficaram com categorias corretas.

## Próxima etapa

- Integração Open Finance (Belvo, Pluggy) para importação automática.
- Expansão da base de merchants brasileiros.
- ML opcional: modelo treinado com histórico do usuário.

---

**Última atualização:** 21/02/2026
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

## Arquivos principais

### Novos
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

## Como validar

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

## Base de dados de categorias

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

## Próxima etapa
- Integração Open Finance (Belvo, Pluggy) para importação automática.
- Expansão da base de merchants brasileiros.
- ML opcional: modelo treinado com histórico do usuário.
