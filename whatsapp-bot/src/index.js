import pkg from '@whiskeysockets/baileys'
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = pkg

import qrcode from 'qrcode-terminal'
import { createServer } from 'http'
import { parseMessage } from './parser.js'
import { publishActivityCreate } from './publisher.js'
import { handleCommand } from './commands.js'
import pino from 'pino'

const AUTH_FOLDER = './sessions'
const PORT = process.env.PORT || 3000

let sockInstance = null

// ── HTTP Server ──────────────────────────────────────────────
const server = createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/send') {
        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', async () => {
            try {
                const { phone, text } = JSON.parse(body)
                if (sockInstance && phone && text) {
                    await sockInstance.sendMessage(`${phone}@s.whatsapp.net`, { text })
                    res.writeHead(200)
                    res.end(JSON.stringify({ ok: true }))
                } else {
                    res.writeHead(400)
                    res.end(JSON.stringify({ error: 'missing phone/text or not connected' }))
                }
            } catch (err) {
                res.writeHead(500)
                res.end(JSON.stringify({ error: err.message }))
            }
        })
        return
    }

    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200)
        res.end(JSON.stringify({ status: 'ok', connected: sockInstance !== null }))
        return
    }

    res.writeHead(404)
    res.end()
})

server.listen(PORT, () => console.log(`[BOT] Servidor HTTP na porta ${PORT}`))

// ── WhatsApp ─────────────────────────────────────────────────
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)
    const { version } = await fetchLatestBaileysVersion()

    console.log('[BOT] Usando Baileys versão:', version)

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,  // deixa o Baileys imprimir direto também
        logger: pino({ level: 'warn' })  // mostra warnings e erros
    })

    sock.ev.on('connection.update', async (update) => {
        console.log('[BOT] connection.update:', JSON.stringify(update))

        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('\n========================================')
            console.log('  Escaneie com o WhatsApp:')
            console.log('  Configurações > Dispositivos conectados')
            console.log('========================================\n')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut
            sockInstance = null
            console.log(`[BOT] Desconectado. StatusCode: ${statusCode}. Reconectando: ${shouldReconnect}`)
            if (shouldReconnect) setTimeout(connectToWhatsApp, 5000)
        }

        if (connection === 'open') {
            console.log('[BOT] ✅ Conectado ao WhatsApp!')
            sockInstance = sock
        }
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return

        for (const msg of messages) {
            if (msg.key.fromMe) continue

            const phone = msg.key.remoteJid?.replace('@s.whatsapp.net', '')
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text

            if (!text || !phone) continue

            console.log(`[BOT] Mensagem de ${phone}: "${text}"`)

            try {
                const parsed = parseMessage(text)

                if (parsed.type === 'COMMAND') {
                    await handleCommand(sock, phone, parsed.command, text)
                } else if (parsed.type === 'ACTIVITY') {
                    await publishActivityCreate({
                        phone,
                        category: parsed.category,
                        durationMinutes: parsed.durationMinutes,
                        title: parsed.title,
                        date: new Date().toISOString().split('T')[0],
                        rawMessage: parsed.raw,
                    })
                    await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: '⏳ Registrando atividade...' })
                } else {
                    await handleCommand(sock, phone, 'HELP', text)
                }
            } catch (err) {
                console.error('[BOT] Erro:', err.message)
            }
        }
    })
}

connectToWhatsApp()
