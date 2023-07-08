export type Rooms = IRoom[]

export interface IRoom {
    name: string
    players: IUser[]
    watchers?: IUser[]
    field?: string[][]
}

interface IUser {
    id: number
}