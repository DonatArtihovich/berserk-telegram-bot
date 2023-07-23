import { Rooms, IRoom, IUser } from './rooms.types'
import { Context } from 'telegraf'
import { IMessage } from '../types'
import { Message } from 'telegraf/typings/core/types/typegram'
// import {requireDecks}

export const rooms: Rooms = []

export class Room implements IRoom {
    public name: string
    public status: boolean
    public players: IUser[]
    public watchers: IUser[]
    public isOnGame: boolean
    public field?: string[][]
    constructor(name: string, player: IUser) {
        this.name = name
        this.status = false
        this.players = [player]
        this.watchers = []
        this.isOnGame = false
    }

    public informRoom(ctx: Context, key: string, user: IUser): Promise<Message> {
        return new Promise(resolve => {
            const informedUsers = !key.startsWith('gen_') ? this.players.concat(this.watchers).filter(u => u.id !== user.id) : this.players.concat(this.watchers)
            const message = ctx.message as IMessage

            if (key === 'msg' && message.text.length > 2392) {
                ctx.reply('🚫Слишком длинное сообщение!')
                return
            }

            let alert: string;
            switch (key) {
                case 'pjoin':

                    alert = `😀 Пользователь <b>${user.name}</b> присоединился к комнате как игрок.`
                    break;
                case 'wjoin':

                    alert = `🥸 Пользователь <b>${user.name}</b> присоединился к комнате как наблюдатель.`
                    break;
                case 'exit':

                    alert = `😢 Пользователь <b>${user.name}</b> покинул комнату.`
                    break;
                case 'deck':

                    alert = `🃏 Пользователь <b>${user.name}</b> выбрал колоду для игры.`
                    break;
                case 'gen_start':

                    alert = '✅Колоды выбраны! Набирайте отряды.'
                    break;
                case 'finish-arranging':
                    alert = `🗺 Пользователь <b>${user.name}</b> расставил свой отряд.`;
                    break;
                case 'gen_start-battle':

                    alert = '🎮Начинаем игру!'
                    break;
                case 'msg':

                    alert = `🗣<b>${user.name}</b>: ${message.text}`
            }

            informedUsers.forEach((user, index) => {
                ctx.telegram.sendMessage(user.id, alert, { parse_mode: 'HTML' })
                    .then((res) => {
                        if (index === informedUsers.length - 1) {
                            resolve(res)
                        }
                    })
            })
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