import { IDeck } from '../game/game.types'
import { Players, IPlayer } from './players.types'

export const players: Players = [
    {
        id: 1368480274,
        decks: [
            {
                name: 'демоны',
                list: [
                    { name: 'рогатый демон', count: 3 },
                    { name: 'вампир', count: 3 },
                    { name: 'костедробитель', count: 3 },
                    { name: 'рагнар', count: 3 },
                    { name: 'ведьма слуа', count: 3 },
                    { name: 'айрин', count: 3 },
                    { name: 'суккуб-истязатель', count: 2 },
                    { name: 'молотобоец', count: 3 },
                    { name: 'лунная баньши', count: 2 },
                    { name: 'ртунх', count: 2 },
                    { name: 'ледовый охотник', count: 3 }
                ],
                count: 30
            }
        ],
        winsCount: 0,
        losesCount: 0,
        drawsCount: 0,
    },
    {
        id: 1562903450,
        decks: [
            {
                name: 'демоны',
                list: [
                    { name: 'рогатый демон', count: 3 },
                    { name: 'вампир', count: 3 },
                    { name: 'костедробитель', count: 3 },
                    { name: 'рагнар', count: 3 },
                    { name: 'ведьма слуа', count: 3 },
                    { name: 'айрин', count: 3 },
                    { name: 'суккуб-истязатель', count: 2 },
                    { name: 'молотобоец', count: 3 },
                    { name: 'лунная баньши', count: 2 },
                    { name: 'ртунх', count: 2 },
                    { name: 'ледовый охотник', count: 3 }
                ],
                count: 30
            }
        ],
        winsCount: 0,
        losesCount: 0,
        drawsCount: 0,
    }
]

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