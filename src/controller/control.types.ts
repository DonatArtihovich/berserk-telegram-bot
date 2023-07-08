import { Context } from 'telegraf'

export interface IController {
    sendDefaultMessage: (ctx: Context, command: string) => void
}