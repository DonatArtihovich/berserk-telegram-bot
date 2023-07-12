import { Context } from "telegraf"
import { IGame } from "../game/game.types"

export type Rooms = IRoom[]

export interface IRoom {
    name: string
    status: boolean
    players: IUser[]
    watchers: IUser[]
    isOnGame: boolean
    game?: IGame
    informRoom: (ctx: Context, key: string, user: IUser) => void
}

export interface IUser {
    id: number,
    name: string
}