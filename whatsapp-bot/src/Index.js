// index.js — Entry point do whatsapp-bot

const express = require('express');
const { parseMessage } = require('./parser');
const { publishActivityCreate } = require('./publisher');
const { handleCommand } = require('./commands');

const app = express();
app.use(express.json());

const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

// ─────────────────────────────────────────
// WEBHOOK — recebe eventos da Evolution API
// ─────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  // Valida API Key (Evolution API envia no header)
  const apiKey = req.headers['apikey'];
  if (apiKey !== EVOLUTION_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const event = req.body;

  // Filtra apenas mensagens de texto recebidas
  if (event.event !== 'messages.upsert') {
    return res.sendStatus(200);
  }

  const message = event.data?.message;
  const fromMe = event.data?.key?.fromMe;
  const phone = event.data?.key?.remoteJid?.replace('@s.whatsapp.net', '');
  const text = message?.conversation || message?.extendedTextMessage?.text;

  // Ignora mensagens enviadas por mim ou sem texto
  if (fromMe || !text || !phone) {
    return res.sendStatus(200);
  }

  console.log(`[BOT] Mensagem de ${phone}: "${text}"`);

  try {
    const parsed = parseMessage(text);
    console.log(`[BOT] Parsed:`, parsed);

    if (parsed.type === 'COMMAND') {
      await handleCommand(phone, parsed.command, text);
    } else if (parsed.type === 'ACTIVITY') {
      await publishActivityCreate({
        phone,
        category: parsed.category,
        durationMinutes: parsed.durationMinutes,
        title: parsed.title,
        date: new Date().toISOString().split('T')[0],
        rawMessage: parsed.raw,
      });
    } else {
      // Não entendeu — manda mensagem de ajuda
      await handleCommand(phone, 'UNKNOWN', text);
    }
  } catch (err) {
    console.error('[BOT] Erro ao processar mensagem:', err.message);
  }

  res.sendStatus(200);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'whatsapp-bot' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[BOT] Servidor rodando na porta ${PORT}`);
});