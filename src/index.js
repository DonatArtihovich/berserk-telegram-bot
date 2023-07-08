import { Telegraf } from 'telegraf'
import dotenv from 'dotenv'
import * as Text from './text.js'
dotenv.config()

const bot = new Telegraf(process.env.TOKEN)

bot.start((ctx) => {
    ctx.reply(Text.startMessage)
})

bot.help((ctx) => {
    ctx.reply(Text.helpMessage)
})

bot.launch()