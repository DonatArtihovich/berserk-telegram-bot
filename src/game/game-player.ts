import { Card, IDeck, IGame, IGameCard, IGamePlayer, ISquad } from "./game.types";

export class GamePlayer implements IGamePlayer {
    public id: number
    public name: string
    public game?: IGame
    public deck: IDeck
    public squad: ISquad
    public fliers: IGameCard[]
    public grave: IGameCard[]
    public handMessages: number[]

    constructor(id: number, name: string, deck: IDeck) {
        this.id = id
        this.name = name
        this.deck = deck
        this.squad = new Squad()
        this.fliers = []
        this.grave = []
        this.handMessages = []
    }
}

class Squad implements ISquad {
    public fliers: Card[]
    public field: Card[]
    public startArrangement: Card[][]
    public arrangingIndex: number
    public crystals: { gold: number, silver: number }
    public isHandKeeped: boolean

    constructor() {
        this.fliers = []
        this.field = []
        this.startArrangement = [new Array(5).fill(null), new Array(5).fill(null), new Array(5).fill(null)]
        this.arrangingIndex = 0
        this.crystals = { gold: 0, silver: 0 }
        this.isHandKeeped = false
    }
}