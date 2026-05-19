const CATEGORIES = {
    ESTUDO: ['estud', 'aprend', 'cod', 'program', 'aula', 'curso', 'revis'],
    TREINO: ['trein', 'malh', 'exercit', 'acad', 'corr', 'pedal', 'natac'],
    LEITURA: ['li ', 'lendo', 'leitura', 'livro', 'artigo'],
    ALIMENTACAO: ['comi', 'almoc', 'jantei', 'café', 'refeic'],
    OUTRO: [],
}

function detectCategory(text) {
    const lower = text.toLowerCase()
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
        if (category === 'OUTRO') continue
        if (keywords.some(kw => lower.includes(kw))) return category
    }
    return 'OUTRO'
}

function extractDuration(text) {
    const lower = text.toLowerCase()
    const hoursAndMinutes = lower.match(/(\d+)\s*h\s*(\d+)\s*(?:min)?/)
    if (hoursAndMinutes) return parseInt(hoursAndMinutes[1]) * 60 + parseInt(hoursAndMinutes[2])
    const onlyHours = lower.match(/(\d+)\s*(?:h(?:ora(?:s)?)?)\b/)
    if (onlyHours) return parseInt(onlyHours[1]) * 60
    const onlyMinutes = lower.match(/(\d+)\s*(?:min(?:uto(?:s)?)?)\b/)
    if (onlyMinutes) return parseInt(onlyMinutes[1])
    return null
}

function extractTitle(text) {
    let cleaned = text.toLowerCase()
        .replace(/estudei|aprendi|treinei|malhe[i]?|li\s|corri|pedalei/g, '')
        .replace(/\d+\s*h(?:ora[s]?)?\s*(?:\d+\s*min(?:uto[s]?)?)?/g, '')
        .replace(/\d+\s*min(?:uto[s]?)?/g, '')
        .replace(/hoje|ontem|agora/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    return cleaned.length > 1 ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : null
}

function detectCommand(text) {
    const lower = text.toLowerCase().trim()
    if (['resumo', 'stats', 'estatísticas', 'estatisticas'].includes(lower)) return 'STATS'
    if (['metas', 'goals'].includes(lower)) return 'GOALS'
    if (['ajuda', 'help', 'oi', 'olá', 'ola', 'menu'].includes(lower)) return 'HELP'
    if (lower.startsWith('login ')) return 'LOGIN'
    return null
}

export function parseMessage(text) {
    if (!text || typeof text !== 'string') return { type: 'UNKNOWN', raw: text }
    const trimmed = text.trim()
    const command = detectCommand(trimmed)
    if (command) return { type: 'COMMAND', command, raw: trimmed }
    const category = detectCategory(trimmed)
    const durationMinutes = extractDuration(trimmed)
    const title = extractTitle(trimmed)
    if (durationMinutes || category !== 'OUTRO') {
        return { type: 'ACTIVITY', category, durationMinutes, title, raw: trimmed }
    }
    return { type: 'UNKNOWN', raw: trimmed }
}
