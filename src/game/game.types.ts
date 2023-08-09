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
    battleField: (IGameCard | null)[][]
    currentPlayer: IGamePlayer | null
    areHandsKeeped: boolean
    readonly room: IRoom
    changeStatus: (status: 'on' | 'off' | 'lobby') => void
    startGame: (ctx: Context) => void
    finishArranging: (ctx: Context) => void
    endTurn: (ctx: Context) => void
}

export interface IGamePlayer {
    id: number
    name: string
    game?: IGame
    deck: IDeck
    squad: ISquad
    grave: IGameCard[]
    fliers: IGameCard[]
    handMessages: number[]
}

export interface ISquad {
    fliers: Card[]
    field: Card[]
    startArrangement: (Card | null)[][]
    crystals: { gold: number, silver: number }
    isHandKeeped: boolean
    arrangingArr?: { name: string, index: number }[]
    arrangingIndex?: number
}

export interface Card {
    name: string
    cost: number
    elite: boolean
    class: string | null
    uniqueness: boolean
    element: string
    stats: {
        lifeCount: number
        walkCount: string
        simpleHit: string
    }
    abilities: string | null
    rarity: string
    index: number
    description: string | null
    set: string
    image: string
    arrIndex?: number
}

export interface IGameCard extends Card {
    owner: IGamePlayer
    isHidden: boolean
    isTapped: boolean
}