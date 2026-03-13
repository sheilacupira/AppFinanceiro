/**
 * Smart category matcher for transaction descriptions
 * Uses keyword matching, fuzzy matching, and merchant detection
 */

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
};

// Calculate similarity score (0-1)
const calculateSimilarity = (str1: string, str2: string): number => {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
};

// Category definition with keywords and merchants
interface CategoryDefinition {
  id: string;
  name: string;
  keywords: string[];
  merchants: string[]; // Known merchant names
}

const CATEGORY_DB: CategoryDefinition[] = [
  {
    id: 'food',
    name: 'Alimentação',
    keywords: ['padaria', 'supermercado', 'mercado', 'açougue', 'pão', 'restaurante', 'pizza', 'hamburger', 'lanchonete', 'café', 'bar', 'boteco', 'churrascaria', 'alimento', 'comida', 'bebida', 'hortifruti', 'mercearia', 'panificadora'],
    merchants: ['pão de açúcar', 'carrefour', 'extra', 'walmart', 'dia', 'prezunic', 'mcdonald', 'burger king', 'subway', 'starbucks', 'ifood', 'rappi', 'assai', 'atacadao', 'nordestao', 'bom preco', 'g barbosa'],
  },
  {
    id: 'health',
    name: 'Saúde',
    keywords: ['farmácia', 'farmacia', 'pharmacy', 'medicamento', 'remédio', 'droga', 'drogaria', 'médico', 'medico', 'consulta', 'hospital', 'clinica', 'clínica', 'dentista', 'oftalmologista', 'plano de saude', 'convenio', 'convênio', 'exame', 'laboratorio', 'laborató'],
    merchants: ['drogasil', 'drogaria sao paulo', 'farmais', 'drogaria paulista', 'pague menos', 'ultrafarma', 'droga raia'],
  },
  {
    id: 'education',
    name: 'Educação',
    keywords: ['escola', 'faculdade', 'universidade', 'cursos', 'curso', 'livro', 'livraria', 'educação', 'educacao', 'aula', 'professor', 'mensalidade escolar', 'enem', 'vestibular', 'material escolar', 'colegio', 'colégio'],
    merchants: ['biblioteca', 'saraiva', 'estante magica', 'udemy', 'coursera', 'alura'],
  },
  {
    id: 'transport',
    name: 'Transporte',
    keywords: ['uber', 'taxi', 'táxi', 'ônibus', 'onibus', 'metro', 'combustível', 'combustivel', 'gasolina', 'diesel', 'alcool', 'álcool', 'estacionamento', 'metrô', 'passagem', 'transporte', 'saque dinheiro', 'banco 24h', 'carro', 'automovel', 'automóvel'],
    merchants: ['shell', 'br distribuidora', 'esso', 'chevron', 'ipiranga', '99taxi', 'beat', 'posto', 'north shop'],
  },
  {
    id: 'bills',
    name: 'Contas',
    keywords: ['água', 'agua', 'luz', 'eletricidade', 'eletrica', 'energia', 'telefone', 'internet', 'gas', 'gás', 'conta', 'fatura', 'utilidade', 'iof', 'iptu', 'ipva', 'boleto', 'cobran', 'pre-pago', 'recarga', 'celular pre'],
    merchants: ['cemig', 'copasa', 'companhia de gás', 'vivo', 'claro', 'oi', 'tim', 'embratel', 'net', 'neoenergia', 'coelce', 'celpe', 'equatorial'],
  },
  {
    id: 'entertainment',
    name: 'Lazer',
    keywords: ['netflix', 'spotify', 'cinema', 'filme', 'teatro', 'show', 'concerto', 'musica', 'música', 'jogos', 'jogo', 'game', 'streaming', 'disney', 'hbo', 'amazon prime', 'lazer', 'diversao', 'viagem', 'hotel', 'pousada', 'turismo'],
    merchants: ['ingresso', 'sympla', 'cinemark', 'cinesystem', 'playstation', 'xbox', 'prime video'],
  },
  {
    id: 'shopping',
    name: 'Compras',
    keywords: ['roupa', 'roupas', 'sapato', 'calçado', 'calcado', 'moda', 'loja', 'boutique', 'vestuario', 'amazon', 'mercado livre', 'shop', 'store', 'online', 'moda mundial', 'rei do terno', 'cea pay'],
    merchants: ['renner', 'riachuelo', 'forum', 'zara', 'hm', 'adidas', 'nike', 'amazon', 'mercado livre', 'shopee', 'shein', 'aliexpress', 'c&a'],
  },
  {
    id: 'credit-card',
    name: 'Cartão de Crédito',
    keywords: [
      // BB
      'pagto cart', 'pagamento cartao', 'pagamento cartão', 'pagto cartao', 'pagto cartão',
      // Genérico
      'fatura cartao', 'fatura cartão', 'fatura nubank', 'fatura c6', 'fatura inter',
      'cartao credito', 'cartão crédito', 'cartao de credito', 'cartão de crédito',
      'visa', 'mastercard', 'anuidade', 'juros cartao',
    ],
    merchants: ['nubank', 'c6 bank', 'inter'],
  },
  {
    id: 'financing',
    name: 'Financiamento',
    keywords: [
      'financiamento', 'prestacao', 'prestação', 'parcela', 'siac', 'cielo',
      'financ imovel', 'financ imóvel', 'credito imobi', 'crédito imobi',
      'caixa econo', 'cef ', 'banco do brasil habi', 'bb hab',
      'consorcio', 'consórcio', 'leasing', 'finame',
      'gravata empreend', 'empreendimento', 'imobil',
    ],
    merchants: ['caixa economica', 'cef', 'bb imobiliario'],
  },
  {
    id: 'housing',
    name: 'Moradia',
    keywords: ['aluguel', 'condominio', 'condomínio', 'reforma', 'construcao', 'construção', 'casa', 'apartamento', 'imovel', 'imóvel', 'manutencao', 'manutenção', 'pintura', 'eletricista', 'encanador'],
    merchants: ['loja de material', 'leroy merlin', 'telhanorte', 'c&c', 'dicico'],
  },
  {
    id: 'investment',
    name: 'Investimento',
    keywords: ['rende facil', 'rende fácil', 'bb rende', 'poupanca', 'poupança', 'cdb', 'lci', 'lca', 'tesouro', 'fundo', 'aplicacao', 'aplicação', 'investimento', 'acao', 'ações', 'bolsa'],
    merchants: ['xp investimentos', 'rico', 'clear', 'btg', 'nubank'],
  },
];

interface MatchResult {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-1, higher is better
}

interface CategorizeResult extends MatchResult {
  alternatives: MatchResult[];
}

/**
 * Suggest a category for a transaction description
 * Uses keyword matching + fuzzy matching + merchant detection
 */
export const categorizeTransaction = (description: string): CategorizeResult => {
  const normalizedDesc = description.toLowerCase().trim();
  const scores: Map<string, number> = new Map();

  // Initialize scores
  CATEGORY_DB.forEach((cat) => {
    scores.set(cat.id, 0);
  });

  // 1. Exact merchant matching (highest priority)
  CATEGORY_DB.forEach((cat) => {
    cat.merchants.forEach((merchant) => {
      if (normalizedDesc.includes(merchant.toLowerCase())) {
        scores.set(cat.id, (scores.get(cat.id) || 0) + 0.95);
      }
    });
  });

  // 2. Keyword matching
  CATEGORY_DB.forEach((cat) => {
    cat.keywords.forEach((keyword) => {
      if (normalizedDesc.includes(keyword.toLowerCase())) {
        scores.set(cat.id, (scores.get(cat.id) || 0) + 0.7);
      }
    });
  });

  // 3. Fuzzy matching on keywords (for typos, partial matches)
  const descWords = normalizedDesc.split(/\s+/).filter((w) => w.length > 3);
  CATEGORY_DB.forEach((cat) => {
    cat.keywords.forEach((keyword) => {
      descWords.forEach((word) => {
        const similarity = calculateSimilarity(word, keyword);
        if (similarity > 0.75) {
          scores.set(cat.id, (scores.get(cat.id) || 0) + similarity * 0.5);
        }
      });
    });
  });

  // Find top matches
  const results: MatchResult[] = CATEGORY_DB
    .map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      confidence: Math.min(1, scores.get(cat.id) || 0),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .filter((r) => r.confidence > 0);

  const topMatch = results[0] || {
    categoryId: 'other-expense',
    categoryName: 'Outros (Saída)',
    confidence: 0,
  };

  return {
    ...topMatch,
    alternatives: results.slice(1, 4),
  };
};

/**
 * Get all available categories
 */
export const getAllCategories = (): CategoryDefinition[] => {
  return CATEGORY_DB;
};

/**
 * Get category by ID
 */
export const getCategoryById = (id: string): CategoryDefinition | undefined => {
  return CATEGORY_DB.find((cat) => cat.id === id);
};
