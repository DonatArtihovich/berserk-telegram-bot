import { Telegraf, Context, Markup } from 'telegraf'
import { message } from 'telegraf/filters'
import { findRoomForUser } from './controller/control'
import dotenv from 'dotenv'
import * as Text from './text'
import Controller from './controller/control'
import { IMessage } from './types'

dotenv.config()

const token = process.env.TOKEN
if (token == undefined) throw new Error('Bot isn\'t founded')

const bot: Telegraf<Context> = new Telegraf(token)
export const app: Controller = new Controller()

bot.start((ctx: Context) => {
    const room = findRoomForUser(ctx.from?.id as number)

    const roomBtn: [string, string] = room == undefined ? ['Создать комнату', 'room'] : ['Покинуть комнату', 'exit']

    const menu = Markup.inlineKeyboard([
        [Markup.button.callback(...roomBtn)],
        [Markup.button.callback('Доступные комнаты', 'rooms')],
        [Markup.button.callback('Помощь', 'help')]]
    );

    ctx.reply(Text.startMessage, menu)
})

bot.help((ctx: Context) => ctx.reply(Text.helpMessage, Markup.inlineKeyboard([Markup.button.callback('Закрыть', 'close')])))

bot.command('room', app.createRoom)

bot.command('exit', app.leaveRoom)

bot.command('roominfo', app.showRoom)

bot.command('rooms', app.showAllRooms)

bot.command('play', app.prepareGame)

bot.command('join', (ctx) => {
    const message = ctx.message as IMessage
    const messageText = message.text

    app.joinRoom(ctx, messageText.split(' ')[1])
})

bot.command('watch', (ctx) => {
    const message = ctx.message as IMessage
    const messageText = message.text

    app.joinRoom(ctx, messageText.split(' ')[1], true)
})

bot.command(/^(tap|t)$/, ctx => app.changeTappedCardStatus(ctx))
bot.command(/^(untap|ut)$/, ctx => app.changeTappedCardStatus(ctx, false))

// bot.command('deck', Deck.chooseDeck)

// bot.command('a', (ctx) => {
//     let names = Array(30).fill(null)
//     const limit = 5
//     names = names.map(cell => {
//         const index = Math.floor(Math.random() * 300)
//         const name = index < 200 ? cards[index].name.slice(0, limit) : ' '

//         if (name.length === limit) {
//             return name
//         }

//         return name.padStart(Math.floor(name.length + (limit - name.length) / 2), ' ').padEnd(limit, ' ')
//     })

//     const nameRows = names.reduce((prev, curr, i) => {
//         prev[prev.length - 1] = prev[prev.length - 1] + `${curr}|`

//         if (!((i + 1) % 5) && i !== names.length - 1) {
//             prev.push('│')
//         }

//         return prev
//     }, ['│']).join('\n')

//     console.log(names, nameRows)

//     ctx.replyWithHTML(`<code>┌──────────┬──────────┬──────────┬──────────┬──────────┐\n${nameRows}\n└──────────┴──────────┴──────────┴──────────┴──────────┘</code>`)
// })

// let id: number
// bot.command('u', async (ctx) => {
//     const matrix = Array(6).fill(null).map(() => Array(5).fill(null).map(() => Math.random() < 0.5 ? new GameCard(cards[Math.floor(Math.random() * 200)], Math.random() < 0.2) : null))
//     const fieldStream = await getField(matrix)
//     if (id == undefined) {
//         // ctx.replyWithPhoto({ source: fieldStream }, { caption: 'Поле игры:' })
//         //     .then(m => { id = m.message_id })
//         ctx.telegram.sendDocument(ctx.chat.id, { source: fieldStream, filename: 'field.png' }, { caption: 'Поле игры:' })
//     } else {
//         ctx.telegram.editMessageMedia(ctx.chat.id, id, undefined, { media: { source: fieldStream }, type: 'photo' })
//     }
// })
bot.hears(/^(.|\n)+$\n(^\d+\s[а-яА-Яa-zA-Z]+)+/gm, (ctx) => app.addDeck(ctx))

bot.on(message('text'), (ctx: Context) => {
    const message = ctx.message as IMessage
    const messageText = message.text
    console.log(ctx.chat?.id)
    if (!messageText.startsWith('/')) app.sendMessage(ctx)
})

bot.action('help', (ctx: Context) => {
    ctx.answerCbQuery()
    ctx.reply(Text.helpMessage, Markup.inlineKeyboard([Markup.button.callback('Закрыть', 'close')]))
})

bot.action('room', (ctx) => {
    ctx.answerCbQuery()
    app.createRoom(ctx)
})

bot.action('exit', (ctx) => {
    ctx.deleteMessage()
    app.leaveRoom(ctx)
})

bot.action('roominfo', (ctx) => {
    // ctx.editMessageReplyMarkup({
    //     inline_keyboard: [[Markup.button.callback('Начать игру', 'play')], [Markup.button.callback('Выйти', 'exit')]]
    // });
    ctx.answerCbQuery()

    app.showRoom(ctx)
})

bot.action('rooms', (ctx) => {
    ctx.answerCbQuery()
    app.showAllRooms(ctx)
})

bot.action('close', (ctx) => {
    ctx.deleteMessage()
})

bot.action('play', (ctx) => {
    ctx.answerCbQuery()
    app.prepareGame(ctx)
})

bot.action('add_deck', (ctx) => {
    app.requireDecklist(ctx)
})

bot.action(/^choose-deck_/, (ctx) => {
    ctx.answerCbQuery()

    const deckName = ctx.match.input.split('_').slice(1).join('_')
    app.chooseDeck(ctx, deckName)
})

bot.action('cancel_add-deck', (ctx) => {
    const userId = ctx.from?.id as number
    const { message, menu } = app.printDecks(userId)

    ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
})

bot.action('draw-hand', ctx => {
    ctx.deleteMessage()
    app.drawHand(ctx)
})

bot.action('keep-hand', ctx => app.keepHand(ctx))

bot.action('mulligan', async (ctx) => {
    ctx.answerCbQuery()
    app.mulliganHand(ctx)
})

bot.action(/^squad_/, (ctx) => {
    ctx.answerCbQuery()
    const cardName = ctx.match.input.split('_')[1]

    app.addCardToSquad(ctx, cardName)
})

bot.action(/^show_/, (ctx) => {
    ctx.answerCbQuery()
    const cardName = ctx.match.input.split('_')[1]

    app.showCard(ctx, cardName)

    // ctx.editMessageCaption(`Карта ${cardElement}<b>${cardName}</b>(${cardCost}) взята в отряд!`, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
})

// bot.action(/^info_/, (ctx) => {
//     ctx.answerCbQuery()

//     const cardName = ctx.match.input.split('_')[1]

//     const menu = [
//         [
//             Markup.button.callback('➕Взять в отряд', `squad_${cardName}`),
//             Markup.button.callback('🔙Менее', `cancel_info-${cardName}`)
//         ]
//     ]

//     ctx.editMessageText(app.parseCard(cardName, true), { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
// })

// bot.action(/^(cancel_info|cancel_squad)-/, (ctx) => {
bot.action(/^cancel_squad-/, (ctx) => {
    ctx.answerCbQuery()

    const cardName = ctx.match.input.split('-').slice(1).join('-')

    // if (ctx.match.input.startsWith('cancel_squad-')) {
    app.deleteCardFromSquad(ctx, cardName)
    // }

    const menu = [
        [Markup.button.callback('➕Взять в отряд', `squad_${cardName}`)],
        [Markup.button.callback('👁 Показать', `show_${cardName}`)],
    ]


    ctx.editMessageCaption(app.parseCard(cardName), { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
})

bot.action('arrange-squad', (ctx) => {
    ctx.answerCbQuery()
    app.startArranging(ctx)
})

bot.action(/^ar-card-place_/, (ctx) => {
    ctx.answerCbQuery()
    app.arrangeCard(ctx, ctx.match.input)
})

bot.action('arrange-next', (ctx) => {
    ctx.answerCbQuery()
    app.arrangeNext(ctx)
})

bot.action('arrange-prev', (ctx) => {
    ctx.answerCbQuery()
    app.arrangePrev(ctx)
})

bot.action('first-turn', (ctx) => app.defineTurnOrder(ctx, true))

bot.action('second-turn', (ctx) => app.defineTurnOrder(ctx, false))

bot.action('pass-turn', app.passTurn)

bot.launch()