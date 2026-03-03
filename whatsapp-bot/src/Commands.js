// commands.js — Lida com comandos especiais do bot

const axios = require('axios');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
const ACTIVITY_SERVICE_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:8082';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:8081';

/**
 * Envia uma mensagem de volta para o usuário no WhatsApp.
 */
async function sendMessage(phone, text) {
  await axios.post(
    `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
    { number: phone, text },
    { headers: { apikey: EVOLUTION_API_KEY } }
  );
}

/**
 * Lida com cada tipo de comando.
 */
async function handleCommand(phone, command, originalText) {
  try {
    switch (command) {

      case 'STATS': {
        const user = await getUserByPhone(phone);
        if (!user) { await sendMessage(phone, '❌ Número não vinculado. Envie: login seu@email.com'); return; }

        const { data } = await axios.get(`${ACTIVITY_SERVICE_URL}/api/activities/stats/${user.id}`);
        const msg =
          `📊 *Suas estatísticas de hoje*\n\n` +
          `✅ Atividades: ${data.todayCount}\n` +
          `⏱ Tempo total: ${data.todayMinutes}min\n\n` +
          `📅 *Esta semana:*\n` +
          `✅ Atividades: ${data.weekCount}\n` +
          `⏱ Tempo total: ${data.weekMinutes}min`;

        await sendMessage(phone, msg);
        break;
      }

      case 'GOALS': {
        const user = await getUserByPhone(phone);
        if (!user) { await sendMessage(phone, '❌ Número não vinculado. Envie: login seu@email.com'); return; }

        const { data } = await axios.get(`${ACTIVITY_SERVICE_URL}/api/goals/user/${user.id}`);
        if (!data.length) {
          await sendMessage(phone, '📋 Nenhuma meta cadastrada.\nCrie com: meta: estudar 1h por dia');
          return;
        }
        const lines = data.map(g => `• ${g.category}: ${g.targetMinutes}min/${g.period.toLowerCase()}`).join('\n');
        await sendMessage(phone, `🎯 *Suas metas ativas:*\n\n${lines}`);
        break;
      }

      case 'LOGIN': {
        const email = originalText.replace(/login\s+/i, '').trim();
        const { data: user } = await axios.get(`${USER_SERVICE_URL}/api/users/email/${email}`).catch(() => ({ data: null }));
        if (!user) {
          await sendMessage(phone, `❌ Email não encontrado: ${email}`);
          return;
        }
        await axios.put(`${USER_SERVICE_URL}/api/users/${user.id}/phone`, { phone });
        await sendMessage(phone, `✅ Número vinculado com sucesso!\nOlá, *${user.name}*! Pode começar a registrar suas atividades.`);
        break;
      }

      case 'HELP':
      default: {
        const helpMsg =
          `🤖 *Bot de Produtividade*\n\n` +
          `*Registrar atividade:*\n` +
          `• "estudei 2h python"\n` +
          `• "treinei 45min"\n` +
          `• "li 30min"\n` +
          `• "estudei 1h30 java"\n\n` +
          `*Comandos:*\n` +
          `• resumo — ver stats de hoje\n` +
          `• metas — listar metas\n` +
          `• meta: estudar 1h por dia\n` +
          `• ajuda — este menu\n\n` +
          `_Primeiro acesso? Envie: login seu@email.com_`;

        await sendMessage(phone, helpMsg);
        break;
      }
    }
  } catch (err) {
    console.error('[COMMANDS] Erro:', err.message);
    await sendMessage(phone, '❌ Ocorreu um erro. Tente novamente mais tarde.');
  }
}

async function getUserByPhone(phone) {
  try {
    const { data } = await axios.get(`${USER_SERVICE_URL}/api/users/phone/${phone}`);
    return data;
  } catch {
    return null;
  }
}

module.exports = { handleCommand };