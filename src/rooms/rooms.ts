import { Rooms, IRoom, IUser } from './rooms.types'
import { Context, Markup } from 'telegraf'
import { IMessage } from '../types'
import { InlineKeyboardButton, Message } from 'telegraf/typings/core/types/typegram'
import { findRoomForUser } from '../controller/control'
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

    public informRoom(ctx: Context, key: string, user: IUser, msg?: string): Promise<Message> {
        return new Promise(resolve => {
            const informedUsers = !key.startsWith('gen_') ? this.players.concat(this.watchers).filter(u => u.id !== user.id) : this.players.concat(this.watchers)
            const message = ctx.message as IMessage

            if (key === 'msg' && message.text.length > 2392) {
                ctx.reply('🚫Слишком длинное сообщение!')
                return
            }

            let menu: null | InlineKeyboardButton[][] = null
            let alert: string;
            switch (key) {
                case 'pjoin':
                    menu = [[Markup.button.callback('Начать игру', 'play')]]
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
                    break;
                default:
                    alert = msg as string
            }

            informedUsers.forEach((user, index) => {
                if (menu && findRoomForUser(user.id)?.players.findIndex(p => p.id === user.id) !== -1) {
                    ctx.telegram.sendMessage(user.id, alert, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
                        .then((res) => {
                            if (index === informedUsers.length - 1) {
                                resolve(res)
                            }
                        })
                } else {
                    ctx.telegram.sendMessage(user.id, alert, { parse_mode: 'HTML' })
                        .then((res) => {
                            if (index === informedUsers.length - 1) {
                                resolve(res)
                            }
                        })
                }
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