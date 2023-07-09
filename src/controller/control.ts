import { Context } from 'telegraf'
import { IController } from './control.types'
import { rooms, Room, User } from '../rooms/rooms'
import { IRoom, IUser } from '../rooms/rooms.types'

export default class Controller implements IController {
    public createRoom(ctx: Context): void {
        if (!ctx) throw new Error('ctx is not defined!')
        const userId = ctx.from?.id as number

        const curRoom: IRoom | undefined = findRoomForUser(userId)
        if (curRoom !== undefined) {
            ctx.replyWithHTML(`🚫Вы уже находитесь в комнате <b>${curRoom.name}</b>!`)
            return
        }

        const userName = ctx.from?.first_name as string
        const roomName: string = generateRandomRoomName()
        const player: IUser = new User(userId, userName)
        const newRoom: IRoom = new Room(roomName, player)

        rooms.push(newRoom)
        ctx.replyWithHTML(`✅Комната под названием <code>${roomName}</code> создана! Пригласите сюда оппонента и зрителей!\n\n😀<i>Оппонент должен ввести <code>/join ${roomName}</code>, чтобы присоединиться как игрок,\n🥸зритель должен ввести <code>/watch ${roomName}</code>, чтобы присоединиться как зритель</i>`)
        console.log(rooms, rooms[0].players)
    }

    public joinRoom(ctx: Context, roomName: string, watcher = false): void {
        const room = rooms.find(r => r.name === roomName.trim())
        const userId = ctx.from?.id as number

        const curRoom: IRoom | undefined = findRoomForUser(userId)
        if (curRoom !== undefined) {
            ctx.replyWithHTML(`🚫Вы уже находитесь в комнате <b>${curRoom.name}</b>!`)
            return
        }

        const userName = ctx.from?.first_name as string
        if (room?.players.findIndex(p => p.id === userId) !== -1) {
            ctx.reply(`🚫Комнаты ${roomName} не существует!`)
            return
        }

        const user: IUser = new User(userId, userName)
        if (room.players.length < 2 && !watcher) {
            room.players.push(user)
            ctx.replyWithHTML(`😀Вы добавлены в комнату <b>${room.name}</b> как игрок! Приятной игры!`)
            room.informRoom(ctx, 'pjoin', user)
            console.log(room)
        } else {
            room.watchers.push(user)
            ctx.replyWithHTML(`🥸Вы добавлены в комнату <b>${room.name}</b> как наблюдатель.`)
            room.informRoom(ctx, 'wjoin', user)
            console.log(room)
        }
    }

    public leaveRoom(ctx: Context): void {
        const userId = ctx.from?.id as number
        const curRoom: IRoom | undefined = findRoomForUser(userId)

        if (curRoom === undefined) {
            ctx.reply('🚫Вы не находитесь в комнате.😐')
        } else {
            const userStatusArr = curRoom.players.findIndex(u => u.id === userId) !== -1 ? curRoom.players : curRoom.watchers as IUser[]
            const userIndex = userStatusArr.findIndex(u => u.id === userId)

            curRoom.informRoom(ctx, 'exit', userStatusArr[userIndex])
            userStatusArr.splice(userIndex)
            ctx.replyWithHTML(`✅вы покинули комнату <b>${curRoom.name}</b>😢`)
            console.log(userStatusArr, userIndex, userStatusArr[userIndex])
        }
    }

    public showRoom(ctx: Context): void {
        const userId = ctx.from?.id as number
        const curRoom: IRoom | undefined = findRoomForUser(userId)

        if (curRoom === undefined) {
            ctx.reply('🚫Вы не находитесь в комнате.😐')
        } else {
            const playersInRoom = curRoom.players.map(p => p.name)
            const watchersInRoom = curRoom.watchers.map(w => w.name)
            const players = playersInRoom.length ? `😀${playersInRoom.join('\n😀')}` : '🚫<i>Игроков нет</i>🚫'
            const watchers = watchersInRoom.length ? `🥸${watchersInRoom.join('\n🥸')}` : '🚫<i>Наблюдателей нет</i>🚫'
            const isOnGame = curRoom.status ? '✅Игра идет✅' : '🚫Игра еще не началась / уже закончилась🚫'

            const message = `📰<b>Информация о комнате</b> <code>${curRoom.name}</code>\n🗞<b>Владелец</b> - ${playersInRoom[0]}\n\n<b>Игроки:</b>\n${players}\n\n<b>Наблюдатели:</b>\n${watchers}\n\n<b>Статус игры:</b> ${isOnGame}`
            ctx.replyWithHTML(message)
        }
    }

    public showAllRooms(ctx: Context): void {
        const roomNames = rooms.map(room => `<code>${room.name}</code>`)
        const message = `📰<b>Список доступных комнат:</b>\n\n🗞${roomNames.join('\n🗞')}`
        ctx.replyWithHTML(message)
    }

    public sendMessage(ctx: Context, command: string): void {
        if (command[0] === '/') {
            ctx.reply('Команда не распознана')
            return
        }
        const userId = ctx.from?.id as number
        const userName = ctx.from?.first_name as string
        const curRoom: IRoom | undefined = findRoomForUser(userId)
        if (curRoom !== undefined) {
            curRoom.informRoom(ctx, 'msg', new User(userId, userName))
        }
    }
}

function generateRandomRoomName(): string {
    const alph = 'abcdefghigklmnopqrstuvwxuzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let subStr = ''

    while (subStr.length <= 10) {
        const idx = Math.floor(Math.random() * (alph.length - 1))
        const letter = alph[idx]

        subStr += letter
    }
    return `room${subStr}`
}

function findRoomForUser(userId: number): IRoom | undefined {
    const curRoom: IRoom | undefined = rooms.find(r =>
        r.players.find(p => p.id === userId) !== undefined
        || r.watchers?.find(w => w.id === userId) !== undefined)

    return curRoom
}