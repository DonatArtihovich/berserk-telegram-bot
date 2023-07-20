import { Telegraf, Context, Markup } from 'telegraf'
import { message } from 'telegraf/filters'
import { findRoomForUser } from './controller/control'
import dotenv from 'dotenv'
import * as Text from './text'
import Controller from './controller/control'
import { IMessage } from './types'
import Deck from './game/deck'
dotenv.config()

const token: string | undefined = process.env.TOKEN
if (token == undefined) throw new Error('Bot isn\'t founded')

const bot: Telegraf<Context> = new Telegraf(token)
const app: Controller = new Controller()

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

// bot.command('deck', Deck.chooseDeck)

bot.hears(/^(.|\n)+$\n(^\d+\s[а-яА-Яa-zA-Z]+)+/gm, (ctx) => Deck.addDeck(ctx))

bot.on(message('text'), (ctx: Context) => {
    const message = ctx.message as IMessage
    const messageText = message.text

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
    ctx.editMessageReplyMarkup({
        inline_keyboard: [[Markup.button.callback('Начать игру', 'play')], [Markup.button.callback('Выйти', 'exit')]]
    });

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
    Deck.requireDecklist(ctx)
})

bot.action(/^choose-deck_/, (ctx) => {
    ctx.answerCbQuery()

    const deckName = ctx.match.input.split('_').slice(1).join('_')
    Deck.chooseDeck(ctx, deckName)
})

bot.action('cancel_add-deck', (ctx) => {
    const userId = ctx.from?.id as number
    const { message, menu } = Deck.printDecks(userId)

    ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
})

bot.action('mulligan', async (ctx) => {
    ctx.answerCbQuery()
    Deck.mulliganHand(ctx)
})

bot.action(/^squad_/, (ctx) => {
    ctx.answerCbQuery()
    const cardName = ctx.match.input.split('_')[1]

    Deck.addCardToSquad(ctx, cardName)

    const menu = [
        [Markup.button.callback('🔙Отмена', `cancel_squad-${cardName}`)]
    ]

    const cardInfoArr = Deck.parseCard(cardName).split(' ')
    const cardElement = cardInfoArr[cardInfoArr.length - 1]
    const cardCost = cardInfoArr[0]
    ctx.editMessageText(`Карта ${cardElement}<b>${cardName}</b>(${cardCost}) взята в отряд!`, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
})

bot.action(/^info_/, (ctx) => {
    ctx.answerCbQuery()

    const cardName = ctx.match.input.split('_')[1]

    const menu = [
        [
            Markup.button.callback('➕Взять в отряд', `squad_${cardName}`),
            Markup.button.callback('🔙Менее', `cancel_info-${cardName}`)
        ]
    ]

    ctx.editMessageText(Deck.parseCard(cardName, true), { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
})

bot.action(/^(cancel_info|cancel_squad)-/, (ctx) => {
    ctx.answerCbQuery()

    const cardName = ctx.match.input.split('-').slice(1).join('-')

    if (ctx.match.input.startsWith('cancel_squad-')) {
        Deck.deleteCardFromSquad(ctx, cardName)
    }

    const menu = [
        [
            Markup.button.callback('➕', `squad_${cardName}`),
            Markup.button.callback('❔', `info_${cardName}`)
        ]
    ]

    ctx.editMessageText(Deck.parseCard(cardName), { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
})

bot.action('arrange-squad', (ctx) => {
    ctx.answerCbQuery()
    Deck.startArranging(ctx)
})

bot.launch()