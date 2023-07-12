import { IDeck } from '../game/game.types'
import { Players, IPlayer } from './players.types'

export const players: Players = []

export class Player implements IPlayer {
    public decks: IDeck[]
    public winsCount: number
    public losesCount: number
    public drawsCount: number
    constructor(
        public id: number
    ) {
        this.winsCount = 0
        this.losesCount = 0
        this.drawsCount = 0
        this.decks = []
    }
}