import { Telegraf, Context } from 'telegraf'
import dotenv from 'dotenv'
import * as Text from './text'
import Controller from './controller/control'
dotenv.config()

const token: string | undefined = process.env.TOKEN
if (token == null) throw new Error('Bot isn\'t founded')
const bot: Telegraf = new Telegraf(token)
const controller: Controller = new Controller()

bot.start((ctx) => {
    ctx.reply(Text.startMessage)
})

bot.help((ctx) => {
    ctx.reply(Text.helpMessage)
})

bot.on('text', (ctx: Context) => {
    controller.reply(ctx)
})

bot.launch()