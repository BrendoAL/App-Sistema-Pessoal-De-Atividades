const CATEGORIES = {
  ESTUDO: ['estud', 'aprend', 'cod', 'program', 'aula', 'curso', 'revis', 'lição', 'lição'],
  TREINO: ['trein', 'malh', 'exercit', 'acad', 'corr', 'pedal', 'pedalei', 'natac', 'academia'],
  LEITURA: ['li ', 'lendo', 'leitura', 'livro', 'artigo', 'leio'],
  ALIMENTACAO: ['comi', 'almoc', 'jantei', 'café', 'refeic', 'diet'],
  OUTRO: [],
};

const COMMANDS = ['resumo', 'stats', 'estatísticas', 'metas', 'ajuda', 'help'];

/**
 * Detecta a categoria da mensagem pelo conteúdo.
 * Retorna a chave ENUM (ex: 'ESTUDO') ou 'OUTRO'.
 */
function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (category === 'OUTRO') continue;
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return 'OUTRO';
}

/**
 * Extrai duração em minutos da mensagem.
 * Suporta: "2h", "1h30", "1h30min", "90min", "30 minutos", "2 horas"
 */
function extractDuration(text) {
  const lower = text.toLowerCase();

  // "1h30min" ou "1h30"
  const hoursAndMinutes = lower.match(/(\d+)\s*h\s*(\d+)\s*(?:min)?/);
  if (hoursAndMinutes) {
    return parseInt(hoursAndMinutes[1]) * 60 + parseInt(hoursAndMinutes[2]);
  }

  // "2h" ou "2 horas"
  const onlyHours = lower.match(/(\d+)\s*(?:h(?:ora(?:s)?)?)\b/);
  if (onlyHours) {
    return parseInt(onlyHours[1]) * 60;
  }

  // "45min" ou "45 minutos"
  const onlyMinutes = lower.match(/(\d+)\s*(?:min(?:uto(?:s)?)?)\b/);
  if (onlyMinutes) {
    return parseInt(onlyMinutes[1]);
  }

  return null;
}

/**
 * Tenta extrair um título/assunto da mensagem.
 * Exemplo: "estudei 2h Python" → "Python"
 */
function extractTitle(text, category) {
  const lower = text.toLowerCase();

  // Remove palavras de ação e tempo
  let cleaned = lower
    .replace(/estudei|aprendi|treinei|malhe[i]?|li\s|corri|pedalei/g, '')
    .replace(/\d+\s*h(?:ora[s]?)?\s*(?:\d+\s*min(?:uto[s]?)?)?/g, '')
    .replace(/\d+\s*min(?:uto[s]?)?/g, '')
    .replace(/hoje|ontem|agora/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 1 ? capitalize(cleaned) : null;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Detecta se é um comando especial (stats, metas, ajuda...).
 */
function detectCommand(text) {
  const lower = text.toLowerCase().trim();
  if (['resumo', 'stats', 'estatísticas', 'estatisticas'].includes(lower)) return 'STATS';
  if (['metas', 'goals'].includes(lower)) return 'GOALS';
  if (['ajuda', 'help', 'oi', 'olá', 'ola', 'menu'].includes(lower)) return 'HELP';
  if (lower.startsWith('meta:') || lower.startsWith('meta ')) return 'CREATE_GOAL';
  if (lower.startsWith('login ')) return 'LOGIN';
  return null;
}

/**
 * Função principal — parseia uma mensagem e retorna o resultado.
 *
 * Retorno:
 * {
 *   type: 'ACTIVITY' | 'COMMAND' | 'UNKNOWN',
 *   command?: string,
 *   category?: string,
 *   durationMinutes?: number,
 *   title?: string,
 *   raw: string
 * }
 */
function parseMessage(text) {
  if (!text || typeof text !== 'string') {
    return { type: 'UNKNOWN', raw: text };
  }

  const trimmed = text.trim();

  // Verifica se é um comando
  const command = detectCommand(trimmed);
  if (command) {
    return { type: 'COMMAND', command, raw: trimmed };
  }

  // Tenta interpretar como atividade
  const category = detectCategory(trimmed);
  const durationMinutes = extractDuration(trimmed);
  const title = extractTitle(trimmed, category);

  // Precisa ter pelo menos duração ou categoria reconhecida
  if (durationMinutes || category !== 'OUTRO') {
    return {
      type: 'ACTIVITY',
      category,
      durationMinutes: durationMinutes || null,
      title,
      raw: trimmed,
    };
  }

  return { type: 'UNKNOWN', raw: trimmed };
}

module.exports = { parseMessage };
