import axios from 'axios'

const ACTIVITY_SERVICE_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:8082'
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:8081'

async function sendMessage(sock, phone, text) {
    await sock.sendMessage(`${phone}@s.whatsapp.net`, { text })
}

async function getUserByPhone(phone) {
    try {
        const { data } = await axios.get(`${USER_SERVICE_URL}/api/users/phone/${phone}`)
        return data
    } catch {
        return null
    }
}

export async function handleCommand(sock, phone, command, originalText) {
    try {
        switch (command) {

            case 'STATS': {
                const user = await getUserByPhone(phone)
                if (!user) {
                    await sendMessage(sock, phone, '❌ Número não vinculado.\nEnvie: *login seu@email.com*')
                    return
                }
                const { data } = await axios.get(`${ACTIVITY_SERVICE_URL}/api/activities/stats/${user.id}`)
                await sendMessage(sock, phone,
                    `📊 *Suas estatísticas de hoje*\n\n` +
                    `✅ Atividades: ${data.todayCount}\n` +
                    `⏱ Tempo: ${data.todayMinutes}min\n\n` +
                    `📅 *Esta semana:*\n` +
                    `✅ Atividades: ${data.weekCount}\n` +
                    `⏱ Tempo: ${data.weekMinutes}min`
                )
                break
            }

            case 'GOALS': {
                const user = await getUserByPhone(phone)
                if (!user) {
                    await sendMessage(sock, phone, '❌ Número não vinculado.\nEnvie: *login seu@email.com*')
                    return
                }
                const { data } = await axios.get(`${ACTIVITY_SERVICE_URL}/api/goals/user/${user.id}`)
                if (!data.length) {
                    await sendMessage(sock, phone, '📋 Nenhuma meta cadastrada.\nCrie com: *meta: estudar 1h por dia*')
                    return
                }
                const lines = data.map(g => `• ${g.category}: ${g.targetMinutes}min/${g.period.toLowerCase()}`).join('\n')
                await sendMessage(sock, phone, `🎯 *Suas metas ativas:*\n\n${lines}`)
                break
            }

            case 'LOGIN': {
                const email = originalText.replace(/login\s+/i, '').trim()
                try {
                    const { data: user } = await axios.get(`${USER_SERVICE_URL}/api/users/email/${email}`)
                    await axios.put(`${USER_SERVICE_URL}/api/users/${user.id}/phone`, { phone })
                    await sendMessage(sock, phone, `✅ Vinculado com sucesso!\nOlá, *${user.name}*! Pode começar a registrar suas atividades.`)
                } catch {
                    await sendMessage(sock, phone, `❌ Email não encontrado: ${email}`)
                }
                break
            }

            case 'HELP':
            default: {
                await sendMessage(sock, phone,
                    `🤖 *Bot de Produtividade*\n\n` +
                    `*Registrar atividade:*\n` +
                    `• "estudei 2h python"\n` +
                    `• "treinei 45min"\n` +
                    `• "li 30min"\n` +
                    `• "estudei 1h30 java"\n\n` +
                    `*Comandos:*\n` +
                    `• *resumo* — stats de hoje\n` +
                    `• *metas* — listar metas\n` +
                    `• *ajuda* — este menu\n\n` +
                    `_Primeiro acesso? Envie: login seu@email.com_`
                )
                break
            }
        }
    } catch (err) {
        console.error('[COMMANDS] Erro:', err.message)
        await sendMessage(sock, phone, '❌ Ocorreu um erro. Tente novamente.')
    }
}
