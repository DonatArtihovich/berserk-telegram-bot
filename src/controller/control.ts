import { Context, Markup } from 'telegraf'
import { IController } from './control.types'
import { rooms, Room, User } from '../rooms/rooms'
import { IRoom, IUser } from '../rooms/rooms.types'
import Deck from '../game/deck'
import { Game } from '../game/game'
import { IGame } from '../game/game.types'

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

        const replyText = `✅Комната под названием <code>${roomName}</code> создана! Пригласите сюда оппонента и зрителей!\n\n😀<i>Оппонент должен ввести <code>/join ${roomName}</code>, чтобы присоединиться как игрок,\n🥸зритель должен ввести <code>/watch ${roomName}</code>, чтобы присоединиться как зритель</i>`

        const menu = Markup.inlineKeyboard([
            [Markup.button.callback('Начать игру', 'play')],
            [Markup.button.callback('Подробности', 'roominfo')],
            [Markup.button.callback('Удалить и выйти', 'exit')]
        ])

        ctx.replyWithHTML(replyText, menu)
    }

    public joinRoom(ctx: Context, roomName: string, watcher = false): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        if (roomName == undefined) {
            ctx.replyWithHTML('🚫<i>Комната не найдена</i>')
            return
        }

        const room = rooms.find(r => r.name === roomName.trim())
        const userId = ctx.from?.id as number

        const curRoom: IRoom | undefined = findRoomForUser(userId)
        if (curRoom !== undefined) {
            ctx.replyWithHTML(`🚫<i>Вы уже находитесь в комнате <b>${curRoom.name}</b>.</i>`)
            return
        }

        const userName = ctx.from?.first_name as string
        if (room?.players.findIndex(p => p.id === userId) !== -1) {
            ctx.replyWithHTML(`🚫<i>Комнаты <b>${roomName}</b> не существует.</i>`)
            return
        }

        const user: IUser = new User(userId, userName)

        const menu = Markup.inlineKeyboard([
            [Markup.button.callback('Подробности', 'roominfo')],
            [Markup.button.callback('Выйти', 'exit')]
        ])

        if (room.players.length < 2 && !watcher) {

            room.players.push(user)
            ctx.replyWithHTML(`😀Вы добавлены в комнату <b>${room.name}</b> как игрок! Приятной игры!`, menu)

            room.informRoom(ctx, 'pjoin', user)
        } else {

            room.watchers.push(user)
            ctx.replyWithHTML(`🥸Вы добавлены в комнату <b>${room.name}</b> как зритель.`, menu)

            room.informRoom(ctx, 'wjoin', user)
        }
    }

    public leaveRoom(ctx: Context): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        const userId = ctx.from?.id as number
        const curRoom: IRoom | undefined = findRoomForUser(userId)

        if (curRoom === undefined) {
            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате.</i>')
        } else {

            const userStatusArr = curRoom.players.findIndex(u => u.id === userId) !== -1 ? curRoom.players : curRoom.watchers as IUser[]
            const userIndex = userStatusArr.findIndex(u => u.id === userId)

            curRoom.informRoom(ctx, 'exit', userStatusArr[userIndex])

            userStatusArr.splice(userIndex, 1)

            ctx.replyWithHTML(`🚪Вы покинули комнату <b>${curRoom.name}</b>`)
            if (curRoom.players.length === 0 && curRoom.watchers.length === 0) rooms.splice(rooms.indexOf(curRoom), 1)
        }
    }

    public showRoom(ctx: Context): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        const userId = ctx.from?.id as number
        const curRoom: IRoom | undefined = findRoomForUser(userId)

        if (curRoom === undefined) {
            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате.</i>')
        } else {

            const playerMenu = Markup.inlineKeyboard([[Markup.button.callback('Начать игру', 'play')], [Markup.button.callback('Выйти', 'exit')], [Markup.button.callback('Закрыть', 'close')]])
            const watcherMenu = Markup.inlineKeyboard([[Markup.button.callback('Выйти', 'exit')], [Markup.button.callback('Закрыть', 'close')]])
            const menu = isPlayer(userId, curRoom) ? playerMenu : watcherMenu

            const playersInRoom = curRoom.players.map(p => p.name)
            const watchersInRoom = curRoom.watchers.map(w => w.name)

            const players = playersInRoom.length ? `😀${playersInRoom.join('\n😀')}` : '🚫<i>Игроков нет</i>🚫'
            const watchers = watchersInRoom.length ? `🥸${watchersInRoom.join('\n🥸')}` : '🚫<i>Зрителей нет</i>🚫'
            const isOnGame = curRoom.status ? '✅Игра идет✅' : '🚫Игра еще не началась / уже закончилась🚫'

            const message = `📰<b>Информация о комнате</b> <code>${curRoom.name}</code>\n🗞<b>Владелец</b> - ${playersInRoom[0]}\n\n<b>Игроки:</b>\n${players}\n\n<b>Зрители:</b>\n${watchers}\n\n<b>Статус игры:</b> ${isOnGame}`
            ctx.replyWithHTML(message, menu)
        }
    }

    public showAllRooms(ctx: Context): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        const roomNames = rooms.map(room => `<code>${room.name}</code>`)
        const list = roomNames.length === 0 ? '<i>🚫Доступных комнат нет🚫</i>' : `🗞${roomNames.join('\n🗞')}`
        const message = `📰<b>Список доступных комнат:</b>\n\n${list}`

        ctx.replyWithHTML(message, Markup.inlineKeyboard([Markup.button.callback('Закрыть', 'close')]))
    }

    public prepareGame(ctx: Context): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        const userId = ctx.from?.id as number
        const curRoom: IRoom | undefined = findRoomForUser(userId)

        if (curRoom == undefined) {

            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате.</i>')
            return
        } else if (!isPlayer(userId, curRoom)) {

            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        if (curRoom.isOnGame) return

        curRoom.isOnGame = true
        curRoom.watchers.forEach(async (u) => {
            ctx.telegram.sendMessage(u.id, '🗡Игра запущена!🛡')
        })

        const game: IGame = new Game(curRoom)
        curRoom.game = game

        game.changeStatus('lobby')
        Deck.requireDecks(ctx, curRoom)
    }

    public sendMessage(ctx: Context): void {
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

export function findRoomForUser(userId: number): IRoom | undefined {
    const curRoom: IRoom | undefined = rooms.find(r =>
        r.players.find(p => p.id === userId) !== undefined
        || r.watchers?.find(w => w.id === userId) !== undefined)

    return curRoom
}

function isPlayer(userId: number, room: IRoom): boolean {
    return room.players.findIndex(p => p.id === userId) !== -1
}