// parser.test.js — Jest com ES Modules
// Para rodar: jest --experimental-vm-modules

import { parseMessage } from './parser.js'

describe('parseMessage()', () => {

    describe('atividades de ESTUDO', () => {
        test('deve reconhecer "estudei 2h python"', () => {
            const result = parseMessage('estudei 2h python')
            expect(result.type).toBe('ACTIVITY')
            expect(result.category).toBe('ESTUDO')
            expect(result.durationMinutes).toBe(120)
        })
        test('deve reconhecer "estudei 1h30 java"', () => {
            const result = parseMessage('estudei 1h30 java')
            expect(result.durationMinutes).toBe(90)
        })
        test('deve reconhecer "estudei 45min"', () => {
            expect(parseMessage('estudei 45min').durationMinutes).toBe(45)
        })
    })

    describe('atividades de TREINO', () => {
        test('deve reconhecer "treinei 45min"', () => {
            const result = parseMessage('treinei 45min')
            expect(result.category).toBe('TREINO')
            expect(result.durationMinutes).toBe(45)
        })
    })

    describe('atividades de LEITURA', () => {
        test('deve reconhecer "li 30 minutos"', () => {
            const result = parseMessage('li 30 minutos')
            expect(result.category).toBe('LEITURA')
            expect(result.durationMinutes).toBe(30)
        })
    })

    describe('comandos', () => {
        test('deve reconhecer "resumo" como STATS', () => {
            expect(parseMessage('resumo')).toMatchObject({ type: 'COMMAND', command: 'STATS' })
        })
        test('deve reconhecer "metas" como GOALS', () => {
            expect(parseMessage('metas')).toMatchObject({ type: 'COMMAND', command: 'GOALS' })
        })
        test('deve reconhecer "ajuda" como HELP', () => {
            expect(parseMessage('ajuda')).toMatchObject({ type: 'COMMAND', command: 'HELP' })
        })
        test('deve reconhecer "login email@email.com" como LOGIN', () => {
            expect(parseMessage('login email@email.com')).toMatchObject({ type: 'COMMAND', command: 'LOGIN' })
        })
    })

    describe('mensagens desconhecidas', () => {
        test('deve retornar UNKNOWN para mensagem sem contexto', () => {
            expect(parseMessage('olá tudo bem').type).toBe('UNKNOWN')
        })
        test('deve retornar UNKNOWN para null', () => {
            expect(parseMessage(null).type).toBe('UNKNOWN')
        })
    })
})
