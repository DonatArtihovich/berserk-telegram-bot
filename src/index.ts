import { Telegraf, Context } from 'telegraf'
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

bot.on('message', (ctx: Context) => {
    handleMessage(ctx)
})

function handleMessage(ctx: Context) {
    if (!ctx) throw new Error('ctx is not defined!')
    if (ctx.message == undefined) throw new Error('message isn\'t defined')
    // const userId = ctx.from?.id as number
    const message = ctx.message as IMessage
    const messageText = message.text
    console.log(messageText)
    if (messageText == undefined) return
    const command = messageText.split(' ')[0]
    console.log(command)
    switch (command) {
        case '/room':
            controller.createRoom(ctx, messageText.split(' ')[1])
            break
        default: controller.sendDefaultMessage(ctx, command)
            break;
    }
}

bot.launch()