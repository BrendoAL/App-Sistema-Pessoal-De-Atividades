import amqp from 'amqplib'

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'

let channel = null

async function getChannel() {
    if (channel) return channel
    const connection = await amqp.connect(RABBITMQ_URL)
    channel = await connection.createChannel()
    await channel.assertQueue('activity.create', { durable: true })
    await channel.assertQueue('activity.created', { durable: true })
    await channel.assertQueue('activity.error', { durable: true })
    console.log('[PUBLISHER] Conectado ao RabbitMQ')
    return channel
}

export async function publishActivityCreate(payload) {
    const ch = await getChannel()
    ch.sendToQueue('activity.create', Buffer.from(JSON.stringify(payload)), { persistent: true })
    console.log('[PUBLISHER] Publicado em activity.create:', payload)
}
