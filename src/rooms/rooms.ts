import { Rooms, IRoom, IUser } from './rooms.types'
import { Context } from 'telegraf'
import { IMessage } from '../types'

export const rooms: Rooms = [{
    players: [],
    name: 'roomTest',
    status: false,
    watchers: [],
    informRoom(ctx: Context, key: string, user: IUser): void {
        console.log(user)
        const informedUsers = this.players.concat(this.watchers).filter(u => u.id !== user.id)
        let alert: string;
        switch (key) {
            case 'pjoin':
                alert = `😀 Пользователь ${user.name} присоединился к комнате как игрок.`
                break;
            case 'wjoin':
                alert = `🥸 Пользователь ${user.name} присоединился к комнате как наблюдатель.`
                break;
            case 'exit':
                alert = `😢 Пользователь ${user.name} покинул комнату.`
                break;
        }

        informedUsers.forEach(user => {
            ctx.telegram.sendMessage(user.id, alert)
        })
    }
}]

export class Room implements IRoom {
    public name: string
    public status: boolean
    public players: IUser[]
    public watchers: IUser[]
    public field?: string[][]
    constructor(name: string, player: IUser) {
        this.name = name
        this.status = false
        this.players = [player]
        this.watchers = []
    }

    public informRoom(ctx: Context, key: string, user: IUser): void {
        const informedUsers = this.players.concat(this.watchers).filter(u => u.id !== user.id)
        const message = ctx.message as IMessage
        let alert: string;
        switch (key) {
            case 'pjoin':
                alert = `😀 Пользователь ${user.name} присоединился к комнате как игрок.`
                break;
            case 'wjoin':
                alert = `🥸 Пользователь ${user.name} присоединился к комнате как наблюдатель.`
                break;
            case 'exit':
                alert = `😢 Пользователь ${user.name} покинул комнату.`
                break;
            case 'msg':
                alert = `🗣${user.name}: ${message.text}`
        }

        informedUsers.forEach(user => {
            ctx.telegram.sendMessage(user.id, alert)
        })
    }
}

export class User implements IUser {
    public id: number
    public name: string

    constructor(id: number, name: string) {
        this.id = id
        this.name = name
    }
}