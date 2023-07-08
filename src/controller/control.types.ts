import { Context } from 'telegraf'

export interface IController {
    reply: (ctx: Context) => void
}