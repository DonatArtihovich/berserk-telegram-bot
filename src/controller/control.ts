import { Context } from 'telegraf'
import { IController } from './control.types'
import { rooms } from '../rooms/rooms'

export default class Controller implements IController {
    public createRoom(ctx: Context, name: string) {
        if (!ctx) throw new Error('ctx is not defined!')
        const userId = ctx.from?.id as number
        const newRoom = {
            name,
            players: [{ id: userId }]
        }

        rooms.push(newRoom)
        ctx.replyWithHTML(`✅Комната под названием ${name} создана! Пригласите сюда оппонента и зрителей!\n\n😀<i>Оппонент должен ввести <code>/join ${name}</code>, чтобы присоединиться как игрок,\n🥸зритель должен ввести <code>/watch ${name}</code>, чтобы присоединиться как зритель</i>`)
        console.log(rooms, rooms[0].players)
    }

    public sendDefaultMessage(ctx: Context, command: string): void {
        const defaultMessage = command[0] === '/' ? 'Пока не добавлено' : 'Команда не распознана'
        ctx.reply(defaultMessage)
    }
}