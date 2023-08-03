import { Context } from "telegraf"
import { IGame } from "../game/game.types"
import { Message } from "telegraf/typings/core/types/typegram"

export type Rooms = IRoom[]

export interface IRoom {
    name: string
    status: boolean
    players: IUser[]
    watchers: IUser[]
    isOnGame: boolean
    game?: IGame
    informRoom: (ctx: Context, key: string, user: IUser, message?: string) => Promise<Message>
}

export interface IUser {
    id: number,
    name: string
}