import { Telegraf, Context, Markup } from 'telegraf'
import { message } from 'telegraf/filters'
import { findRoomForUser } from './controller/control'
import dotenv from 'dotenv'
import * as Text from './text'
import Controller from './controller/control'
import { IMessage } from './types'
import { requireDecklist } from './game/game'
dotenv.config()

const token: string | undefined = process.env.TOKEN
if (token == null) throw new Error('Bot isn\'t founded')
const bot: Telegraf<Context> = new Telegraf(token)
const controller: Controller = new Controller()

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

bot.command('room', controller.createRoom)
bot.command('exit', controller.leaveRoom)
bot.command('roominfo', controller.showRoom)
bot.command('rooms', controller.showAllRooms)
bot.command('play', controller.startGame)
bot.command('join', (ctx) => {
    const message = ctx.message as IMessage
    const messageText = message.text

    controller.joinRoom(ctx, messageText.split(' ')[1])
})
bot.command('watch', (ctx) => {
    const message = ctx.message as IMessage
    const messageText = message.text

    controller.joinRoom(ctx, messageText.split(' ')[1], true)
})

bot.on(message('text'), (ctx: Context) => {
    const message = ctx.message as IMessage
    const messageText = message.text
    if (!messageText.startsWith('/')) controller.sendMessage(ctx)
})

bot.action('help', (ctx: Context) => {
    ctx.answerCbQuery()
    ctx.reply(Text.helpMessage, Markup.inlineKeyboard([Markup.button.callback('Закрыть', 'close')]))
})
bot.action('room', (ctx) => {
    ctx.answerCbQuery()
    controller.createRoom(ctx)
})
bot.action('exit', (ctx) => {
    ctx.deleteMessage()
    controller.leaveRoom(ctx)
})
bot.action('roominfo', (ctx) => {
    ctx.editMessageReplyMarkup({ inline_keyboard: [[Markup.button.callback('Выйти', 'exit')], [Markup.button.callback('Начать игру', 'play')]] });
    controller.showRoom(ctx)
})
bot.action('rooms', (ctx) => {
    ctx.answerCbQuery()
    controller.showAllRooms(ctx)
})
bot.action('close', (ctx) => {
    ctx.deleteMessage()
})
bot.action('play', (ctx) => {
    ctx.answerCbQuery()
    controller.startGame(ctx)
})
bot.action('add_deck', (ctx) => {
    ctx.deleteMessage()
    requireDecklist(ctx)
})

bot.launch()