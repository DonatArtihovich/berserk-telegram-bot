import { Context } from "telegraf"
import { IRoom } from "../rooms/rooms.types"

export interface IDeck {
    name: string
    list: ICard[]
    count?: number
}

export interface ICard {
    count: number
    name: string
}

export interface IGame {
    status: 'on' | 'off' | 'lobby'
    players: IGamePlayer[]
    readonly room: IRoom
    changeStatus: (status: 'on' | 'off' | 'lobby') => void
    startGame: (ctx: Context) => void
}

export interface IGamePlayer {
    id: number
    deck: IDeck
}
