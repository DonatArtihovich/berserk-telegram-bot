import { Context } from 'telegraf'

export interface IController {
    createRoom: (ctx: Context, name: string) => void
    sendDefaultMessage: (ctx: Context, command: string) => void
}