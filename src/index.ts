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

bot.command('deck', Deck.chooseDeck)

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

bot.action('cancel_add', (ctx) => {
    const userId = ctx.from?.id as number
    const { message, menu } = Deck.printDecks(userId)

    ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
})

bot.launch()