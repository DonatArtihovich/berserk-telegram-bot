import { Context } from 'telegraf'
import { IController } from './control.types'

export default class Controller implements IController {
    public sendDefaultMessage(ctx: Context, command: string): void {
        const defaultMessage = command[0] === '/' ? 'Пока не добавлено' : 'Команда не распознана'
        ctx.reply(defaultMessage)
    }
}