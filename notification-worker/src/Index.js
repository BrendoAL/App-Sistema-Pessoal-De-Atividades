const amqp = require('amqplib');
const axios = require('axios');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

async function sendWhatsApp(phone, text) {
  try {
    await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      { number: phone, text },
      { headers: { apikey: EVOLUTION_API_KEY } }
    );
  } catch (err) {
    console.error('[WORKER] Falha ao enviar mensagem:', err.message);
  }
}

async function start() {
  console.log('[WORKER] Conectando ao RabbitMQ...');
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue('activity.created', { durable: true });
  await channel.assertQueue('activity.error', { durable: true });

  console.log('[WORKER] Aguardando eventos...');

  //Atividade criada
  channel.consume('activity.created', async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log('[WORKER] activity.created:', event);

    if (event.phone) {
      const duration = event.durationMinutes
        ? `${event.durationMinutes}min`
        : '';
      const category = formatCategory(event.category);
      const title = event.title ? ` — ${event.title}` : '';

      await sendWhatsApp(
        event.phone,
        `✅ Registrado! ${duration} de ${category}${title}`
      );
    }

    channel.ack(msg);
  });

  //Erro ao criar atividade
  channel.consume('activity.error', async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log('[WORKER] activity.error:', event);

    if (event.phone) {
      await sendWhatsApp(
        event.phone,
        `❌ Não consegui registrar: ${event.error || 'erro desconhecido'}\nMensagem original: "${event.originalMessage}"`
      );
    }

    channel.ack(msg);
  });
}

function formatCategory(cat) {
  const map = {
    ESTUDO: 'Estudo',
    TREINO: 'Treino',
    LEITURA: 'Leitura',
    ALIMENTACAO: 'Alimentação',
    OUTRO: 'Atividade',
  };
  return map[cat] || cat;
}

start().catch(err => {
  console.error('[WORKER] Erro fatal:', err);
  process.exit(1);
});