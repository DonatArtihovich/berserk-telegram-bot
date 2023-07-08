import { Context } from 'telegraf'

export default class Controller {
    reply(ctx: Context) {
        ctx.reply('Пока не добавлено')
    }
}