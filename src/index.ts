import { Telegraf, Context } from 'telegraf'
import { message } from 'telegraf/filters'
// import { Message } from 'telegraf/typings/core/types/typegram'
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
// function handleMessage(ctx: Context) {
// if (!ctx) throw new Error('ctx is not defined!')
// if (ctx.message == undefined) throw new Error('message isn\'t defined')
// const userId = ctx.from?.id as number
// const message = ctx.message as IMessage
// const messageText = message.text
// console.log(messageText)
// if (messageText == undefined) return
// console.log(command)
// switch (command) {
// case '/room':
//     controller.createRoom(ctx)
//     break;
// case '/join':
//     controller.joinRoom(ctx, messageText.split(' ')[1])
//     break;
// case '/watch':
//     controller.joinRoom(ctx, messageText.split(' ')[1], true)
//     break;
// case '/exit':
//     controller.leaveRoom(ctx)
//     break;
// case '/roominfo':
//     controller.showRoom(ctx)
//     break;
// case '/rooms':
//     controller.showAllRooms(ctx)
//     break;
//     default: controller.sendMessage(ctx, command)
//         break;
// }
// }

bot.launch()