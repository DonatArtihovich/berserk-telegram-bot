import { Context } from "telegraf"
import { IRoom } from "../rooms/rooms.types"

export interface IDeck {
    name: string
    list: ICard[]
    count: number
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
    finishArranging: (ctx: Context) => void
    generateHands: (ctx: Context) => void
}

export interface IGamePlayer {
    id: number
    name: string
    game?: IGame
    deck: IDeck
    squad: ISquad
    grave: Card[]
    handMessages: number[]
}

export interface ISquad {
    fliers: Card[]
    field: Card[]
    startArrangement: (Card | null)[][]
    arrangingArr?: { name: string, index: number }[]
    arrangingIndex?: number
}

export interface Card {
    name: string
    cost: number
    elite: boolean
    class: string
    uniqueness: boolean
    element: string
    stats: {
        lifeCount: number
        walkCount: string
        simpleHit: string
    }
    abilities: string
    rarity: string
    index: number
    description: string
    set: string
    image: string
    arrIndex?: number
}