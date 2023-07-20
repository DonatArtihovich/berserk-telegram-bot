import { Card, IDeck, IGamePlayer, ISquad } from "./game.types";

export class GamePlayer implements IGamePlayer {
    public id: number
    public deck: IDeck
    public squad: ISquad
    public grave: Card[]
    public handMessages: number[]

    constructor(id: number, deck: IDeck) {
        this.id = id
        this.deck = deck
        this.squad = new Squad()
        this.grave = []
        this.handMessages = []
    }
}

class Squad implements ISquad {
    public fliers: Card[]
    public field: Card[]
    public startArrangement: Card[][]
    public arrangingIndex?: number

    constructor() {
        this.fliers = []
        this.field = []
        this.startArrangement = [new Array(5).fill(null), new Array(5).fill(null), new Array(5).fill(null)]
    }
}