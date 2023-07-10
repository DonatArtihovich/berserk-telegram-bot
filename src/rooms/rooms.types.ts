import { Context } from "telegraf"

export type Rooms = IRoom[]

export interface IRoom {
    name: string
    status: boolean
    players: IUser[]
    watchers: IUser[]
    isOnGame: boolean
    field?: string[][]
    informRoom: (ctx: Context, key: string, user: IUser) => void
}

export interface IUser {
    id: number,
    name: string
}