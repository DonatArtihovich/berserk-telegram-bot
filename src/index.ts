import { Telegraf, Context } from 'telegraf'
import { message } from 'telegraf/filters'
import dotenv from 'dotenv'
import * as Text from './text'
import Controller from './controller/control'
import { IMessage } from './types'
dotenv.config()

const token: string | undefined = process.env.TOKEN
if (token == null) throw new Error('Bot isn\'t founded')
const bot: Telegraf<any> = new Telegraf(token)
const controller: Controller = new Controller()

bot.start((ctx: Context) => {
    ctx.reply(Text.startMessage)
})

bot.help((ctx: Context) => {
    ctx.reply(Text.helpMessage)
})

bot.command('room', (ctx) => controller.createRoom(ctx))
bot.command('exit', (ctx) => controller.leaveRoom(ctx))
bot.command('roominfo', (ctx) => controller.showRoom(ctx))
bot.command('rooms', (ctx) => controller.showAllRooms(ctx))
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

bot.launch()